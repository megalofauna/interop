/** A Markdown edit: text around the selection, or a prefix on each of its lines. */
export interface MarkdownAction {
	readonly label: string;
	readonly icon: string;
	readonly before: string;
	readonly after?: string;
	/** Prefix every selected line, starting on a new line. */
	readonly line?: boolean;
	/** Number the lines instead of repeating the prefix. */
	readonly numbered?: boolean;
	/** Inserted when nothing is selected, and selected afterwards so typing replaces it. */
	readonly placeholder: string;
}

export const groups: readonly {
	label: string;
	actions: readonly MarkdownAction[];
}[] = [
	{
		label: "Text",
		actions: [
			{
				label: "Heading",
				icon: "tabler-heading",
				before: "### ",
				line: true,
				placeholder: "Heading",
			},
			{
				label: "Bold",
				icon: "tabler-bold",
				before: "**",
				after: "**",
				placeholder: "bold text",
			},
			{
				label: "Italic",
				icon: "tabler-italic",
				before: "_",
				after: "_",
				placeholder: "italic text",
			},
		],
	},
	{
		label: "Insert",
		actions: [
			{
				label: "Quote",
				icon: "tabler-quote",
				before: "> ",
				line: true,
				placeholder: "Quote",
			},
			{
				label: "Code",
				icon: "tabler-code",
				before: "`",
				after: "`",
				placeholder: "code",
			},
			{
				label: "Link",
				icon: "tabler-link",
				before: "[",
				after: "](https://)",
				placeholder: "link text",
			},
		],
	},
	{
		label: "Lists",
		actions: [
			{
				label: "Bulleted list",
				icon: "tabler-list",
				before: "- ",
				line: true,
				placeholder: "Item",
			},
			{
				label: "Numbered list",
				icon: "tabler-list-numbers",
				before: "1. ",
				line: true,
				numbered: true,
				placeholder: "Item",
			},
		],
	},
];

/**
 * Applies `action` to the selection in `field`, then focuses the field with the edited text selected.
 *
 * execCommand("insertText") is the one way to change a text area that the browser's undo history
 * records, so Ctrl+Z reverses the edit. Where it fails, setRangeText() makes the same change without undo.
 */
export function applyMarkdown(
	field: HTMLTextAreaElement,
	action: MarkdownAction,
): void {
	const { selectionStart: start, selectionEnd: end, value } = field;
	const selected = value.slice(start, end) || action.placeholder;
	let text: string;
	let from: number;
	let to: number;
	if (action.line) {
		const lead = start > 0 && value[start - 1] !== "\n" ? "\n" : "";
		const lines = selected
			.split("\n")
			.map(
				(line, index) =>
					(action.numbered ? `${index + 1}. ` : action.before) + line,
			);
		text = lead + lines.join("\n");
		from =
			start +
			lead.length +
			(lines.length === 1 ? text.length - lead.length - selected.length : 0);
		to = start + text.length;
	} else {
		text = action.before + selected + (action.after ?? "");
		from = start + action.before.length;
		to = from + selected.length;
	}
	field.focus();
	field.setSelectionRange(start, end);
	if (!document.execCommand("insertText", false, text))
		field.setRangeText(text, start, end);
	field.setSelectionRange(from, to);
}
