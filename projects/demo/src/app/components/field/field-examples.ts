/** The TS beside the field page's Angular examples. Their markup is read from the template. */
export const examples = {
	formTs: `/** A message per field where the default cannot say it well, such as a question. */
readonly messages: ValidationOptions["messages"] = {
	valueMissing: (control, label) =>
		control.name === "contact" ? "Select how you want us to contact you" : defaultValidationMessages.valueMissing(control, label),
};

send(event: SubmitEvent): void {
	// <interop-validation> stops an invalid form before this runs.
	event.preventDefault();
	this.sent.set(true);
}
`,
	customTs: `checkUsername(event: Event): void {
	const control = event.target as HTMLInputElement;
	// In the input listener, the error follows at once.
	control.setCustomValidity(control.value === "admin" ? "That username is taken. Choose another" : "");
}

// A result that comes later, such as a server's answer: set it, then tell the field.
control.setCustomValidity(message);
control.dispatchEvent(new Event("interop-validity-change", { bubbles: true }));
`,
};
