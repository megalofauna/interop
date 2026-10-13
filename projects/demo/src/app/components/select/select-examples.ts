/** The markup each example on the select page shows, written to be copied. */
export const examples = {
	basic: `<label for="fruit">Fruit</label>
<select id="fruit" interop-select name="fruit">
	<option value="">Choose a fruit</option>
	<option>Apple</option>
	<option>Banana</option>
	<option>Cherry</option>
</select>
`,
	groups: `<select id="city" interop-select>
	<optgroup label="Europe">
		<option>Lisbon</option>
		<option>Oslo</option>
	</optgroup>
	<hr />
	<optgroup label="Asia">
		<option>Seoul</option>
		<option disabled>Kyoto (sold out)</option>
	</optgroup>
</select>
`,
	rich: `<select id="shipping" interop-select>
	<button><selectedcontent></selectedcontent></button>
	<option value="standard">
		<span>Standard</span>
		<span class="hint">3 to 5 working days, free</span>
	</option>
	<option value="express">
		<span>Express</span>
		<span class="hint">Next working day, $12</span>
	</option>
</select>
`,
	richCss: `/* The hint stacks under the name in the list, and the closed select shows only the name. */
select[interop-select] .hint {
	font-size: var(--itx-font-size-p-sm);
}
selectedcontent .hint {
	display: none;
}
`,
	sizes: `<select interop-select itx-size="sm">…</select>
<select interop-select>…</select>
<select interop-select itx-size="lg">…</select>
`,
	inPage: `<select id="team" interop-select size="5">
	<option>Design</option>
	<option>Engineering</option>
	…
</select>
`,
	bound: `<select id="theme" interop-select [value]="theme()" (change)="theme.set($any($event.target).value)">
	<option value="system">Match the system</option>
	<option value="light">Light</option>
	<option value="dark">Dark</option>
</select>
<p>Theme: {{ theme() }}</p>
`,
};
