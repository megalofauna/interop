import {
	Component,
	DestroyRef,
	ElementRef,
	afterNextRender,
	inject,
	signal,
	viewChildren,
} from "@angular/core";

@Component({
	selector: "demo-typography",
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
		"fine-print",
	];
	protected readonly measures = signal<string[]>([]);
	protected readonly viewport = signal(0);
	private readonly samples = viewChildren<ElementRef<HTMLElement>>("sample");

	constructor() {
		const measure = () => {
			this.viewport.set(window.innerWidth);
			this.measures.set(
				this.samples().map(({ nativeElement }) => {
					const style = getComputedStyle(nativeElement);
					return `${parseFloat(style.fontSize).toFixed(1)} / ${parseFloat(style.lineHeight).toFixed(1)}px`;
				}),
			);
		};
		afterNextRender(() => {
			measure();
			window.addEventListener("resize", measure);
		});
		inject(DestroyRef).onDestroy(() =>
			window.removeEventListener("resize", measure),
		);
	}
}
