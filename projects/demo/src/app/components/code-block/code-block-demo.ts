import { Component, DestroyRef, ElementRef, afterNextRender, inject } from "@angular/core";
import { InteropCodeBlock } from "interop/code-block";
import { highlightCode } from "interop/highlight";
// @ts-expect-error The text loader turns the file into a string.
import splitLines from "../../../../../interop/src/split-lines.ts" with { loader: "text" };
// @ts-expect-error The text loader turns the file into a string.
import radius from "../../../../../interop/styles/radius.css" with { loader: "text" };
// @ts-expect-error The text loader turns the file into a string.
import badge from "../../../../../interop/badge/badge.ts" with { loader: "text" };
// @ts-expect-error The text loader turns the file into a string.
import badgeDemo from "../badge/badge-demo.html" with { loader: "text" };

@Component({
	selector: "demo-code-block",
	imports: [InteropCodeBlock],
	templateUrl: "./code-block-demo.html",
	styleUrl: "./code-block-demo.css",
})
export class CodeBlockDemo {
	protected readonly splitLines = splitLines as string;
	protected readonly radius = radius as string;
	protected readonly badge = badge as string;
	protected readonly badgeDemo = badgeDemo as string;
	protected readonly shell = "npx ng build interop\nnpx ng test interop --watch=false\n";

	constructor() {
		const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
		const removers: (() => void)[] = [];
		afterNextRender(async () => {
			for (const code of Array.from(host.querySelectorAll("p > code[class]"))) removers.push(await highlightCode(code));
		});
		inject(DestroyRef).onDestroy(() => removers.forEach((remove) => remove()));
	}
}
