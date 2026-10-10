/**
 * The demo app's catalog of pages — the single source for what exists and what
 * it is called.
 *
 * Deliberately a plain data module with NO Angular imports. `demo-nav.ts` is a
 * `@Component` carrying a `provideInteropIcons()` provider, so a page that
 * imported it just to read this array would pull the whole sidebar and an icon
 * set into its own lazy chunk. Two consumers, one array, no component
 * dependency, and it tree-shakes.
 *
 * Consumers:
 *   - `demo-nav.ts`              → sidebar labels + routes
 *   - `pages/components/`        → the component directory's cards
 *
 * ── Still not the whole story ──────────────────────────────────────────────
 *
 * `app.routes.ts` remains a third list. It cannot be generated from this one
 * without moving the `loadComponent` thunks here, and a data module holding
 * dynamic imports is no longer a data module — it would defeat the point above
 * by pulling every page into whatever imports it. So the invariant to hold by
 * hand is now just: **a route in `app.routes.ts` has an entry here.** That is
 * one pairing to check instead of three, and the directory page makes a miss
 * visible — a routed page with no catalog entry simply is not listed.
 */

export interface CatalogItem {
	label: string;

	/**
	 * Absent means "no demo page yet". Such an item still appears in the
	 * sidebar, as a non-interactive placeholder, and is omitted from the
	 * directory entirely — a card you cannot follow is a dead tab stop.
	 */
	route?: string;

	/**
	 * Match this route EXACTLY rather than by prefix.
	 *
	 * `routerLinkActive` defaults to prefix matching, which is right for every
	 * leaf route here but wrong for a route that is an ancestor of its
	 * siblings: `/components` is a prefix of `/components/badge`, so the
	 * landing-page link would render permanently active on every component
	 * page. Set this on any route that contains another.
	 */
	exact?: boolean;

	/**
	 * Not part of the consumer-facing surface — a primitive or shared layer that
	 * exists to serve another component. Rendered with an "internal" chip in the
	 * sidebar and on the page masthead so nobody builds against it by accident.
	 */
	internal?: boolean;

	/**
	 * One line, shown under the label on the directory card. Condensed from the
	 * target page's own masthead lead, which is already curated and is
	 * maintained next to the thing it describes.
	 *
	 * Optional on purpose. A routed entry with no description still renders a
	 * card, just without the blurb — so the failure mode of adding a component
	 * and forgetting the copy is a thin card, not a missing one.
	 */
	description?: string;
}

export interface CatalogGroup {
	label: string;

	/** Anchor slug for the directory page's section. */
	id: string;

	/**
	 * Directory page for this group. When set, the masthead renders the category
	 * eyebrow as a link to it, so "Components" on any component page returns to
	 * the index. Groups without their own index leave this unset.
	 */
	landingRoute?: string;

	/** Rendered in the sidebar as an empty, dimmed heading — a promise, not a
	 *  link. Such groups have no items and are skipped by the directory. */
	disabled?: boolean;

	items: CatalogItem[];
}

/**
 * Group order is the reading order in both consumers. Entries are alphabetical
 * by label within a group.
 */
