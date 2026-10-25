/** The TS beside the dialog page's Angular examples. Their markup is read from the template. */
export const examples = {
	formTs: `readonly dirty = signal(false);
readonly warning = signal(false);

/** Escape and the close button fire cancel. Keep the dialog open while there is unsaved input. */
guard(event: Event): void {
	if (this.dirty()) {
		event.preventDefault();
		this.warning.set(true);
	}
}
`,
	fromCode: `readonly saved = viewChild.required<ElementRef<HTMLDialogElement>>("saved");

// After the work is done, from code: no button opened it.
this.saved().nativeElement.showModal();
`,
};
