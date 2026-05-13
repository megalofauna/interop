import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  TemplateRef,
  afterNextRender,
  computed,
  contentChild,
  inject,
  input,
  isDevMode,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { InteropTooltipContentDirective } from './interop-tooltip-content.directive';
import { InteropTooltipTriggerDirective } from './interop-tooltip-trigger.directive';
import { FloatingUiPositionStrategy } from './floating-ui.strategy';
import {
  INTEROP_POSITION_STRATEGY,
  type Placement,
  type ResolvedPlacement,
} from './position-strategy';
import {
  INTEROP_TOOLTIP_CONFIG,
  INTEROP_TOOLTIP_DEFAULTS,
} from './interop-tooltip.config';

let nextId = 0;

/**
 * InteropTooltip — accessible, WCAG 1.4.13-compliant tooltip container.
 *
 * Wraps any focusable element and associates it with a tooltip panel. The host
 * element uses `display: contents` so it is transparent to layout — the projected
 * trigger renders exactly as if interop-tooltip were not present.
 *
 * The tooltip panel uses `popover="manual"` for top-layer promotion, escaping all
 * `overflow: hidden` ancestors and z-index stacking contexts without portaling
 * outside the Angular component tree.
 *
 * ## Accessibility model
 * - `aria-describedby` (default) or `aria-labelledby` ([semantic]="label") is set
 *   on the trigger element pointing to the tooltip panel ID.
 * - The tooltip panel has `role="tooltip"` and `opacity: 0` (not display:none) in the
 *   closed state — keeping it in the AT accessibility tree so NVDA/JAWS can announce
 *   the description when focus lands on the trigger.
 * - Tooltip shows on both focus (immediately) and hover (after [showDelay]).
 * - Escape key dismisses without moving focus (WCAG 1.4.13 Dismissible).
 * - Mouse can travel from trigger to tooltip without closing it (WCAG 1.4.13 Hoverable).
 * - No auto-dismiss timer (WCAG 1.4.13 Persistent).
 *
 * ## Positioning
 * Default strategy: FloatingUiPositionStrategy (requires `@floating-ui/dom` peer dep).
 * Falls back to NativePositionStrategy (top/bottom only) if `@floating-ui/dom` is
 * absent, with a console.error on first position call.
 *
 * ## CSS Anchor Positioning migration
 * Override INTEROP_POSITION_STRATEGY with CssAnchorPositionStrategy when CSS anchor
 * positioning reaches Newly Available baseline. No component code changes needed.
 *
 * @example Simple string tooltip
 * ```html
 * <interop-tooltip label="Saves your progress">
 *   <button type="button">Save</button>
 * </interop-tooltip>
 * ```
 *
 * @example Rich content via template
 * ```html
 * <interop-tooltip>
 *   <button type="button">Save</button>
 *   <ng-template interopTooltipContent>
 *     Save document &nbsp;<kbd>Ctrl</kbd>+<kbd>S</kbd>
 *   </ng-template>
 * </interop-tooltip>
 * ```
 *
 * @example Icon-only button (label semantic)
 * ```html
 * <interop-tooltip label="Close dialog" [semantic]="'label'">
 *   <button type="button" aria-label="Close dialog">
 *     <interop-icon name="x" />
 *   </button>
 * </interop-tooltip>
 * ```
 *
 * @example Explicit trigger marker (disambiguation)
 * ```html
 * <interop-tooltip label="Open settings">
 *   <app-icon-button interopTooltipTrigger icon="settings" />
 * </interop-tooltip>
 * ```
 */
@Component({
  selector: 'interop-tooltip',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './interop-tooltip.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: INTEROP_POSITION_STRATEGY,
      useFactory: () => new FloatingUiPositionStrategy(),
    },
  ],
  host: { style: 'display: contents' },
})
export class InteropTooltip implements OnDestroy {
  private readonly hostEl = inject(ElementRef<HTMLElement>);
  private readonly globalConfig = inject(INTEROP_TOOLTIP_CONFIG);
  private readonly strategy = inject(INTEROP_POSITION_STRATEGY);

  // ── Inputs ──────────────────────────────────────────────────────────────────

