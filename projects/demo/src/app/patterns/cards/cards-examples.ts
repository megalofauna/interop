/** The markup the cards page shows, written to be copied. */
export const examples = {
	cards: `<fieldset interop-radio-group="cards">
	<legend>Plan</legend>
	@for (plan of plans; track plan.id) {
		<label>
			<input type="radio" name="plan" [value]="plan.id"
				[attr.aria-labelledby]="'plan-' + plan.id"
				[attr.aria-describedby]="'plan-' + plan.id + '-details'">
			<strong [id]="'plan-' + plan.id">{{ plan.name }}</strong>
			<span [id]="'plan-' + plan.id + '-details'">
				<span class="price">{{ plan.price }}</span>
				<span class="summary">{{ plan.summary }}</span>
			</span>
		</label>
	}
</fieldset>
`,
	cardsCss: `/* The cards template stacks a card's direct children. Lay out what is inside them yourself. */
.price,
.summary {
	display: block;
}
`,
};
