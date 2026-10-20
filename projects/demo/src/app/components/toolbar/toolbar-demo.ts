import { NgTemplateOutlet } from "@angular/common";
import { Component } from "@angular/core";
import { registerIcons } from "interop";
import { InteropCodeBlock } from "interop/code-block";
import { InteropIcon } from "interop/icon";
import {
	TablerBold,
	TablerCode,
	TablerHeading,
	TablerItalic,
	TablerLink,
	TablerList,
	TablerListNumbers,
	TablerQuote,
} from "interop/tabler";
import { InteropToolbar } from "interop/toolbar";
import { InteropTooltip } from "interop/tooltip";
import { applyMarkdown, groups } from "./toolbar-actions";
import { examples } from "./toolbar-examples";

registerIcons(
	TablerHeading,
	TablerBold,
	TablerItalic,
	TablerQuote,
	TablerCode,
	TablerLink,
	TablerList,
	TablerListNumbers,
);

@Component({
	selector: "demo-toolbar",
	host: { "itx-flow": "" },
	imports: [
		NgTemplateOutlet,
		InteropCodeBlock,
		InteropIcon,
		InteropToolbar,
		InteropTooltip,
	],
	templateUrl: "./toolbar-demo.html",
	styleUrl: "./toolbar-demo.css",
})
export class ToolbarDemo {
	protected readonly groups = groups;
	protected readonly apply = applyMarkdown;
	protected readonly examples = examples;
}
