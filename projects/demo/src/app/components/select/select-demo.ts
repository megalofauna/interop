import { Component, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { InteropCodeBlock } from "interop/code-block";
import { DemoExample } from "../../example/example";
import { region } from "../../example/region";
import basic from "./examples/basic.html";
import disabled from "./examples/disabled.html";
import groups from "./examples/groups.html";
import inPage from "./examples/in-page.html";
import multiple from "./examples/multiple.html";
import richCss from "./examples/rich.css";
import rich from "./examples/rich.html";
import sizesCss from "./examples/sizes.css";
import sizes from "./examples/sizes.html";
import template from "./select-demo.html";

@Component({
	selector: "demo-select",
	host: { "itx-flow": "" },
	imports: [DemoExample, InteropCodeBlock, RouterLink],
	templateUrl: "./select-demo.html",
	styleUrl: "./select-demo.css",
})
export class SelectDemo {
	protected readonly examples = {
		basic,
		groups,
		rich,
		richCss,
		sizes,
		sizesCss,
		disabled,
		inPage,
		multiple,
	};
	protected readonly boundCode = region(template, "bound");
	protected readonly theme = signal("system");
}
