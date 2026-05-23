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
} from "@angular/core";
import { NgTemplateOutlet } from "@angular/common";
import { InteropTooltipContentDirective } from "./interop-tooltip-content.directive";
import { InteropTooltipTriggerDirective } from "./interop-tooltip-trigger.directive";
import { FloatingUiPositionStrategy } from "./floating-ui.strategy";
import {
	INTEROP_POSITION_STRATEGY,
	type Placement,
	type ResolvedPlacement,
} from "./position-strategy";
import {
	INTEROP_TOOLTIP_CONFIG,
	INTEROP_TOOLTIP_DEFAULTS,
} from "./interop-tooltip.config";
import { InteropTooltipController } from "./interop-tooltip.controller";

let nextId = 0;

/**
 * InteropTooltip — accessible, WCAG 1.4.13-compliant tooltip wrapper.
 *
 * Projection-slot ergonomics: place a focusable element inside the component
 * and optionally an `<ng-template interopTooltipContent>` for rich content.
 * The host element uses `display: contents` so the trigger renders exactly
 * as if interop-tooltip were not present.
 *
 * For controls inside structured parents (segmented control, listbox, menu)
 * where wrapping breaks the parent's child-coordination, use the
 * [interopTooltip] directive instead — same behaviour, no wrapper element.
 *
 * Behaviour is delegated to {@link InteropTooltipController}, the shared
 * state machine that both this component and the directive use.
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
 */
@Component({
	selector: "interop-tooltip",
	standalone: true,
	imports: [NgTemplateOutlet],
	templateUrl: "./interop-tooltip.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [
		{
			provide: INTEROP_POSITION_STRATEGY,
			useFactory: () => new FloatingUiPositionStrategy(),
		},
	],
	host: { style: "display: contents" },
})
export class InteropTooltip implements OnDestroy {
	private readonly hostEl = inject(ElementRef<HTMLElement>);
	private readonly globalConfig = inject(INTEROP_TOOLTIP_CONFIG);
	private readonly strategy = inject(INTEROP_POSITION_STRATEGY);

	// ── Inputs ──────────────────────────────────────────────────────────────

	/**
	 * Tooltip text for simple, string-only content.
	 * Overridden by an `[interopTooltipContent]` template when both are present.
	 */
	label = input<string>("");

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
	 * - 'description' (default): uses `aria-describedby` — supplemental info.
	 * - 'label': uses `aria-labelledby` — replaces the accessible name.
	 *   Use only for icon-only controls with no other accessible name.
	 */
	semantic = input<"description" | "label" | undefined>(undefined);

	// ── Outputs ─────────────────────────────────────────────────────────────

	/** Emits true when the tooltip becomes visible, false when it hides. */
	visibilityChange = output<boolean>();

	// ── Content queries ─────────────────────────────────────────────────────

	private readonly markedTrigger = contentChild(
		InteropTooltipTriggerDirective,
		{ read: ElementRef<HTMLElement> },
	);

	protected readonly contentTemplate = contentChild(
		InteropTooltipContentDirective,
		{ read: TemplateRef },
	);

	// ── View query ──────────────────────────────────────────────────────────

	private readonly tooltipPanelRef = viewChild.required<
		ElementRef<HTMLElement>
	>("tooltipPanel");

	// ── IDs ─────────────────────────────────────────────────────────────────

	protected readonly tooltipId = `interop-tooltip-${nextId++}`;

	// ── Template-facing state ───────────────────────────────────────────────

	protected readonly resolvedPlacement = signal<ResolvedPlacement>("top");

	// ── Resolved config: input > global token > library defaults ───────────

	private readonly effectivePlacement = computed<Placement>(
		() =>
			this.placement() ??
			this.globalConfig.placement ??
			INTEROP_TOOLTIP_DEFAULTS.placement,
	);
	private readonly effectiveShowDelay = computed<number>(
		() =>
			this.showDelay() ??
			this.globalConfig.showDelay ??
			INTEROP_TOOLTIP_DEFAULTS.showDelay,
	);
	private readonly effectiveOffset = computed<number>(
		() =>
			this.offset() ??
			this.globalConfig.offset ??
			INTEROP_TOOLTIP_DEFAULTS.offset,
	);
	private readonly effectiveSemantic = computed<"description" | "label">(
		() =>
			this.semantic() ??
			this.globalConfig.semantic ??
			INTEROP_TOOLTIP_DEFAULTS.semantic,
	);

	// ── Private state ────────────────────────────────────────────────────────

	private controller: InteropTooltipController | null = null;

	// ── Lifecycle ────────────────────────────────────────────────────────────

	constructor() {
		afterNextRender(() => this.init());
	}

	ngOnDestroy(): void {
		this.controller?.destroy();
		this.controller = null;
	}

	// ── Init ────────────────────────────────────────────────────────────────

	private init(): void {
		// Explicit marker takes precedence; fall back to first focusable child.
		const triggerEl =
			this.markedTrigger()?.nativeElement ??
			(this.hostEl.nativeElement.querySelector(
				"button, a[href], input, select, textarea, [tabindex]",
			) as HTMLElement | null);

		const panelEl = this.tooltipPanelRef().nativeElement;

		if (isDevMode()) {
			this.runDevChecks(triggerEl);
		}

		if (!triggerEl) return;

		this.controller = new InteropTooltipController(
			triggerEl,
			panelEl,
			this.strategy,
			() => ({
				placement: this.effectivePlacement(),
				showDelay: this.effectiveShowDelay(),
				offset: this.effectiveOffset(),
				semantic: this.effectiveSemantic(),
			}),
			(visible) => this.visibilityChange.emit(visible),
			(placement) => this.resolvedPlacement.set(placement),
		);
	}

	// ── Dev mode ─────────────────────────────────────────────────────────────

	private runDevChecks(triggerEl: HTMLElement | null): void {
		if (!triggerEl) {
			console.warn(
				"interop-tooltip: No focusable trigger element found in projected content. " +
					"Provide a focusable element (button, a[href], input, etc.) or mark your " +
					"trigger explicitly with [interopTooltipTrigger].",
			);
			return;
		}

		// Natively disabled elements cannot receive hover or focus events.
		if (triggerEl.hasAttribute("disabled")) {
			console.error(
				"interop-tooltip: The trigger element has the native [disabled] attribute. " +
					"Disabled elements cannot receive hover or focus events — the tooltip will never show. " +
					"Use aria-disabled=\"true\" with an activation guard instead, or wrap the disabled " +
					"element in a focusable container and apply interop-tooltip to that.",
			);
		}

		// Missing content.
		if (!this.label() && !this.contentTemplate()) {
			console.warn(
				"interop-tooltip: No tooltip content provided. " +
					"Set [label]=\"'...'\" or project an <ng-template [interopTooltipContent]>.",
			);
		}

		// semantic="label" on an element that already has visible text —
		// aria-labelledby would suppress that text as the accessible name,
		// which is almost never intended.
		if (this.effectiveSemantic() === "label") {
			const hasVisibleText = !!triggerEl.textContent?.trim();
			const hasExplicitLabel = triggerEl.hasAttribute("aria-label");
			if (hasVisibleText && !hasExplicitLabel) {
				console.warn(
					"interop-tooltip: [semantic]=\"label\" is set, but the trigger has visible text content. " +
						"aria-labelledby will override the element's visible text as its accessible name, " +
						"suppressing it for screen reader users. " +
						"Use [semantic]=\"description\" (default) for supplemental information. " +
						"Reserve [semantic]=\"label\" for icon-only controls with no other accessible name.",
				);
			}
		}
	}
}
