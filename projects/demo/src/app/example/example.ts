import {
	Component,
	ElementRef,
	afterRenderEffect,
	input,
	viewChild,
} from "@angular/core";
import { drawIcons } from "interop";
import { InteropCodeBlock } from "interop/code-block";

/**
 * One example, from one source: the markup is inserted as the live demo and shown as the code
 * below it, so what a reader copies is what they see working.
 *
 * ```html
 * <demo-example [html]="sizes" />
 * <demo-example [html]="tabs" [bind]="bindTabs" layout="stack" />
 * ```
 *
 * `html` is plain HTML from an example file, imported as text. Icons are drawn with drawIcons().
 * `bind` attaches the framework-free helper a component needs, such as bindTabs, and returns the
 * function that removes it.
 */
@Component({
	selector: "demo-example",
	imports: [InteropCodeBlock],
	host: { "itx-flow": "", "[attr.layout]": "layout()" },
	template: `
		<div class="live" #live></div>
		<figure
			interop-code-block
			language="html"
			[caption]="caption()"
			[code]="html()"
		></figure>
	`,
	styleUrl: "./example.css",
})
export class DemoExample {
	readonly html = input.required<string>();
	readonly caption = input("HTML");
	/** Binds behavior to the inserted markup. Returns the function that removes it. */
	readonly bind = input<(root: HTMLElement) => (() => void) | void>();
	/** `row`: the example's elements side by side, wrapping. `stack`: one under another. */
	readonly layout = input<"row" | "stack">("row");

	private readonly live = viewChild.required<ElementRef<HTMLElement>>("live");

	constructor() {
		afterRenderEffect((onCleanup) => {
			const root = this.live().nativeElement;
			// The demo's own example files, bundled with it, never user content. Angular's sanitizer
			// would strip attributes such as `command`, so the markup goes in as it is.
			root.innerHTML = this.html();
			drawIcons(root);
			const unbind = this.bind()?.(root);
			onCleanup(() => unbind?.());
		});
	}
}
