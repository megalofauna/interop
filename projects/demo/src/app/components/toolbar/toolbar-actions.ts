/**
 * A Markdown action for a text area.
 *
 * - `inline`: markers around text, such as `**` for bold. A toggle: pressed while the selection or
 *   the cursor is inside a pair of markers on its line.
 * - `line`: a prefix on each line, such as `> ` for a quote. A toggle: pressed while every selected
 *   line has the prefix.
 * - `link`: a command. It has no on and off.
 */
export type MarkdownAction =
	| {
			readonly kind: "inline";
			readonly label: string;
			readonly icon: string;
			readonly marker: string;
	  }
	| {
			readonly kind: "line";
			readonly label: string;
			readonly icon: string;
			/** Written on a line that lacks it. Numbered lists write their own numbers. */
			readonly prefix: string;
			/** Recognizes the prefix in any of its forms, such as `## ` for a heading. */
			readonly pattern: RegExp;
			readonly numbered?: boolean;
	  }
	| { readonly kind: "link"; readonly label: string; readonly icon: string };

export const groups: readonly {
	label: string;
	actions: readonly MarkdownAction[];
}[] = [
	{
		label: "Text",
		actions: [
			{
				kind: "line",
				label: "Heading",
				icon: "tabler-heading",
				prefix: "### ",
				pattern: /^#{1,6} /,
			},
			{ kind: "inline", label: "Bold", icon: "tabler-bold", marker: "**" },
			{ kind: "inline", label: "Italic", icon: "tabler-italic", marker: "_" },
			{
				kind: "inline",
				label: "Strikethrough",
				icon: "tabler-strikethrough",
				marker: "~~",
			},
		],
	},
	{
		label: "Insert",
		actions: [
			{
				kind: "line",
				label: "Quote",
				icon: "tabler-quote",
				prefix: "> ",
				pattern: /^> /,
			},
			{ kind: "inline", label: "Code", icon: "tabler-code", marker: "`" },
			{ kind: "link", label: "Link", icon: "tabler-link" },
		],
	},
	{
		label: "Lists",
		actions: [
			{
				kind: "line",
				label: "Bulleted list",
				icon: "tabler-list",
				prefix: "- ",
				pattern: /^[-*] /,
			},
			{
				kind: "line",
				label: "Numbered list",
				icon: "tabler-list-numbers",
				prefix: "1. ",
				pattern: /^\d+\. /,
				numbered: true,
			},
		],
	},
];

/** The start and end of the line holding `start`, and of the line holding `end`. */
function lineRange(
	value: string,
	start: number,
	end: number,
): [number, number] {
	const from = value.lastIndexOf("\n", start - 1) + 1;
	const next = value.indexOf("\n", end);
	return [from, next < 0 ? value.length : next];
}

/** The pair of `marker`s on the cursor's line that holds the selection, as [open, close] offsets. */
function enclosingPair(
	value: string,
	start: number,
	end: number,
	marker: string,
): [number, number] | null {
	const [from, to] = lineRange(value, start, start);
	const line = value.slice(from, to);
	const found: number[] = [];
	for (
		let at = line.indexOf(marker);
		at >= 0;
		at = line.indexOf(marker, at + marker.length)
	)
		found.push(from + at);
	for (let i = 0; i + 1 < found.length; i += 2) {
		const [open, close] = [found[i], found[i + 1]];
		if (open + marker.length <= start && end <= close) return [open, close];
	}
	return null;
}

/** Whether `action` is on for the selection in `field`: always false for a command. */
export function isPressed(
	field: HTMLTextAreaElement,
	action: MarkdownAction,
): boolean {
	const { selectionStart: start, selectionEnd: end, value } = field;
	if (action.kind === "inline")
		return enclosingPair(value, start, end, action.marker) !== null;
	if (action.kind === "line") {
		const [from, to] = lineRange(value, start, end);
		return value
			.slice(from, to)
			.split("\n")
			.every((line) => action.pattern.test(line));
	}
	return false;
}

/**
 * Replaces `from`–`to` in `field` with `text`, then selects `select`. execCommand("insertText") is
 * the one way to change a text area that the browser's undo history records, so Ctrl+Z reverses
 * the edit. Where it fails, setRangeText() makes the same change without undo.
 */
function replace(
	field: HTMLTextAreaElement,
	from: number,
	to: number,
	text: string,
	select: [number, number],
): void {
	field.focus();
	field.setSelectionRange(from, to);
	if (!field.ownerDocument.execCommand?.("insertText", false, text))
		field.setRangeText(text, from, to);
	field.setSelectionRange(...select);
}

/** Turns `action` on or off for the selection in `field`, or runs it, and focuses the field. */
export function applyMarkdown(
	field: HTMLTextAreaElement,
	action: MarkdownAction,
): void {
	const { selectionStart: start, selectionEnd: end, value } = field;

	if (action.kind === "link") {
		const text = value.slice(start, end);
		// With text, select the address to replace; without, put the cursor where the text goes.
		const url = start + 1 + text.length + 2;
		replace(
			field,
			start,
			end,
			`[${text}](https://)`,
			text ? [url, url + 8] : [start + 1, start + 1],
		);
		return;
	}

	if (action.kind === "line") {
		const [from, to] = lineRange(value, start, end);
		const lines = value.slice(from, to).split("\n");
		const on = lines.every((line) => action.pattern.test(line));
		const edited = lines.map((line, index) =>
			on
				? line.replace(action.pattern, "")
				: action.pattern.test(line)
					? line
					: (action.numbered ? `${index + 1}. ` : action.prefix) + line,
		);
		// The cursor moves with the first line's prefix; the end moves with every line's.
		const first = edited[0].length - lines[0].length;
		const total = edited.join("\n").length - (to - from);
		replace(field, from, to, edited.join("\n"), [
			Math.max(from, start + first),
			Math.max(from, end + total),
		]);
		return;
	}

	const { marker } = action;
	const pair = enclosingPair(value, start, end, marker);
	if (!pair) {
		// Off: wrap the selection, or with none, insert an empty pair to type between.
		const inner = start + marker.length;
		replace(field, start, end, marker + value.slice(start, end) + marker, [
			inner,
			inner + end - start,
		]);
		return;
	}
	const [open, close] = pair;
	const content: [number, number] = [open + marker.length, close];
	if (start === end && content[0] === content[1]) {
		// An empty pair: remove it.
		replace(field, open, close + marker.length, "", [open, open]);
	} else if (start === end && start === close) {
		// At the end of the marked text: step past the closing marker and keep typing plain.
		field.focus();
		field.setSelectionRange(close + marker.length, close + marker.length);
	} else if (start === content[0] && end === content[1]) {
		// Exactly the marked text: unwrap it.
		replace(field, open, close + marker.length, value.slice(...content), [
			open,
			open + end - start,
		]);
	} else {
		// Elsewhere inside the marked text, splitting the pair would surprise more than it helps.
		field.focus();
	}
}
