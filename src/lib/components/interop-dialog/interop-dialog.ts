import {
  Directive,
  ElementRef,
  HostListener,
  afterNextRender,
  effect,
  inject,
  input,
  isDevMode,
  output,
  signal,
} from '@angular/core';

export type DialogCloseReason = 'backdrop' | 'escape' | 'programmatic' | 'form-submit';

export interface DialogClosedEvent {
  reason: DialogCloseReason;
}

/**
 * NOTE: Nested dialogs are architecturally possible but generally produce poor UX —
 * keeping focus and escape management clean across dialog stacks requires significant
 * complexity. This is a potential future enhancement, but the recommended pattern is
 * to avoid nested dialogs.
 */
@Directive({
  selector: 'dialog[interop-dialog]',
  standalone: true,
})
export class InteropDialog {
  private readonly el = inject(ElementRef<HTMLDialogElement>);

  // ── Inputs ─────────────────────────────────────────────────────────────────

  /**
   * Controls whether the dialog is open or closed.
   * Set to true to open, false to close.
   * When the dialog closes (via ESC, backdrop, or form-submit), respond to
   * the (closed) output and set isOpen to false to keep the signal in sync
   * with the actual dialog state.
   */
  isOpen = input<boolean>(false);

  /**
   * If true (default), clicking the backdrop (outside the dialog) will close it
   * and emit a "backdrop" close reason. Set to false to disable backdrop dismissal.
   */
  dismissOnBackdrop = input<boolean>(true);

  /**
   * If true, pressing Escape will NOT close the dialog; an explicit close button
   * is required. Default is false (ESC closes the dialog).
   */
  disableEscape = input<boolean>(false);

  /**
   * A CSS selector string for the element to automatically focus when the dialog opens.
   * If null (default), native autofocus behavior applies.
   */
  autoFocus = input<string | null>(null);

  /**
   * Where to return focus when the dialog closes. Can be an ElementRef,
   * a CSS selector string, or null (defaults to the element that was focused before open).
   */
  returnFocus = input<ElementRef | string | null>(null);

  /**
   * If true, the dialog will auto-close when a form inside it fires a submit event
   * and will emit a "form-submit" close reason.
   * Note: Do NOT use <form method="dialog"> when autoClose=true; the browser will
   * close the dialog before the directive's submit listener fires.
   * Default is false (consumer controls submit behavior).
   */
  autoClose = input<boolean>(false);

  // ── Outputs ────────────────────────────────────────────────────────────────

  /**
   * Emitted exactly once when the dialog closes, with the reason for closing:
   * - 'programmatic': isOpen was set to false
   * - 'backdrop': user clicked the backdrop
   * - 'escape': user pressed ESC
   * - 'form-submit': a form inside the dialog was submitted and autoClose=true
   */
  closed = output<DialogClosedEvent>();

  // ── Internal state ─────────────────────────────────────────────────────────

  /**
   * Captures the element that held focus before the dialog opened,
   * used as the fallback when returnFocus is null.
   */
  private readonly previousFocus = signal<Element | null>(null);

  /**
   * Reason for the in-flight close. Set by user-initiated handlers (backdrop,
   * escape, form-submit) and consumed by the native `close` event listener,
   * which is the single point of emission for the (closed) output. Null
   * means a programmatic close.
   *
   * Routing every close through the native `close` event guarantees:
   *  - exactly one (closed) emission per close, with the correct reason;
   *  - focus restoration runs after the exit transition has begun, so it
   *    doesn't interleave with the dialog still being [open] (which is what
   *    produced the dismissal flash);
   *  - the controlled `isOpen` flow stays simple — the effect just calls
   *    dialog.close() on the programmatic path.
   */
  private pendingCloseReason: DialogCloseReason | null = null;

