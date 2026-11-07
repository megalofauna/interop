/**
 * Keeps `target`'s data-view equal to the value of the checked radio in `group`, on every change.
 * Returns a function that removes the binding.
 */
export function bindView(
	group: HTMLFieldSetElement,
	target: HTMLElement,
): () => void {
	const show = () => {
		const checked = group.querySelector<HTMLInputElement>(
			'input[type="radio"]:checked',
		);
		if (checked) target.dataset["view"] = checked.value;
	};
	// The browser can restore a different checked radio on back and forward navigation.
	show();
	group.addEventListener("change", show);
	return () => group.removeEventListener("change", show);
}
