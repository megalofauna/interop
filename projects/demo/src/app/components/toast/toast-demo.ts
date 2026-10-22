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
	protected readonly crates = signal([
		"Fuel cells",
		"Medical supplies",
		"Spare parts",
	]);
	protected readonly colors: { color: ToastColor; message: string }[] = [
		{ color: "success", message: "Docking approved" },
		{ color: "info", message: "Bay 4 opens at 14:00" },
		{ color: "warning", message: "Fuel below 20%" },
		{ color: "danger", message: "Hull breach in bay 2" },
	];

	protected send(): void {
		toast("Message sent", { description: "To the harbor master" });
	}

	protected show(color: ToastColor, message: string): void {
		toast(message, { color });
	}

	protected copy(): void {
		toast("Link copied", { timeout: 6000 });
	}

	protected jettison(crate: string): void {
		const index = this.crates().indexOf(crate);
		this.crates.update((crates) => crates.filter((c) => c !== crate));
		toast(`${crate} jettisoned`, {
			color: "success",
			action: { label: "Undo", run: () => this.restore(crate, index) },
		});
	}

	protected restore(crate: string, index: number): void {
		this.crates.update((crates) =>
			crates.includes(crate) ? crates : crates.toSpliced(index, 0, crate),
		);
	}

	protected save(): void {
		toast("Course saved");
	}
}
