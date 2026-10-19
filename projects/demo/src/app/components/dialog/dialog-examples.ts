/** The markup each example on the dialog page shows, written to be copied. */
export const examples = {
	confirm: `<button interop-button type="button" commandfor="delete" command="show-modal">Delete file…</button>

<dialog id="delete" interop-dialog aria-labelledby="delete-title" (close)="result.set($any($event.target).returnValue)">
	<h2 id="delete-title">Delete "notes.txt"?</h2>
	<p>The file moves to the trash for 30 days.</p>
	<form method="dialog">
		<footer>
			<button interop-button type="submit" value="cancel" autofocus>Cancel</button>
			<button interop-button type="submit" value="delete">Delete</button>
		</footer>
	</form>
</dialog>
`,
	form: `<dialog id="rename" interop-dialog aria-labelledby="rename-title" (cancel)="guard($event)">
	<header>
		<h2 id="rename-title">Rename file</h2>
		<button interop-button="icon" itx-size="sm" type="button" commandfor="rename" command="request-close">
			<span itx-visually-hidden>Close</span>
			<svg interop-icon name="tabler-x"></svg>
		</button>
	</header>
	<form method="dialog">
		<label for="file-name">Name</label>
		<input interop-input id="file-name" autofocus (input)="dirty.set(true)" />
		@if (warning()) {
			<p role="alert">You have unsaved changes. <button type="button" commandfor="rename" command="close">Discard them</button></p>
		}
		<footer><button interop-button type="submit" value="save">Save</button></footer>
	</form>
</dialog>
`,
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
	lightDismiss: `<dialog id="shortcuts" interop-dialog closedby="any" aria-labelledby="shortcuts-title">
	…
</dialog>
`,
	alert: `<dialog id="timeout" interop-dialog role="alertdialog" closedby="none"
	aria-labelledby="timeout-title" aria-describedby="timeout-message">
	<h2 id="timeout-title">Your session is about to end</h2>
	<p id="timeout-message">You will be signed out in 2 minutes. Unsaved work will be lost.</p>
	<form method="dialog">
		<footer>
			<button interop-button type="submit" value="sign-out">Sign out</button>
			<button interop-button type="submit" value="stay" autofocus>Stay signed in</button>
		</footer>
	</form>
</dialog>
`,
	fromCode: `<dialog #saved interop-dialog aria-labelledby="saved-title">…</dialog>

readonly saved = viewChild.required<ElementRef<HTMLDialogElement>>("saved");

// After the work is done, from code: no button opened it.
this.saved().nativeElement.showModal();
`,
};
