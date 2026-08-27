import { NgTemplateOutlet } from "@angular/common";
import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	ElementRef,
	afterNextRender,
	contentChildren,
	effect,
	inject,
	input,
	isDevMode,
	computed,
	linkedSignal,
	model,
	signal,
	viewChildren,
} from "@angular/core";
import { InteropActivation } from "../../services/interop-activation.service";
import { InteropTabPanel } from "./interop-tab-panel";
import {
	INTEROP_TABS_CONTEXT,
	type InteropTabsContext,
} from "./interop-tabs-context.token";

let _tabsIdCounter = 0;

/**
 * InteropTabs — Accessible, state-preserving tabs container.
 *
 * Must be used on a `<section>` element. Discovers child `section[interop-tab-panel]`
 * elements via signal-based content query and generates a fully accessible tablist
 * with ARIA wiring, keyboard navigation, and roving tabindex management.
 *
 * ## State preservation
 * Inactive panels stay in the DOM with the `hidden` attribute — no destroy/recreate.
 * Panel content is lazy-initialized on first visit, then preserved indefinitely.
 * See `InteropTabPanel` for per-panel escape hatches.
 *
 * ## Active panel
 * - Default: first panel is active.
 * - Uncontrolled: tabs manage state internally; `(activeChange)` notifies of changes.
 * - Controlled: `[(active)]="myKey"` two-way binding; parent drives the active panel.
 *
 * ## Keyboard navigation (ARIA tabs pattern)
 * - `ArrowRight` / `ArrowLeft` (horizontal) or `ArrowDown` / `ArrowUp` (vertical):
 *   Move focus between tabs. In `auto` mode, also activates the tab.
 * - `Home` / `End`: Jump to first / last tab.
 * - `Enter` / `Space`: Activate focused tab (in `manual` activation mode).
 *
 * ## Labels
 * Each panel provides its own label via `label` input or `<ng-template interop-tab-label>`.
 *
 * ## Actions in the tab strip
 * Content marked `[interop-tabs-actions]` is projected BESIDE the tablist
 * rather than into the panel area — an overflow menu, a copy button, a filter.
 *
 * ```html
 * <section interop-tabs ariaLabel="Files">
 *   <div interop-tabs-actions interop-toolbar label="Code actions">…</div>
 *   <section interop-tab-panel label="template.html">…</section>
 * </section>
 * ```
 *
 * It cannot go inside the tablist, and that is an ARIA rule rather than a
 * styling one: a tablist's owned elements must be tabs. The slot is how a
 * toolbar sits in the strip without joining the tab sequence — arrow keys still
 * traverse only the tabs, and the toolbar keeps its own single tab stop.
 *
 * @example Basic usage
 * ```html
 * <section interop-tabs aria-label="Account settings">
 *   <section interop-tab-panel label="Profile">
 *     <form>...</form>
 *   </section>
 *   <section interop-tab-panel label="Preferences">
 *     ...
 *   </section>
 * </section>
 * ```
 *
 * @example Controlled active panel
 * ```html
 * <section interop-tabs [(active)]="currentStep" aria-label="Wizard">
 *   <section interop-tab-panel key="step-1" label="Details">...</section>
 *   <section interop-tab-panel key="step-2" label="Review">...</section>
 * </section>
 * ```
 *
 * @example External programmatic control via InteropActivation
 * ```html
 * <section interop-tabs activationId="main-tabs" aria-label="Main navigation">
 *   ...panels...
 * </section>
 * ```
 * ```ts
 * // From anywhere in the app:
 * interopActivation.trigger('main-tabs', 'panel-key');
 * ```
 *
 * @example Vertical orientation
 * ```html
 * <section interop-tabs orientation="vertical" aria-label="Settings">
 *   ...panels...
 * </section>
 * ```
 *
 * @example Manual activation mode (keyboard focus does not auto-select)
 * ```html
 * <section interop-tabs activationMode="manual" aria-label="Heavy panels">
 *   ...panels...
 * </section>
 * ```
 */
@Component({
	selector: "section[interop-tabs]",
	standalone: true,
	imports: [NgTemplateOutlet],
	templateUrl: "./interop-tabs.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [
		{
			provide: INTEROP_TABS_CONTEXT,
			useExisting: InteropTabs,
		},
	],
	host: {
		"[attr.aria-label]": "ariaLabel()",
		"[attr.aria-labelledby]": "ariaLabelledBy()",
		/*
		 * Reflect `orientation` as a styling hook. `itx-*` is the convention for a
		 * system-configuration axis; the stylesheet reads it as
		 * `:host([itx-orientation="vertical"])` to stand the tablist beside its
		 * panels. Without this, a `[orientation]`-BOUND value never reaches the DOM
		 * — only a statically-written attribute would — and a vertical tab group
		 * renders as a horizontal strip.
		 */
		"[attr.itx-orientation]": "orientation()",
	},
})
export class InteropTabs implements InteropTabsContext {
	private readonly elementRef = inject(ElementRef<HTMLElement>);
	private readonly destroyRef = inject(DestroyRef);
	private readonly activationService = inject(InteropActivation, {
		optional: true,
	});

