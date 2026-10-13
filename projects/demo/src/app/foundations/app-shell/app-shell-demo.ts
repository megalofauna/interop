import { Component } from "@angular/core";
import { InteropCodeBlock } from "interop/code-block";
import { examples } from "./app-shell-examples";

@Component({
	selector: "demo-app-shell",
	imports: [InteropCodeBlock],
	templateUrl: "./app-shell-demo.html",
	styleUrl: "./app-shell-demo.css",
})
export class AppShellDemo {
	protected readonly examples = examples;
	protected readonly pages = ["Overview", "Reports", "Settings"];
}
