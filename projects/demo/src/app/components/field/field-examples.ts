/** The TS beside the field page's Angular examples. Their markup is read from the template. */
export const examples = {
	formTs: `/** A message per field where the default cannot say it well, such as a question. */
readonly messages: ValidationOptions["messages"] = {
	valueMissing: (control, label) =>
		control.name === "contact" ? "Select how you want us to contact you" : defaultValidationMessages.valueMissing(control, label),
};

send(event: SubmitEvent): void {
	// bindValidation() stops an invalid form before this runs.
	event.preventDefault();
	this.sent.set(true);
}
`,
};