	// ── Unique instance identifier ──────────────────────────────────────────────

	/**
	 * Stable UID for this tabs instance. Panels use it to build their ARIA IDs.
	 */
	readonly uid = `itx-tabs-${_tabsIdCounter++}`;

	// ── Inputs ───────────────────────────────────────────────────────────────────

	/**
	 * Two-way bindable active panel key.
	 * When unset, the first panel is active by default.
	 *
	 * @example Controlled
	 * ```html
	 * <section interop-tabs [(active)]="currentTab">
	 * ```
	 */
	readonly active = model<string | null>(null);

	/**
	 * `aria-label` for the generated tablist element.
	 * Use when no visible element labels the tab group.
	 */
	readonly ariaLabel = input<string | null>(null);

	/**
	 * `aria-labelledby` for the generated tablist element.
	 * Use when a visible heading labels the tab group.
	 */
	readonly ariaLabelledBy = input<string | null>(null);

	/**
	 * Tab orientation. Affects which arrow keys navigate between tabs and
	 * sets `aria-orientation` on the tablist.
	 *
	 * - `horizontal` (default): ArrowLeft / ArrowRight
	 * - `vertical`: ArrowUp / ArrowDown
	 */
	readonly orientation = input<"horizontal" | "vertical">("horizontal");

	/**
	 * How keyboard focus translates to panel activation.
	 *
	 * - `auto` (default): Arrow keys move focus AND activate the panel immediately.
	 *   Recommended for tabs with lightweight content.
	 * - `manual`: Arrow keys move focus only; Enter / Space activates.
	 *   Preferred when panels have expensive initialization costs.
	 */
	readonly activationMode = input<"auto" | "manual">("auto");

	/**
	 * Optional ID to register with `InteropActivation` for external/programmatic
	 * tab switching. When set, any consumer can call
	 * `interopActivation.trigger(activationId, 'panel-key')` to switch tabs.
	 */
	readonly activationId = input<string | null>(null);

	// ── Signal queries ────────────────────────────────────────────────────────────

	/**
	 * All child InteropTabPanel components. Reactively updated when panels
	 * are added or removed (e.g. via @if or lazy routes).
	 */
	readonly panels = contentChildren(InteropTabPanel);

	/**
	 * References to the generated tab `<button>` elements.
	 * Used for programmatic focus management during keyboard navigation.
	 */
	readonly tabButtons =
		viewChildren<ElementRef<HTMLButtonElement>>("tabButton");

	// ── Active state ─────────────────────────────────────────────────────────────

	/**
	 * The resolved active panel key. Accounts for:
	 * - No value provided → defaults to first panel key.
	 * - Controlled value → validated against current panel keys; falls back to first.
	 * - Panels change dynamically → re-validates; falls back to first if key removed.
	 *
	 * This is the signal panels read via the INTEROP_TABS_CONTEXT injection token.
	 */
	readonly resolvedActive = linkedSignal<string | null>(() => {
		const requested = this.active();
		const keys = this.panels().map((p) => p.key());
		if (requested && keys.includes(requested)) return requested;
		return keys[0] ?? null;
	});

	// ── Roving focus ──────────────────────────────────────────────────────────────

	/**
	 * The tab that currently holds focus, which is NOT the tab that is selected.
	 *
	 * In `activationMode="auto"` the two move together and this is redundant. In
	 * `manual` they deliberately come apart — arrows move focus, Enter or Space
	 * commits — and conflating them broke arrow navigation outright: keyboard
	 * focus computed its next target from the SELECTED index, which does not
	 * move while you arrow, so every ArrowRight resolved to `selected + 1` and
	 * focus could never travel more than one tab from the selection.
	 *
	 * `null` means "follow the selection", which is the correct initial state:
	 * before anyone has interacted, the selected tab is the one that should be
	 * tabbable.
	 */
	private readonly focusedKey = signal<string | null>(null);

	/**
	 * The tab that carries `tabindex="0"` — the single tab stop for the tablist.
	 *
	 * Per the ARIA APG this is the tab with focus, not the tab that is selected.
	 * Binding it to selection meant that in manual mode a focused-but-unselected
	 * tab carried `tabindex="-1"`: focused and not tabbable, so tabbing out and
	 * back returned you to the selected tab rather than where you left.
	 *
	 * Re-validated against the live keys, so a panel removed while focused falls
	 * back to the selection rather than leaving the tablist with no tab stop.
	 */
	readonly rovingKey = computed<string | null>(() => {
		const focused = this.focusedKey();
		const keys = this.panels().map((p) => p.key());
		if (focused && keys.includes(focused)) return focused;
		return this.resolvedActive();
	});

	/** Records which tab focus landed on, however it got there — arrow or click. */
	onTabFocus(key: string): void {
		this.focusedKey.set(key);
	}

