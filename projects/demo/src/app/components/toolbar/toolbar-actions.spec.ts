import {
	applyMarkdown,
	groups,
	isPressed,
	type MarkdownAction,
} from "./toolbar-actions";

const action = (label: string) =>
	groups
		.flatMap((group) => group.actions)
		.find((a) => a.label === label) as MarkdownAction;

describe("Markdown toolbar actions", () => {
	let field: HTMLTextAreaElement;
	/** Writes `text` with `|` marking the cursor, or `[` and `]` around the selection. */
	const write = (text: string) => {
		const start = text.includes("[") ? text.indexOf("[") : text.indexOf("|");
		const plain = text.replace(/[[\]|]/g, "");
		const end = text.includes("]") ? text.indexOf("]") - 1 : start;
		field.value = plain;
		field.setSelectionRange(start, end);
	};
	/** The text with the selection marked the same way. */
	const read = () => {
		const { value, selectionStart: start, selectionEnd: end } = field;
		return start === end
			? value.slice(0, start) + "|" + value.slice(start)
			: `${value.slice(0, start)}[${value.slice(start, end)}]${value.slice(end)}`;
	};
	const press = (label: string) => applyMarkdown(field, action(label));
	const pressed = (label: string) => isPressed(field, action(label));

	beforeEach(() => {
		document.body.innerHTML = "<textarea></textarea>";
		field = document.querySelector("textarea")!;
	});

	it("turns bold on with nothing selected: an empty pair to type between", () => {
		write("Hi |");
		press("Bold");
		expect(read()).toBe("Hi **|**");
		expect(pressed("Bold")).toBe(true);
	});

	it("removes an empty pair when pressed again", () => {
		write("Hi **|**");
		press("Bold");
		expect(read()).toBe("Hi |");
		expect(pressed("Bold")).toBe(false);
	});

	it("steps past the closing marker at the end of bold text, to carry on in plain text", () => {
		write("Hi **there|**");
		expect(pressed("Bold")).toBe(true);
		press("Bold");
		expect(read()).toBe("Hi **there**|");
		expect(pressed("Bold")).toBe(false);
	});

	it("wraps a plain selection, and unwraps it on a second press", () => {
		write("Hi [there]");
		press("Strikethrough");
		expect(read()).toBe("Hi ~~[there]~~");
		expect(pressed("Strikethrough")).toBe(true);
		press("Strikethrough");
		expect(read()).toBe("Hi [there]");
	});

	it("unwraps the whole pair from the middle of marked text", () => {
		write("Hi **ab|cd** there");
		expect(pressed("Bold")).toBe(true);
		press("Bold");
		expect(read()).toBe("Hi ab|cd there");
		expect(pressed("Bold")).toBe(false);
		write("**a[bc]d**");
		press("Bold");
		expect(read()).toBe("a[bc]d");
	});

	it("reads each marker on its own: bold is not italic", () => {
		write("**bo|ld** and _it_");
		expect(pressed("Bold")).toBe(true);
		expect(pressed("Italic")).toBe(false);
		write("**bold** and _i|t_");
		expect(pressed("Italic")).toBe(true);
		expect(pressed("Bold")).toBe(false);
	});

	it("does not pair markers across lines", () => {
		write("`one\ntw|o`");
		expect(pressed("Code")).toBe(false);
	});

	it("turns a line prefix on and off, keeping the cursor in the text", () => {
		write("Ti|tle");
		press("Heading");
		expect(read()).toBe("### Ti|tle");
		expect(pressed("Heading")).toBe(true);
		press("Heading");
		expect(read()).toBe("Ti|tle");
	});

	it("presses a heading of any level, and removes it whole", () => {
		write("## Ti|tle");
		expect(pressed("Heading")).toBe(true);
		press("Heading");
		expect(read()).toBe("Ti|tle");
	});

	it("numbers each selected line, and is pressed only when every line has a prefix", () => {
		write("[one\ntwo]");
		press("Numbered list");
		expect(field.value).toBe("1. one\n2. two");
		expect(pressed("Numbered list")).toBe(true);
		write("[1. one\ntwo]");
		expect(pressed("Numbered list")).toBe(false);
		press("Numbered list");
		expect(field.value).toBe("1. one\n2. two");
	});

	it("is never pressed for a link, and selects the address to replace", () => {
		write("See [docs]");
		expect(pressed("Link")).toBe(false);
		press("Link");
		expect(read()).toBe("See [docs]([https://])");
	});

	it("returns focus to the field", () => {
		write("**ab|cd**");
		press("Bold");
		expect(document.activeElement).toBe(field);
	});
});
