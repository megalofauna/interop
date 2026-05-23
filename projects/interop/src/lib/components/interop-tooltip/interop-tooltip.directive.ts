import {
	Directive,
	ElementRef,
	type EmbeddedViewRef,
	OnDestroy,
	TemplateRef,
	ViewContainerRef,
	afterNextRender,
	computed,
	effect,
	inject,
	input,
	isDevMode,
	output,
	signal,
} from "@angular/core";
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
 * `[interopTooltip]` — directive form of InteropTooltip.
 *
 * Attaches a tooltip directly to a focusable element, without wrapping it.
 * Use this when the element lives inside a structured parent that coordinates
 * its own children (segmented control, listbox, radio group, menu) where a
 * wrapper component would interpose between parent and child and break the
 * parent's child-discovery, layout, or focus model.
 *
 * The directive creates its panel as a child of `document.body` and uses
 * `popover="manual"` for top-layer promotion — the panel's DOM position does
 * not affect its visual position. ARIA wiring (`aria-describedby` or
 * `aria-labelledby`) is applied to the host element directly.
 *
 * Behaviour is delegated to {@link InteropTooltipController}, shared with
 * the `<interop-tooltip>` wrapper component.
 *
 * @example String label
 * ```html
 * <button [interopTooltip]="'Align left'" aria-label="Align left">
 *   <interop-icon name="tabler-align-left" />
 * </button>
 * ```
 *
 * @example Rich content via inline template
 * ```html
 * <button [interopTooltip]="saveTpl">Save</button>
 * <ng-template #saveTpl>
 *   Save document &nbsp;<kbd>Ctrl</kbd>+<kbd>S</kbd>
 * </ng-template>
 * ```
 *
 * @example Icon-only segment (label semantic)
 * ```html
 * <button
 *   interop-segment
 *   value="left"
 *   [interopTooltip]="'Align left'"
 *   [interopTooltipSemantic]="'label'"
 *   aria-label="Align left">
 *   <interop-icon name="tabler-align-left" />
 * </button>
 * ```
 */
@Directive({
	selector: "[interopTooltip]",
	standalone: true,
	providers: [
		{
			provide: INTEROP_POSITION_STRATEGY,
			useFactory: () => new FloatingUiPositionStrategy(),
		},
	],
})
export class InteropTooltipDirective implements OnDestroy {
	private readonly hostEl = inject(ElementRef<HTMLElement>);
	private readonly viewContainer = inject(ViewContainerRef);
	private readonly globalConfig = inject(INTEROP_TOOLTIP_CONFIG);
	private readonly strategy = inject(INTEROP_POSITION_STRATEGY);

	// ── Inputs ──────────────────────────────────────────────────────────────

	/** Tooltip content — either a string or a TemplateRef for rich content. */
	interopTooltip = input.required<string | TemplateRef<unknown>>();

	placement = input<Placement | undefined>(undefined, {
		alias: "interopTooltipPlacement",
	});
	showDelay = input<number | undefined>(undefined, {
		alias: "interopTooltipShowDelay",
	});
	offset = input<number | undefined>(undefined, {
		alias: "interopTooltipOffset",
	});
	semantic = input<"description" | "label" | undefined>(undefined, {
		alias: "interopTooltipSemantic",
	});

	visibilityChange = output<boolean>({
		alias: "interopTooltipVisibilityChange",
	});

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

	private readonly tooltipId = `interop-tooltip-d${nextId++}`;
	private panel: HTMLElement | null = null;
	private templateView: EmbeddedViewRef<unknown> | null = null;
	private controller: InteropTooltipController | null = null;
	private readonly resolvedPlacement = signal<ResolvedPlacement>("top");

	constructor() {
		afterNextRender(() => this.init());

		// Re-sync panel content when the input changes (string ↔ string or
		// TemplateRef swap). No-op until the panel has been created.
		effect(() => {
			// Read input so the effect re-runs on change; defer to syncContent.
			void this.interopTooltip();
			if (this.panel) this.syncContent();
		});

		// Reflect data-placement on the live panel so CSS arrow positioning
		// and similar attribute-based rules update without an event listener.
		effect(() => {
			const placement = this.resolvedPlacement();
			if (this.panel) this.panel.setAttribute("data-placement", placement);
		});
	}

