import { Component, ElementRef, afterNextRender, signal, viewChild } from "@angular/core";
import { bindPendingAction } from "interop/button";

@Component({
	selector: "demo-button",
	templateUrl: "./button-demo.html",
	styleUrl: "./button-demo.css",
})
export class ButtonDemo {
	protected readonly bold = signal(false);
	protected readonly saved = signal(0);
	private readonly save = viewChild.required<ElementRef<HTMLButtonElement>>("save");

	constructor() {
		afterNextRender(() => {
			bindPendingAction(this.save().nativeElement, async () => {
				await new Promise((resolve) => setTimeout(resolve, 1500));
				this.saved.update((n) => n + 1);
			});
		});
	}
}
