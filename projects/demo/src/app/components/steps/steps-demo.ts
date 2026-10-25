import { Component, signal } from "@angular/core";
import { bindSteps, type StepsChangeDetail } from "interop";
import { DemoExample } from "../../example/example";
import ends from "./examples/ends.html";
import form from "./examples/form.html";
import indicator from "./examples/indicator.html";
import narrow from "./examples/narrow.html";
import rtl from "./examples/rtl.html";

@Component({
	selector: "demo-steps",
	host: { "itx-flow": "" },
	imports: [DemoExample],
	templateUrl: "./steps-demo.html",
	styleUrl: "./steps-demo.css",
})
export class StepsDemo {
	protected readonly examples = { indicator, ends, narrow, rtl, form };
	protected readonly step = signal("details");
	protected readonly sent = signal<string | null>(null);

	protected readonly bindForm = (root: HTMLElement) => {
		const apply = root.querySelector<HTMLFormElement>("#apply")!;
		const unbind = bindSteps(apply, { history: true });
		const changed = (event: Event) =>
			this.step.set((event as CustomEvent<StepsChangeDetail>).detail.step.id);
		const submitted = (event: SubmitEvent) => {
			event.preventDefault();
			const data = new FormData(apply);
			this.sent.set(
				[...data.entries()]
					.map(([name, value]) => `${name}=${value}`)
					.join(", "),
			);
		};
		apply.addEventListener("interop-steps-change", changed);
		apply.addEventListener("submit", submitted);
		return () => {
			unbind();
			apply.removeEventListener("interop-steps-change", changed);
			apply.removeEventListener("submit", submitted);
		};
	};

	protected readonly formTs = `import { bindSteps } from "interop";

const form = document.querySelector("#apply");
// history: the browser's Back and Forward move between reached steps. Returns a function that removes it.
bindSteps(form, { history: true });
// Fires on the form when the step changes.
form.addEventListener("interop-steps-change", (event) => console.log(event.detail.step.id));
`;
}
