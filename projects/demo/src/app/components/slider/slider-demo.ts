import { Component, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { bindSlider } from "interop";
import { each } from "../../example/bind-each";
import { DemoExample } from "../../example/example";
import basic from "./examples/basic.html";
import disabled from "./examples/disabled.html";
import form from "./examples/form.html";
import pairCss from "./examples/pair.css";
import pair from "./examples/pair.html";
import scaleCss from "./examples/scale.css";
import sizes from "./examples/sizes.html";
import unit from "./examples/unit.html";
import vertical from "./examples/vertical.html";

@Component({
	selector: "demo-slider",
	host: { "itx-flow": "" },
	imports: [DemoExample, RouterLink],
	templateUrl: "./slider-demo.html",
	styleUrl: "./slider-demo.css",
})
export class SliderDemo {
	protected readonly examples = {
		basic,
		sizes,
		unit,
		scaleCss,
		vertical,
		disabled,
		form,
		pair,
		pairCss,
	};
	protected readonly submitted = signal<string | null>(null);

	/** Draws the fill of every slider in an example. */
	protected readonly bind = each<HTMLInputElement>(
		"input[interop-slider]",
		(input) => bindSlider(input),
	);
	protected readonly bindBudget = (root: HTMLElement) =>
		bindSlider(root.querySelector<HTMLInputElement>("#budget")!, {
			format: (value) => `$${value}`,
			readout: root.querySelector<HTMLElement>("#budget-shown"),
		});
	protected readonly bindTemperature = (root: HTMLElement) =>
		bindSlider(root.querySelector<HTMLInputElement>("#temperature")!, {
			format: (value) => `${value} degrees`,
			readout: root.querySelector<HTMLElement>("#temperature-shown"),
		});
	protected readonly bindForm = (root: HTMLElement) => {
		const unbind = this.bind(root);
		const form = root.querySelector<HTMLFormElement>("#display")!;
		const submitted = (event: SubmitEvent) => {
			event.preventDefault();
			this.submitted.set(`Brightness ${new FormData(form).get("brightness")}`);
		};
		form.addEventListener("submit", submitted);
		return () => {
			unbind();
			form.removeEventListener("submit", submitted);
		};
	};

	protected readonly basicTs = `import { bindSlider } from "interop";

// Draws the fill and keeps it current. In Angular, InteropSlider does this. Returns a function that removes it.
bindSlider(document.querySelector("#volume"));
`;
	protected readonly unitTs = `bindSlider(document.querySelector("#budget"), {
	format: (value) => \`$\${value}\`,
	readout: document.querySelector("#budget-shown"),
});
`;
}
