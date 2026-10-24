import { Component, signal } from "@angular/core";
import { InteropCodeBlock } from "interop/code-block";
import { InteropSlider } from "interop/slider";
import { examples } from "./slider-examples";

@Component({
	selector: "demo-slider",
	host: { "itx-flow": "" },
	imports: [InteropCodeBlock, InteropSlider],
	templateUrl: "./slider-demo.html",
	styleUrl: "./slider-demo.css",
})
export class SliderDemo {
	protected readonly examples = examples;
	protected readonly dollars = (value: number) => `$${value}`;
	protected readonly degrees = (value: number) => `${value} degrees`;
	protected readonly submitted = signal<string | null>(null);

	protected submit(event: SubmitEvent): void {
		event.preventDefault();
		const data = new FormData(event.target as HTMLFormElement);
		this.submitted.set(`Brightness ${data.get("brightness")}`);
	}
}
