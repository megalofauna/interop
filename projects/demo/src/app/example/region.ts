/**
 * A marked region of a page's own template, as the code shown under its live example:
 *
 * ```html
 * <!-- example: pressed -->
 * <button interop-button type="button" [attr.aria-pressed]="bold()">Bold</button>
 * <!-- /example -->
 * ```
 *
 * ```ts
 * import template from "./button-demo.html";
 * protected readonly pressed = region(template, "pressed");
 * ```
 *
 * The region is both what Angular renders and what the reader copies. It is dedented to its least
 * indented line. A missing region throws, so a renamed marker fails at once.
 */
export function region(template: string, name: string): string {
	const start = `<!-- example: ${name} -->`;
	const from = template.indexOf(start);
	const to = template.indexOf("<!-- /example -->", from);
	if (from < 0 || to < 0)
		throw new Error(`No example region "${name}" in the template.`);
	const lines = template.slice(from + start.length, to).split("\n");
	while (lines.length && !lines[0].trim()) lines.shift();
	while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
	const indent = Math.min(
		...lines
			.filter((line) => line.trim())
			.map((line) => /^\t*/.exec(line)![0].length),
	);
	return lines.map((line) => line.slice(indent)).join("\n") + "\n";
}
