/** The markup each example on the slider page shows, written to be copied. */
export const examples = {
	basic: `<div interop-field>
	<label for="volume">Volume</label>
	<input type="range" interop-slider id="volume" min="0" max="100" value="40">
</div>
`,
	format: `<div interop-field>
	<label for="budget">Budget</label>
	<div class="scale">
		<input type="range" interop-slider id="budget" min="0" max="500" step="10" value="200"
			[format]="dollars" [readout]="shown">
		<span #shown></span>
	</div>
</div>

dollars = (value: number) => \`$\${value}\`;
`,
	vertical: `<div interop-field>
	<label for="temperature">Temperature</label>
	<div class="scale">
		<input type="range" interop-slider itx-orientation="vertical" id="temperature"
			min="10" max="30" value="21" [format]="degrees" [readout]="degreesShown">
		<span #degreesShown></span>
	</div>
</div>
`,
	disabled: `<div interop-field>
	<label for="balance">Balance</label>
	<input type="range" interop-slider id="balance" value="50" disabled>
</div>
`,
	pair: `<fieldset class="pair">
	<legend>Price, in dollars</legend>
	<div interop-field>
		<label for="price-min">Minimum</label>
		<input interop-input id="price-min" name="price-min" inputmode="numeric" size="6">
	</div>
	<div interop-field>
		<label for="price-max">Maximum</label>
		<input interop-input id="price-max" name="price-max" inputmode="numeric" size="6">
	</div>
</fieldset>
`,
};
