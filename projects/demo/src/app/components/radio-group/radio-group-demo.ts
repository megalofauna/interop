import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";

@Component({
	selector: "demo-radio-group",
	imports: [FormsModule],
	templateUrl: "./radio-group-demo.html",
	styleUrl: "./radio-group-demo.css",
})
export class RadioGroupDemo {
	protected readonly shipping = signal("standard");
	protected readonly theme = signal("system");
	protected readonly submitted = signal<string | null>(null);

	protected submit(event: SubmitEvent): void {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		this.submitted.set(String(new FormData(form).get("contact")));
	}
}
