import { Component, signal } from "@angular/core";
import { toast, type ToastColor } from "interop";
import { InteropCodeBlock } from "interop/code-block";
import { InteropIcon } from "interop/icon";
import { InteropToasts } from "interop/toast";
import { examples } from "./toast-examples";

@Component({
	selector: "demo-toast",
	host: { "itx-flow": "" },
	imports: [InteropCodeBlock, InteropIcon, InteropToasts],
	templateUrl: "./toast-demo.html",
	styleUrl: "./toast-demo.css",
})
export class ToastDemo {
	protected readonly examples = examples;
	protected readonly files = signal(["report.pdf", "invoice.pdf", "notes.txt"]);
	protected readonly colors: { color: ToastColor; message: string }[] = [
		{ color: "success", message: "Payment received" },
		{ color: "info", message: "Maintenance starts at 14:00" },
		{ color: "warning", message: "Storage is 80% full" },
		{ color: "danger", message: "Payment failed" },
	];

	protected send(): void {
		toast("Message sent", { description: "To the support team" });
	}

	protected show(color: ToastColor, message: string): void {
		toast(message, { color });
	}

	protected copy(): void {
		toast("Link copied", { timeout: 6000 });
	}

	protected remove(file: string): void {
		const index = this.files().indexOf(file);
		this.files.update((files) => files.filter((c) => c !== file));
		toast(`${file} deleted`, {
			color: "success",
			action: { label: "Undo", run: () => this.restore(file, index) },
		});
	}

	protected restore(file: string, index: number): void {
		this.files.update((files) =>
			files.includes(file) ? files : files.toSpliced(index, 0, file),
		);
	}

	protected save(): void {
		toast("Course saved");
	}
}
