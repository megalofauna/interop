import { Component } from "@angular/core";
import { InteropIcon } from "interop/icon";
import { InteropInvoker } from "interop/invoker";
import { InteropTooltip } from "interop/tooltip";

@Component({
	selector: "demo-tooltip",
	host: { "itx-flow": "" },
	imports: [InteropIcon, InteropInvoker, InteropTooltip],
	templateUrl: "./tooltip-demo.html",
	styleUrl: "./tooltip-demo.css",
})
export class TooltipDemo {}
