import {
	Component,
	ElementRef,
	ViewEncapsulation,
	afterRenderEffect,
	booleanAttribute,
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
 * <demo-example [html]="columns" [bind]="bindColumns" [ts]="columnsTs" layout="stack" />
 * <demo-example [html]="heavy" [css]="heavyCss" />
 * ```
 *
 * - `html` is plain HTML from an example file, imported as text. Its icons are drawn with
 *   drawIcons().
 * - `css`, also from a file, styles the live example and is shown as its own block. Page styles do
 *   not reach the inserted markup, since Angular scopes them to the page's own template.
 * - `bind` attaches the framework-free helper the example needs, such as bindTabs, and returns the
 *   function that removes it. `ts` shows that call.
 */
@Component({
	selector: "demo-example",
	imports: [InteropCodeBlock],
	host: {
		"itx-flow": "",
		"[attr.layout]": "layout()",
		"[attr.narrow]": "narrow() ? '' : null",
	},
	template: `
		<div class="live" #live></div>
		<figure
			interop-code-block
			language="html"
			[caption]="caption()"
			[code]="html()"
		></figure>
		@if (css(); as css) {
			<figure
				interop-code-block
				language="css"
				caption="CSS"
				[code]="css"
			></figure>
		}
		@if (ts(); as ts) {
			<figure
				interop-code-block
				language="ts"
				caption="TS"
				[code]="ts"
			></figure>
		}
	`,
	styleUrl: "./example.css",
	encapsulation: ViewEncapsulation.None,
})
export class DemoExample {
	readonly html = input.required<string>();
	readonly caption = input("HTML");
	readonly css = input<string>();
	readonly ts = input<string>();
	/** Binds behavior to the inserted markup. Returns the function that removes it. */
	readonly bind = input<(root: HTMLElement) => (() => void) | void>();
	/** `row`: side by side, wrapping. `stack`: one under another. `end`: a row at the inline end. */
	readonly layout = input<"row" | "stack" | "end">("row");
	/** At most 20rem wide, to show how the example wraps. */
	readonly narrow = input(false, { transform: booleanAttribute });

	private readonly live = viewChild.required<ElementRef<HTMLElement>>("live");

	constructor() {
		afterRenderEffect((onCleanup) => {
			const root = this.live().nativeElement;
			// The demo's own example files, bundled with it, never user content. Angular's sanitizer
			// would strip attributes such as `command`, so the markup goes in as it is.
			const css = this.css();
			root.innerHTML = (css ? `<style>${css}</style>` : "") + this.html();
			drawIcons(root);
			const unbind = this.bind()?.(root);
			onCleanup(() => unbind?.());
		});
	}
}
