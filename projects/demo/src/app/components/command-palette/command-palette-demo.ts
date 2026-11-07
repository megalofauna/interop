import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { InteropCodeBlock } from "interop/code-block";
import { InteropFilter } from "interop/filter";
import { examples } from "./command-palette-examples";

@Component({
	selector: "demo-command-palette",
	host: { "itx-flow": "" },
	imports: [InteropCodeBlock, InteropFilter, RouterLink],
	templateUrl: "./command-palette-demo.html",
})
export class CommandPaletteDemo {
	protected readonly examples = examples;
	protected readonly pages = [
		{ path: "/components/button", title: "Button" },
		{ path: "/components/dialog", title: "Dialog" },
		{ path: "/components/field", title: "Field" },
		{ path: "/components/select", title: "Select" },
		{ path: "/components/slider", title: "Slider" },
		{ path: "/components/toast", title: "Toast" },
		{ path: "/components/toolbar", title: "Toolbar" },
		{ path: "/components/tooltip", title: "Tooltip" },
	];
}
