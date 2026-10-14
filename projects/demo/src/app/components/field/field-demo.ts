import { Component, signal } from "@angular/core";
import { defaultValidationMessages, type ValidationOptions } from "interop";
import { InteropCodeBlock } from "interop/code-block";
import { InteropCustomValidity, InteropForm } from "interop/field";
import { examples } from "./field-examples";

@Component({
	selector: "demo-field",
	imports: [InteropCodeBlock, InteropCustomValidity, InteropForm],
	templateUrl: "./field-demo.html",
	styleUrl: "./field-demo.css",
})
export class FieldDemo {
	protected readonly examples = examples;
	protected readonly sent = signal(false);
	protected readonly username = signal("");
	/** A message per field where the default cannot say it well, such as a question. */
	protected readonly messages: ValidationOptions["messages"] = {
		valueMissing: (control, label) =>
			control.name === "contact" ? "Select how you want us to contact you" : defaultValidationMessages.valueMissing(control, label),
	};
	protected readonly sizes = [
		{ value: "sm", label: "Small" },
		{ value: null, label: "Default" },
		{ value: "lg", label: "Large" },
	];

	protected send(event: SubmitEvent): void {
		// bindValidation() stops an invalid form before this runs.
		event.preventDefault();
		this.sent.set(true);
	}
}
