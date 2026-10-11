import { Component, signal } from "@angular/core";
import { InteropIcon } from "interop/icon";
import { InteropInvoker } from "interop/invoker";
import { InteropTooltip } from "interop/tooltip";

@Component({
	selector: "demo-button",
	imports: [InteropIcon, InteropInvoker, InteropTooltip],
	templateUrl: "./button-demo.html",
	styleUrl: "./button-demo.css",
})
export class ButtonDemo {
	protected readonly bold = signal(false);
	protected readonly busy = signal(true);
	protected readonly saved = signal(0);

	protected readonly save = async () => {
		await new Promise((resolve) => setTimeout(resolve, 1500));
		this.saved.update((n) => n + 1);
	};
}
