/**
 * Every demo page under /components, in one list: the routes, the Components index and the sidebar
 * all read it. Plain data with no Angular, so other tools can read it too.
 *
 * It lists pages, not library entry points: an entry point with no page of its own, such as
 * interop/shortcut or interop/color-scheme, is not here. Foundations and labs are not here either.
 * The list is in alphabetical order by title; catalog.spec.ts checks it.
 */
export interface CatalogEntry {
	/** The page's URL segment and folder: /components/<slug>. Kebab case, unique. */
	slug: string;
	/** The page's title, as in the nav. Unique. */
	title: string;
	/** One sentence saying what it is, for the index. */
	summary: string;
	/** A picture for the index's cards. It repeats the title, so it is decorative: alt="". */
	imageUrl?: string;
	/** The slugs of the Interop components it is built from. The reverse, used by, is derived. */
	builtFrom?: readonly string[];
	/** The functions from `interop` and the custom elements it offers. Absent when it is CSS only. */
	helpers?: readonly string[];
	/** The kind of component, for grouping the index. Absent when none fits. */
	category?: "input" | "panel" | "navigation" | "utility" | "augmentation" | "readout";
}

export const catalog = [
	{
		slug: "accordion",
		title: "Accordion",
		category: "panel",
		summary:
			"A stack of disclosures under a heading, each opening its own section.",
		builtFrom: ["disclosure"],
	},
	{
		slug: "badge",
		title: "Badge",
		summary:
			"A count, a status or a category, as text that is never interactive.",
	},
	{
		slug: "button",
		title: "Button",
		category: "input",
		summary:
			"An action, on the native button, with sizes, icons and a pending state.",
		helpers: ["bindPendingAction"],
	},
	{
		slug: "callout",
		title: "Callout",
		summary:
			"A short note set apart from the text around it: a warning, a tip, a fact the reader should not miss.",
	},
	{
		slug: "cards",
		title: "Cards",
		category: "input",
		summary: "The options of a radio or checkbox group, drawn as cards.",
		builtFrom: ["checkbox", "radio-group"],
	},
	{
		slug: "checkbox",
		title: "Checkbox",
		category: "input",
		summary: "A native checkbox inside its label, alone or in a group.",
		helpers: ["bindSelectAll"],
	},
	{
		slug: "chips",
		title: "Chips",
		category: "input",
		summary: "The options of a checkbox or radio group, drawn as pills.",
		builtFrom: ["checkbox", "radio-group"],
	},
	{
		slug: "code-block",
		title: "Code block",
		summary: "Code with syntax highlighting, a caption and a copy button.",
		builtFrom: ["button", "scroll-area", "tooltip"],
		helpers: ["highlightCode"],
	},
	{
		slug: "command-palette",
		title: "Command palette",
		category: "navigation",
		summary:
			"A search field over a list of links, in a dialog that a shortcut opens.",
		builtFrom: ["dialog", "field"],
		helpers: ["bindFilter", "bindShortcut"],
	},
	{
		slug: "dialog",
		title: "Dialog",
		category: "panel",
		summary: "The native dialog, modal or not, with Interop's look.",
	},
	{
		slug: "disclosure",
		title: "Disclosure",
		category: "panel",
		summary: "A summary that shows and hides the content after it.",
	},
	{
		slug: "field",
		title: "Field",
		category: "input",
		summary: "A label, an optional hint and error, and a native control.",
		helpers: [
			"bindCharacterCount",
			"bindPasswordToggle",
			"<interop-character-count>",
			"<interop-password>",
			"<interop-validation>",
		],
	},
	{
		slug: "group",
		title: "Group",
		category: "input",
		summary: "Controls that belong together, with one name.",
	},
	{
		slug: "icon",
		title: "Icon",
		summary: "An SVG named after a registered icon.",
		category: "utility",
		helpers: ["drawIcons", "registerIcons"],
	},
	{
		slug: "list",
		title: "List",
		category: "augmentation",
		summary: "A numbered list with each number drawn in a circle.",
	},
	{
		slug: "page-nav",
		title: "Page nav",
		category: "navigation",
		summary: "Links to the sections of the page, marking the one in view.",
		builtFrom: ["tree"],
		helpers: ["bindTargetCurrent"],
	},
	{
		slug: "popover",
		title: "Popover",
		category: "panel",
		summary:
			"The platform's popover, anchored to the button that opens it, or a drawer.",
		helpers: ["bindDrawer"],
	},
	{
		slug: "progress",
		title: "Progress",
		category: "readout",
		summary: "How far a task has got: an upload, a sync, an export.",
	},
	{
		slug: "radio-group",
		title: "Radio group",
		category: "input",
		summary: "One choice from a set: native radios that share a name.",
	},
	{
		slug: "scroll-area",
		title: "Scroll area",
		category: "panel",
		summary:
			"A scroll container with a shadow at each edge that has more content.",
		helpers: ["bindScrollArea"],
	},
	{
		slug: "segmented-control",
		title: "Segmented control",
		category: "input",
		summary: "A radio group drawn as a row of segments.",
		builtFrom: ["radio-group"],
		helpers: ["bindRadioHomeEnd", "bindSegmentedFit"],
	},
	{
		slug: "select",
		title: "Select",
		category: "input",
		summary: "The native select, with a field's look.",
	},
	{
		slug: "slider",
		title: "Slider",
		category: "input",
		summary:
			"One value from a range, when the range matters more than the exact number.",
		helpers: ["bindSlider"],
	},
	{
		slug: "split-button",
		title: "Split button",
		category: "input",
		summary: "An action, joined to a button that opens other choices for it.",
		builtFrom: ["button", "group", "popover"],
	},
	{
		slug: "steps",
		title: "Steps",
		category: "navigation",
		summary: "Where you are in an ordered process, and the steps themselves.",
		helpers: ["bindSteps"],
	},
	{
		slug: "switch",
		title: "Switch",
		category: "input",
		summary: "An on or off setting: a native checkbox with the switch role.",
	},
	{
		slug: "table",
		title: "Table",
		summary: "Data in rows and columns, on the native table.",
	},
	{
		slug: "tabs",
		title: "Tabs",
		category: "panel",
		summary: "One of several sections shown at a time.",
		helpers: ["bindTabs", "<interop-tabs>"],
	},
	{
		slug: "tags",
		title: "Tags",
		category: "input",
		summary:
			"Values the user can remove: applied filters, or the entries of a tag input.",
		helpers: ["bindTagInput", "bindTags"],
	},
	{
		slug: "theme-switcher",
		title: "Theme switcher",
		category: "input",
		summary: "Light, Dark and System, as a segmented control.",
		builtFrom: ["segmented-control"],
		helpers: ["bindColorScheme"],
	},
	{
		slug: "toast",
		title: "Toast",
		summary:
			"A short message about something the user just did, in a corner of the window.",
		helpers: ["bindToasts", "toast"],
	},
	{
		slug: "toolbar",
		title: "Toolbar",
		category: "input",
		summary: "Three or more controls that act on one thing, as one Tab stop.",
		helpers: ["bindToolbar"],
	},
	{
		slug: "tooltip",
		title: "Tooltip",
		summary:
			"Text shown while the pointer rests on its trigger or the trigger has focus.",
		helpers: ["bindTooltips"],
	},
	{
		slug: "tree",
		title: "Tree",
		category: "navigation",
		summary: "Navigation through a hierarchy of pages.",
	},
] as const satisfies readonly CatalogEntry[];

export type CatalogSlug = (typeof catalog)[number]["slug"];

/** The pages built from `slug`: the reverse of builtFrom. */
export const usedBy = (slug: string): CatalogEntry[] =>
	catalog.filter((entry: CatalogEntry) => entry.builtFrom?.includes(slug));
