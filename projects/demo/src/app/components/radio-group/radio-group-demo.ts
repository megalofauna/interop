import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { InteropBadge } from "interop/badge";
import { InteropCodeBlock } from "interop/code-block";
import { examples } from "./radio-group-examples";

@Component({
	selector: "demo-radio-group",
	imports: [FormsModule, InteropBadge, InteropCodeBlock],
	templateUrl: "./radio-group-demo.html",
	styleUrl: "./radio-group-demo.css",
})
export class RadioGroupDemo {
	protected readonly shipping = signal("standard");
	protected readonly theme = signal("system");
	protected readonly examples = examples;
	protected readonly submitted = signal<string | null>(null);
	protected readonly plans = [
		{ id: "free", name: "Free", price: "$0", summary: "Three projects, community support.", popular: false },
		{ id: "pro", name: "Pro", price: "$29 a month", summary: "Unlimited projects, priority support.", popular: true },
		{ id: "team", name: "Team", price: "$99 a month", summary: "Everything in Pro, with roles and audit logs.", popular: false },
	];

	protected submit(event: SubmitEvent): void {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		this.submitted.set(String(new FormData(form).get("contact")));
	}
}
