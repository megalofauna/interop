import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { InteropCodeBlock } from "interop/code-block";
import { InteropColorScheme } from "interop/color-scheme";
import { examples } from "./theme-switcher-examples";

@Component({
	selector: "demo-theme-switcher",
	host: { "itx-flow": "" },
	imports: [InteropCodeBlock, InteropColorScheme, RouterLink],
	templateUrl: "./theme-switcher-demo.html",
})
export class ThemeSwitcherDemo {
	protected readonly examples = examples;
}