  /**
   * Tooltip text for simple, string-only content.
   * Overridden by an `[interopTooltipContent]` template when both are present.
   */
  label = input<string>('');

  /** Preferred placement of the tooltip panel relative to the trigger. */
  placement = input<Placement | undefined>(undefined);

  /**
   * Delay in milliseconds before the tooltip appears on hover.
   * Focus always shows the tooltip immediately regardless of this value.
   */
  showDelay = input<number | undefined>(undefined);

  /** Gap between the trigger element edge and the tooltip panel in pixels. */
  offset = input<number | undefined>(undefined);

  /**
   * ARIA wiring mode.
   * - 'description' (default): uses `aria-describedby` — supplemental information.
   * - 'label': uses `aria-labelledby` — replaces the accessible name.
   *   Use only for icon-only controls that have no other accessible name.
   */
  semantic = input<'description' | 'label' | undefined>(undefined);

  // ── Outputs ─────────────────────────────────────────────────────────────────

  /** Emits true when the tooltip becomes visible, false when it hides. */
  visibilityChange = output<boolean>();

  // ── Content queries ─────────────────────────────────────────────────────────

  private readonly markedTrigger = contentChild(InteropTooltipTriggerDirective, {
    read: ElementRef<HTMLElement>,
  });

  protected readonly contentTemplate = contentChild(InteropTooltipContentDirective, {
    read: TemplateRef,
  });

  // ── View query ──────────────────────────────────────────────────────────────

  private readonly tooltipPanelRef = viewChild.required<ElementRef<HTMLElement>>('tooltipPanel');

  // ── IDs ─────────────────────────────────────────────────────────────────────

  protected readonly tooltipId = `interop-tooltip-${nextId++}`;

  // ── State ───────────────────────────────────────────────────────────────────

  protected readonly isVisible = signal(false);
  protected readonly resolvedPlacement = signal<ResolvedPlacement>('top');

  // ── Resolved config: input > global token > library defaults ────────────────

  protected readonly effectivePlacement = computed<Placement>(
    () => this.placement() ?? this.globalConfig.placement ?? INTEROP_TOOLTIP_DEFAULTS.placement,
  );
  protected readonly effectiveShowDelay = computed<number>(
    () => this.showDelay() ?? this.globalConfig.showDelay ?? INTEROP_TOOLTIP_DEFAULTS.showDelay,
  );
  protected readonly effectiveOffset = computed<number>(
    () => this.offset() ?? this.globalConfig.offset ?? INTEROP_TOOLTIP_DEFAULTS.offset,
  );
  protected readonly effectiveSemantic = computed<'description' | 'label'>(
    () => this.semantic() ?? this.globalConfig.semantic ?? INTEROP_TOOLTIP_DEFAULTS.semantic,
  );

  // ── Private state ────────────────────────────────────────────────────────────

  private triggerEl: HTMLElement | null = null;
  private tooltipEl: HTMLElement | null = null;

  // Track active show reasons separately so hover+focus don't interfere.
  private readonly showReasons = new Set<'focus' | 'hover'>();

  private openTimer: ReturnType<typeof setTimeout> | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private stopAutoUpdate: (() => void) | null = null;
  private escapeListener: ((e: KeyboardEvent) => void) | null = null;
  private cleanupListeners: Array<() => void> = [];
  private ariaAttr: 'aria-describedby' | 'aria-labelledby' = 'aria-describedby';

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  constructor() {
    afterNextRender(() => this.init());
  }

  ngOnDestroy(): void {
    this.cleanupListeners.forEach(fn => fn());
    this.cleanupListeners = [];
    this.clearTimers();

    if (this.escapeListener) {
      document.removeEventListener('keydown', this.escapeListener);
      this.escapeListener = null;
    }

    // Remove aria attribute we placed on the trigger.
    if (this.triggerEl) {
      const current = this.triggerEl.getAttribute(this.ariaAttr);
      if (current === this.tooltipId) {
        this.triggerEl.removeAttribute(this.ariaAttr);
      }
    }

    if (this.tooltipEl) {
      try {
        this.tooltipEl.hidePopover();
      } catch {
        // Swallow if popover was not open.
      }
    }

    this.strategy.disconnect();
  }

