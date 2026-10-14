import { Component, ElementRef, signal, viewChild } from "@angular/core";
import { InteropCodeBlock } from "interop/code-block";
import { InteropIcon } from "interop/icon";
import { examples } from "./dialog-examples";

@Component({
	selector: "demo-dialog",
	imports: [InteropCodeBlock, InteropIcon],
	templateUrl: "./dialog-demo.html",
	styleUrl: "./dialog-demo.css",
})
export class DialogDemo {
	protected readonly examples = examples;
	protected readonly result = signal("");
	protected readonly dirty = signal(false);
	protected readonly warning = signal(false);
	protected readonly saved =
		viewChild.required<ElementRef<HTMLDialogElement>>("saved");

	/** Escape and the close button fire cancel. Keep the dialog open while there is unsaved input. */
	protected guard(event: Event): void {
		if (this.dirty()) {
			event.preventDefault();
			this.warning.set(true);
		}
	}

	protected reset(): void {
		this.dirty.set(false);
		this.warning.set(false);
	}

	protected async export(): Promise<void> {
		await new Promise((resolve) => setTimeout(resolve, 800));
		this.saved().nativeElement.showModal();
	}
}