	// ── Public API ────────────────────────────────────────────────────────────────

	/**
	 * Activate a panel by key. Updates the model (notifies parent if bound)
	 * and the internal resolvedActive signal.
	 */
	selectPanel(key: string): void {
		this.active.set(key);
	}

	// ── Constructor / lifecycle ───────────────────────────────────────────────────

	constructor() {
		if (isDevMode()) {
			afterNextRender(() => {
				const el = this.elementRef.nativeElement;
				if (el.tagName !== "SECTION") {
					console.warn(
						`InteropTabs must be used on <section> elements for semantic correctness. ` +
							`Found on: ${el.tagName.toLowerCase()}`,
					);
				}

				/*
				 * The tab strip has TWO slots, and the default one silently
				 * swallows anything the named one misses. Mistype
				 * `interop-tabs-actions` and your toolbar renders in the panel
				 * area, below the tabs, still perfectly functional — the kind of
				 * bug you only find by looking. So: anything projected that is
				 * neither a panel nor the bar gets named here.
				 */
				for (const child of Array.from(el.children) as Element[]) {
					if (child.classList.contains("itx-tabs__bar")) continue;
					if (child.matches("section[interop-tab-panel]")) continue;
					console.warn(
						`[InteropTabs] <${child.tagName.toLowerCase()}> is a child of ` +
							`interop-tabs but is neither a section[interop-tab-panel] nor ` +
							`marked [interop-tabs-actions], so it has been projected into ` +
							`the panel area. Add [interop-tabs-actions] to put it in the ` +
							`tab strip, or move it out of the tabs.`,
						child,
					);
				}

				if (!this.ariaLabel() && !this.ariaLabelledBy()) {
					/*
					 * Almost always the same mistake, so name it rather than
					 * describing the symptom: `aria-label="…"` is a plain
					 * attribute and sets no input, so it lands on the host
					 * <section> — which makes that a named REGION landmark and
					 * leaves the tablist anonymous. The two spellings look
					 * interchangeable and are not.
					 */
					const misplaced = el.hasAttribute("aria-label")
						? ` The host carries aria-label="${el.getAttribute("aria-label")}", which names the <section>, not the tablist — write ariaLabel="…" (or [ariaLabel]) instead.`
						: "";
					console.warn(
						"[InteropTabs] the tablist has no accessible name. Set " +
							"ariaLabel or ariaLabelledBy — a screen-reader user hearing " +
							"only \u201ctab list\u201d cannot tell one strip from another " +
							`on the same page.${misplaced}`,
						el,
					);
				}
			});
		}

		// Register with InteropActivation when activationId is provided.
		// Payload is expected to be the target panel key (string).
		effect(() => {
			const id = this.activationId();
			if (!id || !this.activationService) return;

			const registration = this.activationService.register(
				id,
				(payload: unknown) => {
					if (typeof payload === "string") {
						this.selectPanel(payload);
					}
				},
			);

			this.destroyRef.onDestroy(() => registration.unregister());
		});
	}

	// ── Keyboard navigation ───────────────────────────────────────────────────────

	/**
	 * Handles arrow key, Home, and End navigation across the tablist.
	 * Attached to the tablist container so the event bubbles from any tab button.
	 */
	onTablistKeydown(event: KeyboardEvent): void {
		const panels = this.panels();
		if (!panels.length) return;

		// Focus, not selection — see rovingKey above for why they differ.
		const currentIdx = panels.findIndex((p) => p.key() === this.rovingKey());
		const isHorizontal = this.orientation() === "horizontal";
		const prevKey = isHorizontal ? "ArrowLeft" : "ArrowUp";
		const nextKey = isHorizontal ? "ArrowRight" : "ArrowDown";

		let targetIdx: number | null = null;

		if (event.key === nextKey) {
			targetIdx = (currentIdx + 1) % panels.length;
		} else if (event.key === prevKey) {
			targetIdx = (currentIdx - 1 + panels.length) % panels.length;
		} else if (event.key === "Home") {
			targetIdx = 0;
		} else if (event.key === "End") {
			targetIdx = panels.length - 1;
		}

		if (targetIdx === null) return;

		event.preventDefault();

		const targetKey = panels[targetIdx].key();

		if (this.activationMode() === "auto") {
			this.selectPanel(targetKey);
		}

		this.focusedKey.set(targetKey);
		this.tabButtons()[targetIdx]?.nativeElement.focus();
	}

	/**
	 * Handles Enter / Space on individual tab buttons in manual activation mode.
	 * Also attached to each button so the event does not need to bubble to the
	 * tablist for activation — only navigation events are handled there.
	 */
	onTabKeydown(event: KeyboardEvent, key: string): void {
		if (
			this.activationMode() === "manual" &&
			(event.key === "Enter" || event.key === " ")
		) {
			event.preventDefault();
			this.selectPanel(key);
		}
	}
}