  // ── Init ────────────────────────────────────────────────────────────────────

  private init(): void {
    // Explicit marker takes precedence; fall back to first focusable child.
    this.triggerEl =
      this.markedTrigger()?.nativeElement ??
      this.hostEl.nativeElement.querySelector(
        'button, a[href], input, select, textarea, [tabindex]',
      ) as HTMLElement | null;

    this.tooltipEl = this.tooltipPanelRef().nativeElement;

    if (isDevMode()) {
      this.runDevChecks();
    }

    if (!this.triggerEl || !this.tooltipEl) return;

    this.ariaAttr =
      this.effectiveSemantic() === 'label' ? 'aria-labelledby' : 'aria-describedby';

    // Wire the ARIA relationship. The tooltip is opacity:0 (not display:none)
    // so NVDA/JAWS can resolve this reference before the tooltip is first shown.
    this.triggerEl.setAttribute(this.ariaAttr, this.tooltipId);

    this.strategy.connect(this.triggerEl, this.tooltipEl);
    this.attachListeners();
  }

  // ── Event listeners ──────────────────────────────────────────────────────────

  private attachListeners(): void {
    const trigger = this.triggerEl!;
    const tooltip = this.tooltipEl!;

    const onHoverEnter = () => this.requestShow('hover', this.effectiveShowDelay());
    const onHoverLeave = () => this.requestHide('hover', 150);
    const onTriggerFocus = () => this.requestShow('focus', 0);
    const onTriggerBlur = () => this.requestHide('focus', 0);

    // Keep tooltip open when mouse travels from trigger to panel (WCAG 1.4.13 Hoverable).
    const onTooltipHoverEnter = () => this.cancelClose();
    const onTooltipHoverLeave = () => this.requestHide('hover', 0);

    // Both mouseenter and pointerenter are required: Safari does not reliably
    // fire pointerenter on elements adjacent to [popover] elements, while
    // mouseenter alone is also insufficient in Safari. The combination of both
    // works cross-browser. Duplicate fires are harmless — requestShow is
    // idempotent when the tooltip is already visible (cancels pending close).
    trigger.addEventListener('mouseenter', onHoverEnter);
    trigger.addEventListener('mouseleave', onHoverLeave);
    trigger.addEventListener('pointerenter', onHoverEnter);
    trigger.addEventListener('pointerleave', onHoverLeave);
    trigger.addEventListener('focus', onTriggerFocus);
    trigger.addEventListener('blur', onTriggerBlur);
    tooltip.addEventListener('mouseenter', onTooltipHoverEnter);
    tooltip.addEventListener('mouseleave', onTooltipHoverLeave);
    tooltip.addEventListener('pointerenter', onTooltipHoverEnter);
    tooltip.addEventListener('pointerleave', onTooltipHoverLeave);

    this.cleanupListeners.push(
      () => trigger.removeEventListener('mouseenter', onHoverEnter),
      () => trigger.removeEventListener('mouseleave', onHoverLeave),
      () => trigger.removeEventListener('pointerenter', onHoverEnter),
      () => trigger.removeEventListener('pointerleave', onHoverLeave),
      () => trigger.removeEventListener('focus', onTriggerFocus),
      () => trigger.removeEventListener('blur', onTriggerBlur),
      () => tooltip.removeEventListener('mouseenter', onTooltipHoverEnter),
      () => tooltip.removeEventListener('mouseleave', onTooltipHoverLeave),
      () => tooltip.removeEventListener('pointerenter', onTooltipHoverEnter),
      () => tooltip.removeEventListener('pointerleave', onTooltipHoverLeave),
    );
  }

  // ── Show / hide ──────────────────────────────────────────────────────────────

  private requestShow(reason: 'focus' | 'hover', delay: number): void {
    this.showReasons.add(reason);
    if (this.isVisible()) {
      this.cancelClose();
      return;
    }
    this.clearTimers();
    this.openTimer = setTimeout(() => this.showTooltip(), delay);
  }

