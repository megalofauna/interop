import { Component, signal } from "@angular/core";
import {
	bindPasswordToggle,
	bindValidation,
	defaultValidationMessages,
	type ValidationOptions,
} from "interop";
import { InteropCodeBlock } from "interop/code-block";
import {
	InteropCharacterCount,
	InteropCustomValidity,
	InteropForm,
	InteropPasswordToggle,
} from "interop/field";
import { InteropScrollArea } from "interop/scroll-area";
import { DemoExample } from "../../example/example";
import { region } from "../../example/region";
import dateCss from "./examples/date.css";
import date from "./examples/date.html";
import basic from "./examples/basic.html";
import password from "./examples/password.html";
import readOnly from "./examples/read-only.html";
import sizes from "./examples/sizes.html";
import textarea from "./examples/textarea.html";
import units from "./examples/units.html";
import template from "./field-demo.html";
import { examples as ts } from "./field-examples";

@Component({
	selector: "demo-field",
	host: { "itx-flow": "" },
	imports: [
		DemoExample,
		InteropCharacterCount,
		InteropCodeBlock,
		InteropCustomValidity,
		InteropForm,
		InteropPasswordToggle,
		InteropScrollArea,
	],
	templateUrl: "./field-demo.html",
	styleUrl: "./field-demo.css",
})
export class FieldDemo {
	protected readonly examples = {
		...ts,
		basic,
		units,
		textarea,
		password,
		date,
		dateCss,
		sizes,
		readOnly,
	};
	protected readonly validationCode = region(template, "validation");
	protected readonly customCode = region(template, "custom");
	protected readonly countCode = region(template, "count");

	protected readonly bindPassword = (root: HTMLElement) =>
		bindPasswordToggle(root.querySelector<HTMLInputElement>("#password")!);
	protected readonly passwordTs = `import { bindPasswordToggle } from "interop";

// Shows the button, and runs its --toggle-password command. Returns a function that removes it.
bindPasswordToggle(document.querySelector("#password"));
`;
	protected readonly bindDate = (root: HTMLElement) =>
		bindValidation(root.querySelector<HTMLFormElement>("#birthday")!);
	protected readonly dateTs = `import { bindValidation } from "interop";

// Checks the form, shows one error for the three fields, and stops an invalid submit.
bindValidation(document.querySelector("#birthday"));
`;
	protected readonly sent = signal(false);
	protected readonly username = signal("");
	/** A message per field where the default cannot say it well, such as a question. */
	protected readonly messages: ValidationOptions["messages"] = {
		valueMissing: (control, label) =>
			control.name === "contact"
				? "Select how you want us to contact you"
				: defaultValidationMessages.valueMissing(control, label),
	};

	protected send(event: SubmitEvent): void {
		// bindValidation() stops an invalid form before this runs.
		event.preventDefault();
		this.sent.set(true);
	}
}
