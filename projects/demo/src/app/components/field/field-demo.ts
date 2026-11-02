import { CUSTOM_ELEMENTS_SCHEMA, Component, signal } from "@angular/core";
import { defaultValidationMessages, type ValidationOptions } from "interop";
import { InteropCodeBlock } from "interop/code-block";
import "interop/field";
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
	imports: [DemoExample, InteropCodeBlock, InteropScrollArea],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
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

	protected readonly passwordTs = `// Once, anywhere: defines <interop-password>.
import "interop/field";
`;
	protected readonly dateTs = `// Once, anywhere: defines <interop-validation>.
import "interop/field";
`;
	protected readonly sent = signal(false);
	/** A message per field where the default cannot say it well, such as a question. */
	protected readonly messages: ValidationOptions["messages"] = {
		valueMissing: (control, label) =>
			control.name === "contact"
				? "Select how you want us to contact you"
				: defaultValidationMessages.valueMissing(control, label),
	};

	/** A rule the browser cannot check. Set in the input listener, the error follows it. */
	protected checkUsername(event: Event): void {
		const control = event.target as HTMLInputElement;
		control.setCustomValidity(
			control.value === "admin" ? "That username is taken. Choose another" : "",
		);
	}

	protected send(event: SubmitEvent): void {
		// <interop-validation> stops an invalid form before this runs.
		event.preventDefault();
		this.sent.set(true);
	}
}