  private requestHide(reason: 'focus' | 'hover', delay: number): void {
    this.showReasons.delete(reason);
    if (this.showReasons.size > 0) return; // another reason still active
    this.clearTimers();
    this.closeTimer = setTimeout(() => this.hideTooltip(), delay);
  }

  private cancelClose(): void {
    if (this.closeTimer !== null) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  private clearTimers(): void {
    if (this.openTimer !== null) {
      clearTimeout(this.openTimer);
      this.openTimer = null;
    }
    if (this.closeTimer !== null) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  private async showTooltip(): Promise<void> {
    if (this.isVisible() || !this.triggerEl || !this.tooltipEl) return;

    // Position while still opacity:0 (measurable but invisible) to avoid
    // a visible flash at the wrong coordinates when showPopover() is called.
    const placement = await this.strategy.position({
      placement: this.effectivePlacement(),
      offset: this.effectiveOffset(),
    });
    this.resolvedPlacement.set(placement);

    this.tooltipEl.showPopover();
    this.isVisible.set(true);
    this.visibilityChange.emit(true);

    // Start scroll/resize auto-update; store the cleanup function.
    this.stopAutoUpdate = this.strategy.startAutoUpdate(async () => {
      const updated = await this.strategy.position({
        placement: this.effectivePlacement(),
        offset: this.effectiveOffset(),
      });
      this.resolvedPlacement.set(updated);
    });

    // Document-level Escape handler (WCAG 1.4.13 Dismissible).
    // Document-level (not trigger-level) so hover-triggered tooltips can also be
    // dismissed when the user's keyboard focus is elsewhere.
    this.escapeListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        this.showReasons.clear();
        this.hideTooltip();
      }
    };
    document.addEventListener('keydown', this.escapeListener);
  }

  private hideTooltip(): void {
    if (!this.isVisible() || !this.tooltipEl) return;

    this.stopAutoUpdate?.();
    this.stopAutoUpdate = null;

    try {
      this.tooltipEl.hidePopover();
    } catch {
      // Swallow if already hidden.
    }

    this.isVisible.set(false);
    this.visibilityChange.emit(false);

    if (this.escapeListener) {
      document.removeEventListener('keydown', this.escapeListener);
      this.escapeListener = null;
    }
  }

  // ── Dev mode ─────────────────────────────────────────────────────────────────

  private runDevChecks(): void {
    if (!this.triggerEl) {
      console.warn(
        'interop-tooltip: No focusable trigger element found in projected content. ' +
          'Provide a focusable element (button, a[href], input, etc.) or mark your ' +
          'trigger explicitly with [interopTooltipTrigger].',
      );
      return;
    }

    // Natively disabled elements cannot receive hover or focus events.
    if (this.triggerEl.hasAttribute('disabled')) {
      console.error(
        'interop-tooltip: The trigger element has the native [disabled] attribute. ' +
          'Disabled elements cannot receive hover or focus events — the tooltip will never show. ' +
          'Use aria-disabled="true" with an activation guard instead, or wrap the disabled ' +
          'element in a focusable container and apply interop-tooltip to that.',
      );
    }

    // Missing content.
    if (!this.label() && !this.contentTemplate()) {
      console.warn(
        'interop-tooltip: No tooltip content provided. ' +
          'Set [label]="\'...\'" or project an <ng-template [interopTooltipContent]>.',
      );
    }

    // semantic="label" on an element that already has visible text — aria-labelledby
    // would suppress that text as the accessible name, which is almost never intended.
    if (this.effectiveSemantic() === 'label') {
      const hasVisibleText = !!this.triggerEl.textContent?.trim();
      const hasExplicitLabel = this.triggerEl.hasAttribute('aria-label');
      if (hasVisibleText && !hasExplicitLabel) {
        console.warn(
          'interop-tooltip: [semantic]="label" is set, but the trigger has visible text content. ' +
            'aria-labelledby will override the element\'s visible text as its accessible name, ' +
            'suppressing it for screen reader users. ' +
            'Use [semantic]="description" (default) for supplemental information. ' +
            'Reserve [semantic]="label" for icon-only controls with no other accessible name.',
        );
      }
    }
  }
}
