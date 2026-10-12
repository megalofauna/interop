/** The markup each example on the tags page shows, written to be copied. */
export const examples = {
	removable: `<ul interop-tags role="list" aria-label="Applied filters" [fallback]="heading" [status]="announcer">
	@for (filter of filters(); track filter) {
		<li>
			{{ filter }}
			<button type="button" (click)="removeFilter(filter)">
				<span itx-visually-hidden>Remove {{ filter }}</span>
				<svg interop-icon name="tabler-x"></svg>
			</button>
		</li>
	}
</ul>
<p #announcer role="status" itx-visually-hidden></p>
`,
	input: `<form (submit)="submit($event)">
	<label for="tag-entry">Skills</label>
	<ul #skillList interop-tags role="list" aria-label="Skills" [fallback]="entry">
		@for (skill of skills(); track skill) {
			<li>
				{{ skill }}
				<button type="button" (click)="removeSkill(skill)">
					<span itx-visually-hidden>Remove {{ skill }}</span>
					<svg interop-icon name="tabler-x"></svg>
				</button>
				<input type="hidden" name="skills" [value]="skill">
			</li>
		}
	</ul>
	<input #entry id="tag-entry" type="text" list="skill-options" aria-describedby="tag-hint"
		interop-tag-input [tags]="skillList" tagsRequired="Add at least one skill."
		[status]="announcer" [rejected]="alreadyAdded"
		(interop-tags-add)="addSkill($event)">
	<datalist id="skill-options">…</datalist>
	<p id="tag-hint">Press Enter to add a skill. Backspace in the empty field moves to the last one.</p>
	<p #announcer role="status" itx-visually-hidden></p>
	<button interop-button type="submit">Save</button>
</form>
`,
	inputTs: `readonly skills = signal(["Angular", "CSS"]);
readonly alreadyAdded = (value: string) => \`\${value} is already added.\`;

addSkill(event: Event): void {
	const { value } = (event as CustomEvent<TagAddDetail>).detail;
	// preventDefault() rejects the value and keeps it in the field.
	if (this.skills().includes(value)) event.preventDefault();
	else this.skills.update((skills) => [...skills, value]);
}

removeSkill(skill: string): void {
	this.skills.update((skills) => skills.filter((s) => s !== skill));
}
`,
	sizes: `<ul interop-tags role="list" itx-size="sm">…</ul>
<ul interop-tags role="list">…</ul>
<ul interop-tags role="list" itx-size="lg">…</ul>
`,
};
