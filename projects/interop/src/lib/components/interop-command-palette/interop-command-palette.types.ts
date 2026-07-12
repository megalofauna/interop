/**
 * A single entry in the command palette. The consumer supplies these *already
 * filtered and ranked* — the palette never filters, ranks, or fuzzy-matches
 * (that's the consumer's job and the whole differentiator). `id` is the stable
 * identity: option ids, selection, and the `(command)` output all key off it,
 * never off text content.
 */
export interface CommandItem {
	/** Stable unique id. Drives tracking, option ids, and `(command)`. */
	id: string;
	/** Visible label. */
	label: string;
	/** Optional leading icon name (interop-icon registry). */
	icon?: string;
	/** Optional trailing shortcut hint, rendered in an `interop-kbd`. */
	shortcut?: string;
	/** Optional secondary/description text shown after the label. */
	description?: string;
	/** When true the item is shown but not activatable. */
	disabled?: boolean;
}
