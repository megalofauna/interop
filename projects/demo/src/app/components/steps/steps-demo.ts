import { Component, signal } from "@angular/core";
import { type StepsChangeDetail } from "interop";
import { InteropStepsForm } from "interop/steps";

@Component({
	selector: "demo-steps",
	imports: [InteropStepsForm],
	templateUrl: "./steps-demo.html",
	styleUrl: "./steps-demo.css",
})
export class StepsDemo {
	protected readonly step = signal("details");
	protected readonly sent = signal<string | null>(null);

	protected changed(event: Event): void {
		this.step.set((event as CustomEvent<StepsChangeDetail>).detail.step.id);
	}

	protected submit(event: SubmitEvent): void {
		event.preventDefault();
		const data = new FormData(event.target as HTMLFormElement);
		this.sent.set([...data.entries()].map(([name, value]) => `${name}=${value}`).join(", "));
	}
}
