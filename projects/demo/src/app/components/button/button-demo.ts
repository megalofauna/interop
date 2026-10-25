import { Component, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { InteropCodeBlock } from "interop/code-block";
import { InteropInvoker } from "interop/invoker";
import { DemoExample } from "../../example/example";
import { region } from "../../example/region";
import template from "./button-demo.html";
import disabled from "./examples/disabled.html";
import iconButtons from "./examples/icon-buttons.html";
import iconSize from "./examples/icon-size.html";
import invokers from "./examples/invokers.html";
import radius from "./examples/radius.html";
import sizes from "./examples/sizes.html";
import withIcon from "./examples/with-icon.html";

@Component({
	selector: "demo-button",
	host: { "itx-flow": "" },
	imports: [DemoExample, InteropCodeBlock, InteropInvoker, RouterLink],
	templateUrl: "./button-demo.html",
	styleUrl: "./button-demo.css",
})
export class ButtonDemo {
	protected readonly examples = {
		sizes,
		withIcon,
		iconButtons,
		iconSize,
		radius,
		disabled,
		invokers,
	};
	protected readonly pressed = region(template, "pressed");
	protected readonly busyCode = region(template, "busy");
	protected readonly pending = region(template, "pending");

	protected readonly bold = signal(false);
	protected readonly busy = signal(true);
	protected readonly saved = signal(0);

	protected readonly save = async () => {
		await new Promise((resolve) => setTimeout(resolve, 1500));
		this.saved.update((n) => n + 1);
	};
}
