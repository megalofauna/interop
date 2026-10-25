import { Component, ElementRef, signal, viewChild } from "@angular/core";
import { RouterLink } from "@angular/router";
import { InteropCodeBlock } from "interop/code-block";
import { InteropIcon } from "interop/icon";
import { DemoExample } from "../../example/example";
import { region } from "../../example/region";
import template from "./dialog-demo.html";
import { examples as ts } from "./dialog-examples";
import alert from "./examples/alert.html";
import confirm from "./examples/confirm.html";
import lightDismiss from "./examples/light-dismiss.html";
import long from "./examples/long.html";

@Component({
	selector: "demo-dialog",
	host: { "itx-flow": "" },
	imports: [DemoExample, InteropCodeBlock, InteropIcon, RouterLink],
	templateUrl: "./dialog-demo.html",
	styleUrl: "./dialog-demo.css",
})
export class DialogDemo {
	protected readonly examples = { ...ts, confirm, lightDismiss, alert, long };
	protected readonly renameCode = region(template, "rename");
	protected readonly fromCodeCode = region(template, "from-code");

	/** Shows which button closed the confirm dialog: its value is the dialog's returnValue. */
	protected readonly bindConfirm = (root: HTMLElement) => {
		const dialog = root.querySelector<HTMLDialogElement>("#delete")!;
		const closed = () =>
			this.result.set(dialog.returnValue || "closed without a choice");
		dialog.addEventListener("close", closed);
		return () => dialog.removeEventListener("close", closed);
	};
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
