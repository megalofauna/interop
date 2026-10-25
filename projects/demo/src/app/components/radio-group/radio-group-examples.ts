/** The markup each example on the radio group page shows, written to be copied. */
export const examples = {
	group: `<fieldset interop-radio-group>
	<legend>Shipping</legend>
	<label><input type="radio" name="shipping" value="standard" checked> Standard</label>
	<label><input type="radio" name="shipping" value="express"> Express</label>
	<label><input type="radio" name="shipping" value="pickup"> Pick up in store</label>
</fieldset>
`,
	required: `<form>
	<fieldset interop-radio-group>
		<legend>How should we contact you?</legend>
		<label><input type="radio" name="contact" value="email" required> Email</label>
		<label><input type="radio" name="contact" value="phone"> Phone</label>
		<label><input type="radio" name="contact" value="post"> Post</label>
	</fieldset>
	<button interop-button type="submit">Submit</button>
	<button interop-button type="reset">Reset</button>
</form>

<!-- In Angular, FormsModule adds novalidate to every form. Keep the browser's validation: -->
<form ngNativeValidate (submit)="submit($event)">…</form>
`,
	inline: `<fieldset interop-radio-group class="inline">
	<legend>Size</legend>
	<label><input type="radio" name="size" value="s"> Small</label>
	<label><input type="radio" name="size" value="m" checked> Medium</label>
	<label><input type="radio" name="size" value="l"> Large</label>
</fieldset>
`,
	inlineCss: `.inline {
	--itx-fieldset-flex-direction: row;
}
`,
	long: `<fieldset interop-radio-group>
	<legend>Billing</legend>
	<label>
		<input type="radio" name="billing" value="monthly" checked>
		Monthly, billed on the same day each month, starting today
	</label>
	<label>
		<input type="radio" name="billing" value="yearly">
		Yearly, with two months free, as described in the <a href="/terms">terms</a>
	</label>
</fieldset>
`,
	disabled: `<fieldset interop-radio-group>
	<legend>Delivery day</legend>
	<label><input type="radio" name="day" value="mon" checked> Monday</label>
	<label><input type="radio" name="day" value="sat" disabled> Saturday</label>
</fieldset>

<fieldset interop-radio-group disabled>
	<legend>Plan</legend>
	<label><input type="radio" name="plan" value="free" checked> Free</label>
	<label><input type="radio" name="plan" value="pro"> Pro</label>
</fieldset>
`,
	hint: `<fieldset interop-radio-group aria-describedby="where-hint">
	<legend>Where do you live?</legend>
	<p id="where-hint">This decides which tax rules apply.</p>
	<label><input type="radio" name="where" value="uk"> United Kingdom</label>
	<label><input type="radio" name="where" value="elsewhere"> Somewhere else</label>
</fieldset>
`,
	template: `<fieldset interop-radio-group class="described">
	<legend>Backups</legend>
	<label>
		<input type="radio" name="backup" value="daily" checked aria-labelledby="backup-daily-name" aria-describedby="backup-daily">
		<span id="backup-daily-name">Daily</span> <span class="description" id="backup-daily">Kept for 30 days.</span>
	</label>
	<label>
		<input type="radio" name="backup" value="hourly" aria-labelledby="backup-hourly-name" aria-describedby="backup-hourly">
		<span id="backup-hourly-name">Hourly</span> <span class="description" id="backup-hourly">Kept for 7 days. Uses more storage.</span>
	</label>
</fieldset>
`,
	templateCss: `.described .description {
	display: block;
	color: light-dark(var(--itx-neutral-600), var(--itx-neutral-400));
	font-size: var(--itx-font-size-caption);
	line-height: var(--itx-line-height-caption);
}
`,
	signal: `<fieldset interop-radio-group (change)="shipping.set($any($event.target).value)">
	<legend>Shipping</legend>
	<label><input type="radio" name="bound" value="standard" [checked]="shipping() === 'standard'"> Standard</label>
	<label><input type="radio" name="bound" value="express" [checked]="shipping() === 'express'"> Express</label>
</fieldset>
<p>Shipping is {{ shipping() }}.</p>
`,
	signalTs: `readonly shipping = signal("standard");
`,
	ngModel: `<!-- Set name yourself: Angular's radio accessor does not write it to the page. -->
<fieldset interop-radio-group>
	<legend>Theme</legend>
	<label><input type="radio" name="theme" value="system" [(ngModel)]="theme"> System</label>
	<label><input type="radio" name="theme" value="light" [(ngModel)]="theme"> Light</label>
	<label><input type="radio" name="theme" value="dark" [(ngModel)]="theme"> Dark</label>
</fieldset>
`,
	rtl: `<fieldset interop-radio-group dir="rtl" lang="ar">
	<legend>الحجم</legend>
	<label><input type="radio" name="rtl" value="s" checked> صغير</label>
	<label><input type="radio" name="rtl" value="l"> كبير</label>
</fieldset>
`,
	sizes: `<fieldset interop-radio-group>…</fieldset>
<fieldset interop-radio-group itx-size="lg">…</fieldset>
`,
	tokens: `<fieldset interop-radio-group class="large-dot">…</fieldset>
`,
	tokensCss: `.large-dot {
	--itx-radio-group-dot-size: var(--itx-space-3);
}
`,
};