	ngOnDestroy(): void {
		this.controller?.destroy();
		this.controller = null;
		this.templateView?.destroy();
		this.templateView = null;
		if (this.panel?.parentNode) {
			this.panel.parentNode.removeChild(this.panel);
		}
		this.panel = null;
	}

	// ── Init ────────────────────────────────────────────────────────────────

	private init(): void {
		const trigger = this.hostEl.nativeElement;

		if (isDevMode()) {
			this.runDevChecks(trigger);
		}

		const panel = document.createElement("div");
		panel.id = this.tooltipId;
		panel.setAttribute("role", "tooltip");
		panel.setAttribute("popover", "manual");
		panel.className = "interop-tooltip__panel";
		panel.setAttribute("data-placement", this.resolvedPlacement());

		// Append inside the nearest [interop-root] ancestor so theme tokens
		// (--itx-tooltip-*, etc.) cascade into the panel. Falling back to
		// document.body would put the panel outside the token scope and the
		// structural-file defaults would take over instead of the theme.
		const tokenRoot =
			(trigger.closest("[interop-root]") as HTMLElement | null) ??
			document.body;
		tokenRoot.appendChild(panel);
		this.panel = panel;

		this.syncContent();

		this.controller = new InteropTooltipController(
			trigger,
			panel,
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

	// ── Content sync ────────────────────────────────────────────────────────

	private syncContent(): void {
		const panel = this.panel;
		if (!panel) return;

		// Tear down any previous template view and clear existing children.
		if (this.templateView) {
			this.templateView.destroy();
			this.templateView = null;
		}
		while (panel.firstChild) panel.removeChild(panel.firstChild);

		const content = this.interopTooltip();
		if (typeof content === "string") {
			panel.textContent = content;
			return;
		}

		// TemplateRef path — create the embedded view in the directive's own
		// view container (so DI scope and change detection are correct), then
		// move the rendered DOM nodes into the panel. The view stays attached
		// to the container; only its rendered nodes are relocated.
		this.templateView = this.viewContainer.createEmbeddedView(content);
		this.templateView.detectChanges();
		for (const node of this.templateView.rootNodes) {
			panel.appendChild(node);
		}
	}

	// ── Dev mode ────────────────────────────────────────────────────────────

	private runDevChecks(trigger: HTMLElement): void {
		// Natively disabled elements cannot receive hover or focus events.
		if (trigger.hasAttribute("disabled")) {
			console.error(
				"[interopTooltip]: The host element has the native [disabled] attribute. " +
					"Disabled elements cannot receive hover or focus events — the tooltip will never show. " +
					"Use aria-disabled=\"true\" with an activation guard instead.",
			);
		}

		// Host should be focusable. Quick check for the common focusable
		// roles; we don't enumerate every possible focusable element shape.
		const tag = trigger.tagName.toLowerCase();
		const intrinsicallyFocusable =
			tag === "button" ||
			tag === "input" ||
			tag === "select" ||
			tag === "textarea" ||
			(tag === "a" && trigger.hasAttribute("href")) ||
			trigger.hasAttribute("tabindex");
		if (!intrinsicallyFocusable) {
			console.warn(
				"[interopTooltip]: Host element is not focusable. Tooltips must be attached " +
					"to a focusable element (button, a[href], input, select, textarea, or [tabindex]) " +
					"so keyboard users can trigger them.",
			);
		}

		// semantic="label" with visible text — aria-labelledby would suppress
		// the visible text as accessible name, almost never intended.
		if (this.effectiveSemantic() === "label") {
			const hasVisibleText = !!trigger.textContent?.trim();
			const hasExplicitLabel = trigger.hasAttribute("aria-label");
			if (hasVisibleText && !hasExplicitLabel) {
				console.warn(
					"[interopTooltip]: [interopTooltipSemantic]=\"label\" is set, but the host " +
						"has visible text content. aria-labelledby will override the element's visible " +
						"text as its accessible name, suppressing it for screen reader users. " +
						"Reserve semantic=\"label\" for icon-only controls with no other accessible name.",
				);
			}
		}
	}
}
