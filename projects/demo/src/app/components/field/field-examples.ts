/** The markup each example on the field page shows, written to be copied. */
export const examples = {
	basic: `<div interop-field>
	<label for="email">Email address</label>
	<p interop-hint id="email-hint">We send the receipt here</p>
	<p interop-error hidden></p>
	<input interop-input id="email" type="email" name="email" autocomplete="email" spellcheck="false"
		aria-describedby="email-hint">
</div>
`,
	form: `<div #summary interop-error-summary hidden>
	<h2>There is a problem</h2>
	<ul></ul>
</div>

<form interop-form [summary]="summary" [messages]="messages" (submit)="send($event)">
	<div interop-field>
		<label for="name">Full name</label>
		<p interop-error hidden></p>
		<input interop-input id="name" name="name" autocomplete="name" required>
	</div>
	<fieldset interop-radio-group>
		<legend>How should we contact you?</legend>
		<p interop-error hidden></p>
		<label><input type="radio" name="contact" value="email" required> Email</label>
		<label><input type="radio" name="contact" value="phone"> Phone</label>
	</fieldset>
	…
	<button interop-button type="submit">Send</button>
</form>
`,
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
	units: `<div interop-field>
	<label for="cost">Cost, in pounds</label>
	<div>
		<span interop-unit aria-hidden="true">£</span>
		<input interop-input id="cost" name="cost" inputmode="decimal" size="10">
	</div>
</div>
`,
	textarea: `<div interop-field>
	<label for="notes">Delivery notes (optional)</label>
	<textarea interop-input id="notes" name="notes"></textarea>
</div>
`,
	date: `<fieldset class="date" aria-describedby="dob-hint">
	<legend>Date of birth</legend>
	<p interop-hint id="dob-hint">For example, 27 3 2007</p>
	<p interop-error hidden></p>
	<div>
		<div interop-field>
			<label for="dob-day">Day</label>
			<input interop-input id="dob-day" name="dob-day" inputmode="numeric" autocomplete="bday-day"
				pattern="[0-9]{1,2}" size="2" required>
		</div>
		<div interop-field>
			<label for="dob-month">Month</label>
			<input interop-input id="dob-month" … autocomplete="bday-month" size="2">
		</div>
		<div interop-field>
			<label for="dob-year">Year</label>
			<input interop-input id="dob-year" … autocomplete="bday-year" pattern="[0-9]{4}" size="4">
		</div>
	</div>
</fieldset>
`,
	custom: `<input interop-input id="username" name="username" required
	(input)="username.set($any($event.target).value)"
	[interopCustomValidity]="username() === 'admin' ? 'That username is taken. Choose another' : ''">
`,
	password: `<div interop-field>
	<label for="password">Password</label>
	<div>
		<input interop-input interop-password-toggle id="password" type="password" name="password"
			autocomplete="current-password" autocapitalize="off" spellcheck="false">
		<button interop-button type="button" commandfor="password" command="--toggle-password"
			aria-pressed="false" hidden>Show password</button>
	</div>
</div>
`,
	count: `<div interop-field>
	<label for="summary-text">Summary</label>
	<p interop-hint id="summary-hint">You can enter up to 100 characters</p>
	<p interop-error hidden></p>
	<textarea interop-input interop-character-count id="summary-text" name="summary"
		aria-describedby="summary-hint" [characterLimit]="100" [count]="count"></textarea>
	<p #count interop-count></p>
</div>
`,
	sizes: `<div interop-field itx-size="sm">…</div>
<div interop-field>…</div>
<div interop-field itx-size="lg">…</div>
`,
};
