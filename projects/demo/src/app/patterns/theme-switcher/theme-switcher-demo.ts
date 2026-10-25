import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { InteropBadge } from "interop/badge";
import { InteropCodeBlock } from "interop/code-block";
import { InteropColorScheme } from "interop/color-scheme";
import { examples } from "./theme-switcher-examples";

@Component({
	selector: "demo-theme-switcher",
	host: { "itx-flow": "" },
	imports: [InteropBadge, InteropCodeBlock, InteropColorScheme, RouterLink],
	templateUrl: "./theme-switcher-demo.html",
	styleUrl: "../patterns.css",
})
export class ThemeSwitcherDemo {
	protected readonly examples = examples;
}