  constructor() {
    // ── Effect: open/close driven by isOpen ──────────────────────────────────
    effect(
      () => {
        const open = this.isOpen();
        const dialog = this.el.nativeElement;

        if (open) {
          this.previousFocus.set(document.activeElement ?? null);
          if (!dialog.open) {
            dialog.showModal();
            // Schedule autoFocus for after the top-layer has been entered
            afterNextRender(() => {
              this.applyAutoFocus();
            });
          }
        } else {
          if (dialog.open) {
            // dialog.close() fires the native `close` event; the listener
            // restores focus and emits (closed). No pending reason was
            // recorded, so the emission carries reason: 'programmatic'.
            dialog.close();
          }
        }
      },
      { allowSignalWrites: true },
    );

    // ── Dev-mode validation ──────────────────────────────────────────────────
    if (isDevMode()) {
      afterNextRender(() => {
        const dialog = this.el.nativeElement;

        // Check for accessible name
        const hasLabel =
          dialog.hasAttribute('aria-label') || dialog.hasAttribute('aria-labelledby');
        if (!hasLabel) {
          console.warn(
            'InteropDialog: the <dialog> element is missing aria-label or aria-labelledby. ' +
              'Add one to announce the dialog purpose to screen readers.',
          );
        }

        // Check for CSS transform on ancestors (breaks fixed positioning)
        let el: Element | null = dialog.parentElement;
        while (el && el !== document.body) {
          const transform = getComputedStyle(el).transform;
          if (transform && transform !== 'none') {
            const tag = el.tagName.toLowerCase();
            const id = el.id ? `#${el.id}` : '';
            console.warn(
              `InteropDialog: an ancestor element (${tag}${id}) has a CSS transform applied. ` +
                'This breaks fixed positioning for the dialog backdrop and inert-ing. ' +
                'Consider moving the <dialog> outside of the transformed container.',
            );
            break;
          }
          el = el.parentElement;
        }
      });
    }
  }

  // ── Host Listeners ─────────────────────────────────────────────────────────

  /**
   * ESC key: the browser fires 'cancel' on the <dialog>, then calls
   * dialog.close() unless preventDefault is invoked. Record the reason and
   * let the browser's native close path proceed — `onClose` emits.
   */
  @HostListener('cancel', ['$event'])
  onCancel(event: Event): void {
    if (this.disableEscape()) {
      event.preventDefault();
      return;
    }
    this.pendingCloseReason = 'escape';
  }

  /**
   * Backdrop click: clicks on <dialog> itself (not children) dismiss it. The
   * browser does not auto-close on backdrop, so call dialog.close() after
   * recording the reason; `onClose` emits.
   */
  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (!this.dismissOnBackdrop()) {
      return;
    }
    const dialog = this.el.nativeElement;
    if (event.target === dialog) {
      this.pendingCloseReason = 'backdrop';
      dialog.close();
    }
  }

  /**
   * Form submit auto-close (when enabled). Don't use <form method="dialog">
   * with autoClose=true; the browser closes the dialog before this listener
   * runs.
   */
  @HostListener('submit')
  onSubmit(): void {
    if (!this.autoClose()) {
      return;
    }
    const dialog = this.el.nativeElement;
    if (dialog.open) {
      this.pendingCloseReason = 'form-submit';
      dialog.close();
    }
  }

  /**
   * Native `close` event — the single emission point for (closed). Fires
   * exactly once per close regardless of trigger path (backdrop, ESC,
   * form-submit, or programmatic). Focus is restored here, after dialog.close()
   * has begun the exit transition, with preventScroll so the page doesn't
   * shift mid-dismissal.
   */
  @HostListener('close')
  onClose(): void {
    this.restoreFocus();
    const reason = this.pendingCloseReason ?? 'programmatic';
    this.pendingCloseReason = null;
    this.closed.emit({ reason });
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private applyAutoFocus(): void {
    const selector = this.autoFocus();
    if (!selector) {
      return; // native autofocus handles it
    }

    const target = this.el.nativeElement.querySelector(selector) as HTMLElement | null;
    if (target) {
      target.focus();
    }
  }

  private restoreFocus(): void {
    // preventScroll: focus changes during the dismiss transition must not
    // trigger page scroll. Without this, the browser may scroll the page to
    // bring the focus target into view; the resulting scrollbar appearance
    // causes the centered dialog (`margin: auto`) to shift horizontally for
    // one frame, which reads as a "flash out of place" mid-fade.
    const focusOptions: FocusOptions = { preventScroll: true };
    const returnTarget = this.returnFocus();

    // Case 1: ElementRef
    if (returnTarget instanceof ElementRef) {
      const el = returnTarget.nativeElement as HTMLElement;
      el?.focus(focusOptions);
      return;
    }

    // Case 2: CSS selector string
    if (typeof returnTarget === 'string') {
      const el = document.querySelector(returnTarget) as HTMLElement | null;
      el?.focus(focusOptions);
      return;
    }

    // Case 3: Fallback to element that was focused before open
    const prev = this.previousFocus();
    if (prev instanceof HTMLElement) {
      prev.focus(focusOptions);
    }
  }
}