export const DEMO_CATALOG: readonly CatalogGroup[] = [
	{
		label: "Foundations",
		id: "foundations",
		items: [
			{
				label: "Colour",
				route: "/foundation/color",
				description:
					"Six surface values the engine indexes from depth, and a role for every job drawn on them, with every contrast floor measured in a browser rather than asserted.",
			},
			{
				label: "Principles",
				route: "/foundation/principles",
				description:
					"The premise that the web platform already ships most of what a component library wants — and what follows from it.",
			},
			{
				label: "Typography",
				route: "/foundation/typography",
				description:
					"A fluid clamp() size ramp, one line-height staked to it, and owl-model rhythm.",
			},
		],
	},
	{
		label: "Components",
		id: "components",
		landingRoute: "/components",
		items: [
			{
				label: "Badge",
				route: "/components/badge",
				description:
					"Overlay notification counter, placed with CSS anchor positioning rather than layout JavaScript.",
			},
			{
				label: "Button",
				route: "/components/button",
				description:
					"Native button with three availability states and optional activation guards — throttle, debounce, reentrance.",
			},
			{
				label: "Callout",
				route: "/components/callout",
				description:
					"Semantic status admonition for inline notices, warnings, and alerts.",
			},
			{
				label: "Checkbox",
				route: "/components/checkbox",
				description:
					"Native input inside a semantic label, with declarative indeterminate state.",
			},
			{
				label: "Chip",
				route: "/components/chip",
				description:
					"Inline badges, display tags, filter checkboxes, and free-form input.",
			},
			{
				label: "Dialog",
				route: "/components/dialog",
				description:
					"Modal dialog on the native <dialog> element — top layer, focus trapping, and ::backdrop with no custom ARIA.",
			},
			{
				label: "Expansion Panel",
				route: "/components/expansion-panel",
				description:
					"Collapsible panels on the APG accordion pattern, standalone or grouped with mutual exclusion.",
			},
			{
				label: "Field",
				route: "/components/field",
				description:
					"Label, control, helper text, errors, and the ARIA between them as one ControlValueAccessor unit.",
			},
			{
				label: "Icon",
				route: "/components/icon",
				description:
					"Registry-backed SVG renderer. Icons register at any DI scope and are referenced by name.",
			},
			{
				label: "Kbd",
				route: "/components/kbd",
				description:
					"Semantic keyboard key-cap indicator for documenting shortcuts.",
			},
			{
				label: "List",
				route: "/components/list",
				description:
					"Semantic ul, ol, and dl driven by a [collection] input or by projected content.",
			},
			{
				label: "Listbox",
				route: "/components/listbox",
				description:
					"Selection primitive with keyboard navigation, single and multi-select, and Angular Forms integration.",
			},
			{
				label: "Popover",
				route: "/components/popover",
				description:
					"Anchored panel on the native popover attribute. Role is the consumer's decision.",
			},
			{
				label: "Progress",
				route: "/components/progress",
				description:
					"Native <progress> with correct indeterminate ARIA and humanized value text.",
			},
			{
				label: "Radio",
				route: "/components/radio",
				description:
					"Mutually exclusive selection on native radio inputs — a declarative rig, or projected controls.",
			},
			{
				label: "Resizable",
				route: "/components/resizable",
				description:
					"Drag-to-resize wrapper. Pure CSS by default; keyboard, snapping, and readout activate with their inputs.",
			},
			{
				label: "Scroll Area",
				route: "/components/scroll-area",
				description:
					"Constrained scrollable region with optional scroll-shadow edge indicators.",
			},
			{
				label: "Segmented Control",
				route: "/components/segmented-control",
				description:
					"Mutually exclusive option group on a native fieldset, with an anchor-positioned selection pill.",
			},
			{
				label: "Slider",
				route: "/components/slider",
				description:
					'Single-thumb and range sliders on real <input type="range"> elements — the directive decorates, never replaces.',
			},
			{
				label: "Stepper",
				route: "/components/stepper",
				description:
					"Multi-step wizard with an action bar, a responsive step menu, and linear or free navigation.",
			},
			{
				label: "Table",
				route: "/components/table",
				description:
					"Semantic table for structured data. Column definitions drive rendering; density, sorting, and sticky columns are opt-in.",
			},
			{
				label: "Tabs",
				route: "/components/tabs",
				description:
					"ARIA tab group with a generated tablist. Inactive panels stay in the DOM, so their state survives a switch.",
			},
			{
				label: "Toast",
				route: "/components/toast",
				description:
					"Transient notifications driven from code — one viewport in the shell, one service call anywhere.",
			},
			{
				label: "Toggle",
				route: "/components/toggle",
				description:
					'Binary switch on a native checkbox with role="switch". Submits with the form, no extra JavaScript.',
			},
			{
				label: "Tooltip",
				route: "/components/tooltip",
				description:
					"WCAG 1.4.13-compliant tooltip: shows on hover and focus, dismissible with Escape, hoverable without closing.",
			},
			{
				label: "Tree",
				route: "/components/tree",
				description:
					'Collapsible hierarchy in two tiers — a nested-list disclosure, or a role="tree" widget with roving focus.',
			},
			{
				label: "Visimorph",
				route: "/components/visimorph",
				internal: true,
				description:
					"Shared visual indicator layer for radio, checkbox, and toggle controls, rendered entirely in CSS.",
			},
		],
	},
	{
		label: "Directives",
		id: "directives",
		items: [
			{
				label: "Auto Render",
				route: "/components/auto-render",
				description:
					"Applies content-visibility: auto so off-screen items skip layout and paint — no DOM virtualisation.",
			},
		],
	},
	{
		label: "Primitives",
		id: "primitives",
		items: [
			{
				label: "Code Renderer",
				route: "/components/code-renderer",
				internal: true,
				description:
					"Minimal tokenized code primitive. Takes pre-tokenized [tokens], or falls back to projected <pre><code>.",
			},
		],
	},
	{ label: "Rigs", id: "rigs", disabled: true, items: [] },
	{ label: "Services", id: "services", disabled: true, items: [] },
	{
		label: "Composites",
		id: "composites",
		landingRoute: "/composites",
		items: [
			{
				label: "Code Block",
				route: "/composites/code-block",
				description:
					"Tabbed code viewer with copy, optional line numbers, and a word-wrap toggle. Blocks sharing a syncKey switch tabs together.",
			},
			{
				label: "Inline Code",
				route: "/composites/inline-code",
				description:
					"Short code fragments inside running prose, with a copy affordance and the same highlighter as the block.",
			},
			{
				label: "Page Nav",
				route: "/composites/page-nav",
				description:
					"In-page anchor navigation in either orientation, with an optional sticky reveal. Renders active state rather than tracking it.",
			},
			{
				label: "Terminal",
				route: "/composites/terminal",
				description:
					"Append-only log panel with a console treatment, relative timestamps, and a bounded entry count.",
			},
		],
	},
];

/**
 * The catalog as the directory page wants it: routable, non-nav entries only,
 * and no group left empty by that filter.
 *
 * Derived rather than maintained, so an item can never be in one consumer and
 * not the other — which was the whole reason for this module.
 *
 * Pass group ids to select and order them; omit for all. Each landing page
 * names the groups it owns, so adding a new group makes someone decide where it
 * belongs instead of having it appear on whichever directory happens to render
 * everything.
 */
export function directoryGroups(ids?: readonly string[]): CatalogGroup[] {
	const wanted = ids
		? ids
				.map((id) => DEMO_CATALOG.find((g) => g.id === id))
				.filter((g): g is CatalogGroup => g !== undefined)
		: DEMO_CATALOG;

	return wanted
		.map((group) => ({
			...group,
			items: group.items.filter((item) => item.route),
		}))
		.filter((group) => !group.disabled && group.items.length > 0);
}
