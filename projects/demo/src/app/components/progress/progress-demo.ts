import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { announce } from "interop";
import { DemoExample } from "../../example/example";
import basic from "./examples/basic.html";
import count from "./examples/count.html";
import done from "./examples/done.html";
import sizes from "./examples/sizes.html";
import unknown from "./examples/unknown.html";

@Component({
	selector: "demo-progress",
	host: { "itx-flow": "" },
	imports: [DemoExample, RouterLink],
	templateUrl: "./progress-demo.html",
	styleUrl: "./progress-demo.css",
})
export class ProgressDemo {
	protected readonly examples = { basic, sizes, count, unknown, done };

	/** Fills the bar over two seconds, then says it is done. */
	protected readonly bindDone = (root: HTMLElement) => {
		const progress = root.querySelector<HTMLProgressElement>("#export")!;
		const state = root.querySelector<HTMLElement>("#export-state")!;
		const start = root.querySelector<HTMLButtonElement>("#export-start")!;
		let timer = 0;
		const run = () => {
			clearInterval(timer);
			progress.value = 0;
			state.textContent = "Exporting…";
			timer = window.setInterval(() => {
				progress.value = Math.min(progress.max, progress.value + 10);
				if (progress.value < progress.max) return;
				clearInterval(timer);
				state.textContent = "Archive exported.";
				announce("Archive exported", { from: progress });
			}, 200);
		};
		start.addEventListener("click", run);
		return () => {
			clearInterval(timer);
			start.removeEventListener("click", run);
		};
	};

	protected readonly doneTs = `import { announce } from "interop";

// The bar is silent while it moves. Say the milestone once, from the bar.
progress.value = progress.max;
state.textContent = "Archive exported.";
announce("Archive exported", { from: progress });
`;
}
