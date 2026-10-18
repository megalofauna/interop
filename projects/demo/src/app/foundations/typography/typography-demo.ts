import {
	Component,
	ElementRef,
	afterNextRender,
	signal,
	viewChildren,
} from "@angular/core";

@Component({
	selector: "demo-typography",
	host: { "itx-flow": "" },
	templateUrl: "./typography-demo.html",
	styleUrl: "./typography-demo.css",
})
export class TypographyDemo {
	protected readonly roles = [
		"display",
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"p-lg",
		"p",
		"p-sm",
		"label",
		"caption",
	];
	protected readonly measures = signal<string[]>([]);
	private readonly samples = viewChildren<ElementRef<HTMLElement>>("sample");

	constructor() {
		const measure = () => {
			this.measures.set(
				this.samples().map(({ nativeElement }) => {
					const style = getComputedStyle(nativeElement);
					return `${parseFloat(style.fontSize)} / ${parseFloat(style.lineHeight)}px, weight ${style.fontWeight}`;
				}),
			);
		};
		afterNextRender(measure);
	}
}
