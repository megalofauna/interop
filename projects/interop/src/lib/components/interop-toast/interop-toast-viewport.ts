import {
  Component,
  ChangeDetectionStrategy,
  OnDestroy,
  inject,
  input,
  signal,
  computed,
  afterNextRender,
  isDevMode,
  ElementRef,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

import type { ToastPosition, ToastState } from './interop-toast.types';
import { INTEROP_TOAST_CONFIG, INTEROP_TOAST_DEFAULTS } from './interop-toast.config';
import { InteropToastService } from './interop-toast.service';
import { InteropToastItem } from './interop-toast-item';
import { InteropButton } from '../interop-button/interop-button';

/**
 * InteropToastViewport — rendering container for toast notifications.
 *
 * Place one instance in your root layout. The companion `InteropToastService`
 * manages toast state; this component reads it and renders the stack.
 *
 * @example
 * ```html
 * <!-- app.component.html -->
 * <router-outlet />
 * <interop-toast-viewport />
 * ```
 *
 * @example Custom position
 * ```html
 * <interop-toast-viewport position="top-center" />
 * ```
 */
@Component({
  selector: 'interop-toast-viewport',
  standalone: true,
  imports: [InteropToastItem, InteropButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'role': 'region',
    'aria-label': 'Notifications',
    '[attr.data-position]': 'effectivePosition()',
    '[attr.data-expanded]': 'expanded()',
    '[attr.data-populated]': 'hasToasts()',
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
    '(focusin)': 'onFocusIn()',
    '(focusout)': 'onFocusOut($event)',
  },
  template: `
    <!-- Polite live region (pre-rendered, primed before content) -->
    <div
      class="interop-toast-viewport__live-region"
      aria-live="polite"
      aria-atomic="true"
      aria-relevant="additions text">
    </div>

    <!-- Assertive live region for error toasts -->
    <div
      class="interop-toast-viewport__live-region"
      aria-live="assertive"
      aria-atomic="true"
      aria-relevant="additions text">
    </div>

    @if (showClearAll()) {
      <div class="interop-toast-viewport__header">
        <button
          interop-button
          itx-size="sm"
          type="button"
          class="interop-toast-viewport__clear-all"
          (click)="service.dismissAll()">
          Clear all ({{ service.count() }})
        </button>
      </div>
    }

    @for (toast of visibleToasts(); track toast.id; let i = $index) {
      <interop-toast-item
        [toast]="toast"
        [index]="i"
        [total]="visibleToasts().length"
        [expanded]="expanded()"
        [paused]="paused()"
        (dismissed)="service._handleDismiss(toast.id)"
        (action)="service._handleAction(toast.id)"
        (swipeDismiss)="service._handleSwipeDismiss(toast.id)"
        (timeout)="service._handleTimeout(toast.id)"
      />
    }
  `,
})
export class InteropToastViewport implements OnDestroy {
  protected readonly service = inject(InteropToastService);
  private readonly globalConfig = inject(INTEROP_TOAST_CONFIG);
  private readonly doc = inject(DOCUMENT);
  private readonly el = inject(ElementRef<HTMLElement>);

  // ── Inputs (three-tier cascade: input > global token > defaults) ──────

  position = input<ToastPosition | undefined>(undefined);
  maxVisible = input<number | undefined>(undefined);
  hotkey = input<string | undefined>(undefined);

  protected readonly effectivePosition = computed<ToastPosition>(
    () => this.position() ?? this.globalConfig.position ?? INTEROP_TOAST_DEFAULTS.position,
  );

  private readonly effectiveMaxVisible = computed<number>(
    () => this.maxVisible() ?? this.globalConfig.maxVisible ?? INTEROP_TOAST_DEFAULTS.maxVisible,
  );

  private readonly effectiveHotkey = computed<string>(
    () => this.hotkey() ?? this.globalConfig.hotkey ?? INTEROP_TOAST_DEFAULTS.hotkey,
  );

  // ── Internal state ────────────────────────────────────────────────────

  protected readonly expanded = signal(false);
  protected readonly paused = signal(false);
  private readonly hasFocus = signal(false);
  private readonly hasHover = signal(false);
  private previousFocusEl: Element | null = null;
  private hotkeyCleanup: (() => void) | null = null;
  private visibilityCleanup: (() => void) | null = null;

  // ── Derived state ─────────────────────────────────────────────────────

  protected readonly visibleToasts = computed<ToastState[]>(() => {
    const all = this.service._toasts();
    const max = this.effectiveMaxVisible();
    // Show the most recent toasts (end of array = newest)
    return all.slice(-max);
  });

  /** Drives the panel's visibility as a host attribute rather than a CSS
   *  :has() — :has() can miss the invalidation when the last toast is removed
   *  dynamically, leaving an empty tray until some other style recalc. A
   *  signal-backed attribute is deterministic. */
  protected readonly hasToasts = computed<boolean>(
    () => this.visibleToasts().length > 0,
  );

  /** Surface the nuclear "clear all" control once a stack has formed. Threshold
   *  is the total count (visible + queued), so a deep backlog surfaces it too. */
  protected readonly showClearAll = computed<boolean>(
    () => this.service.count() >= 3,
  );

  constructor() {
    this.service._registerViewport();

    afterNextRender(() => {
      this.setupHotkey();
      this.setupVisibilityListener();
    });
  }

  ngOnDestroy(): void {
    this.service._unregisterViewport();
    this.hotkeyCleanup?.();
    this.visibilityCleanup?.();
  }

  // ── Host event handlers ───────────────────────────────────────────────

  protected onMouseEnter(): void {
    this.hasHover.set(true);
    this.expanded.set(true);
    this.paused.set(true);
  }

  protected onMouseLeave(): void {
    this.hasHover.set(false);
    if (!this.hasFocus()) {
      this.expanded.set(false);
      this.paused.set(false);
    }
  }

  protected onFocusIn(): void {
    this.hasFocus.set(true);
    this.expanded.set(true);
    this.paused.set(true);
  }

  protected onFocusOut(event: FocusEvent): void {
    // Only collapse if focus is leaving the viewport entirely
    const related = event.relatedTarget as Node | null;
    if (related && this.el.nativeElement.contains(related)) return;

    this.hasFocus.set(false);
    if (!this.hasHover()) {
      this.expanded.set(false);
      this.paused.set(false);
    }

    // Restore previous focus if focus is leaving the toast viewport
    if (this.previousFocusEl instanceof HTMLElement) {
      this.previousFocusEl.focus();
      this.previousFocusEl = null;
    }
  }

  // ── Hotkey setup ──────────────────────────────────────────────────────

  private setupHotkey(): void {
    const handler = (event: KeyboardEvent) => {
      const hotkey = this.effectiveHotkey();
      if (!this.matchesHotkey(event, hotkey)) return;

      event.preventDefault();
      const toasts = this.visibleToasts();
      if (toasts.length === 0) return;

      // Save current focus for restoration
      this.previousFocusEl = this.doc.activeElement;

      // Focus the first focusable element in the viewport
      const firstFocusable = this.el.nativeElement.querySelector(
        'button, [tabindex]:not([tabindex="-1"])',
      ) as HTMLElement | null;
      if (firstFocusable) {
        firstFocusable.focus();
      }
    };

    this.doc.addEventListener('keydown', handler);
    this.hotkeyCleanup = () => this.doc.removeEventListener('keydown', handler);
  }

  private matchesHotkey(event: KeyboardEvent, hotkey: string): boolean {
    const parts = hotkey.toLowerCase().split('+');
    const key = parts[parts.length - 1];
    const needsAlt = parts.includes('alt');
    const needsCtrl = parts.includes('ctrl') || parts.includes('control');
    const needsShift = parts.includes('shift');
    const needsMeta = parts.includes('meta') || parts.includes('cmd');

    return (
      event.code.toLowerCase() === key &&
      event.altKey === needsAlt &&
      event.ctrlKey === needsCtrl &&
      event.shiftKey === needsShift &&
      event.metaKey === needsMeta
    );
  }

  // ── Visibility listener (pause on document hidden) ────────────────────

  private setupVisibilityListener(): void {
    const handler = () => {
      if (this.doc.hidden) {
        this.paused.set(true);
      } else {
        // Only unpause if not hovered or focused
        if (!this.hasHover() && !this.hasFocus()) {
          this.paused.set(false);
        }
      }
    };

    this.doc.addEventListener('visibilitychange', handler);
    this.visibilityCleanup = () => this.doc.removeEventListener('visibilitychange', handler);
  }
}
