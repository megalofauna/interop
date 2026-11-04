import { Component } from "@angular/core";
import { bindScrollArea } from "interop";
import { each } from "../../example/bind-each";
import { DemoExample } from "../../example/example";
import controls from "./examples/controls.html";
import data from "./examples/data.html";
import densityCss from "./examples/density.css";
import density from "./examples/density.html";
import empty from "./examples/empty.html";
import reference from "./examples/reference.html";
import sizes from "./examples/sizes.html";
import stackedCss from "./examples/stacked.css";
import stacked from "./examples/stacked.html";

@Component({
	selector: "demo-table",
	host: { "itx-flow": "" },
	imports: [DemoExample],
	templateUrl: "./table-demo.html",
})
export class TableDemo {
	protected readonly examples = {
		reference,
		data,
		empty,
		sizes,
		density,
		densityCss,
		controls,
		stacked,
		stackedCss,
	};
	protected readonly bind = each("[interop-scroll-area]", (area) =>
		bindScrollArea(area),
	);
	protected readonly bindDensity = (root: HTMLElement) => {
		const unbindAreas = this.bind(root);
		const group = root.querySelector<HTMLFieldSetElement>("#density")!;
		const table = root.querySelector<HTMLTableElement>("#density-table")!;
		const setDensity = (event: Event) =>
			table.setAttribute(
				"itx-density",
				(event.target as HTMLInputElement).value,
			);
		group.addEventListener("change", setDensity);
		return () => {
			unbindAreas();
			group.removeEventListener("change", setDensity);
		};
	};

	protected readonly densityTs = `const table = document.querySelector("#density-table");

document.querySelector("#density").addEventListener("change", (event) => {
	table.setAttribute("itx-density", event.target.value);
});
`;
}
