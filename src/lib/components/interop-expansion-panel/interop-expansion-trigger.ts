import {
  Directive,
  DestroyRef,
  ElementRef,
  HostListener,
  afterNextRender,
  inject,
  isDevMode,
} from '@angular/core';
import { INTEROP_EXPANSION_PANEL_CONTEXT } from './interop-expansion-panel.context.token';
import { INTEROP_ACCORDION_CONTEXT } from './interop-accordion.context.token';

/**
 * InteropExpansionTrigger — Toggle button for an `interop-expansion-panel`.
 *
 * Must be used on a `<button>` element inside an `interop-expansion-panel`.
 * Automatically wires `aria-expanded` and `aria-controls` to the panel's body.
 *
 * ## Heading requirement
 * Wrap this button in a heading element so it participates in the document
 * outline. A dev-mode warning fires if no heading ancestor is found.
 *
 * ```html
 * <h3><button interop-expansion-trigger>Section Title</button></h3>
 * ```
 *
 * ## Arrow key navigation
 * When inside an `interop-accordion`, Up/Down Arrow, Home, and End move
 * focus between sibling triggers per the ARIA APG accordion pattern.
 * Has no effect on standalone panels.
 */
@Directive({
  selector: 'button[interop-expansion-trigger]',
  standalone: true,
  host: {
    '[attr.aria-expanded]': 'panel.isExpanded() ? "true" : "false"',
    '[attr.aria-controls]': 'panel.bodyId',
  },
})
export class InteropExpansionTrigger {
  readonly panel = inject(INTEROP_EXPANSION_PANEL_CONTEXT);
  private readonly accordion = inject(INTEROP_ACCORDION_CONTEXT, { optional: true });
  private readonly el = inject(ElementRef<HTMLButtonElement>);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    if (this.accordion) {
      const unregister = this.accordion.registerTrigger(this.el.nativeElement);
      this.destroyRef.onDestroy(unregister);
    }

    if (isDevMode()) {
      afterNextRender(() => {
        const button = this.el.nativeElement;
        let ancestor: Element | null = button.parentElement;
        let hasHeading = false;
        while (ancestor && ancestor !== document.body) {
          if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(ancestor.tagName)) {
            hasHeading = true;
            break;
          }
          ancestor = ancestor.parentElement;
        }
        if (!hasHeading) {
          console.warn(
            'InteropExpansionTrigger: the trigger button has no heading element ancestor. ' +
              'Wrap it in an <h2>–<h6> so the panel title is part of the document outline. ' +
              'Example: <h3><button interop-expansion-trigger>Title</button></h3>',
          );
        }
      });
    }
  }

  @HostListener('click')
  onClick(): void {
    this.panel.toggle();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.accordion) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.accordion.focusRelativeTrigger(this.el.nativeElement, 'next');
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.accordion.focusRelativeTrigger(this.el.nativeElement, 'prev');
        break;
      case 'Home':
        event.preventDefault();
        this.accordion.focusRelativeTrigger(this.el.nativeElement, 'first');
        break;
      case 'End':
        event.preventDefault();
        this.accordion.focusRelativeTrigger(this.el.nativeElement, 'last');
        break;
    }
  }
}
