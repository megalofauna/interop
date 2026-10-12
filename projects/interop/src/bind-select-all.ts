/**
 * Keeps a select-all checkbox in step with the other checkboxes in `group`, which defaults to the
 * parent's fieldset.
 *
 * Checking the parent checks every enabled box, and unchecking it unchecks them. Disabled boxes keep
 * their state. The parent shows checked when every box is checked, mixed when some are, and unchecked
 * when none are, counting disabled boxes too. Each box it changes fires `input` and `change`, so forms
 * and listeners see the change. It also follows a form reset.
 *
 * A box changed from script fires no event. Dispatch a bubbling `change` on it afterward, or in
 * Angular bind the parent from the same model instead. Returns a function that unbinds.
 */
export function bindSelectAll(
	parent: HTMLInputElement,
	group: ParentNode = parent.closest('fieldset')!,
): () => void {
	const boxes = () =>
		Array.from(group.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')).filter((box) => box !== parent);

	const sync = () => {
		const all = boxes();
		const checked = all.filter((box) => box.checked).length;
		parent.checked = all.length > 0 && checked === all.length;
		parent.indeterminate = checked > 0 && checked < all.length;
	};

	const onParentChange = () => {
		const enabled = boxes().filter((box) => !box.disabled);
		// Check them all unless they already are. A disabled unchecked box would otherwise keep the parent mixed forever.
		const target = !enabled.every((box) => box.checked);
		for (const box of enabled) {
			if (box.checked === target) continue;
			box.checked = target;
			box.dispatchEvent(new Event('input', { bubbles: true }));
			box.dispatchEvent(new Event('change', { bubbles: true }));
		}
		sync();
	};

	const onGroupChange = (event: Event) => {
		if (event.target !== parent) sync();
	};

	// The reset event fires before the form resets, so read the boxes after it.
	const onReset = () => setTimeout(sync);

	parent.addEventListener('change', onParentChange);
	group.addEventListener('change', onGroupChange);
	parent.form?.addEventListener('reset', onReset);
	sync();

	return () => {
		parent.removeEventListener('change', onParentChange);
		group.removeEventListener('change', onGroupChange);
		parent.form?.removeEventListener('reset', onReset);
	};
}
