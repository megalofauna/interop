/**
 * Adds Home and End to the radio groups in `root`: they focus and check the first or last enabled
 * radio with the same name. Native radios have only the arrow keys. It leaves the keys alone when a
 * modifier is held, so browser and system shortcuts still work. Returns a function that unbinds.
 */
export function bindRadioHomeEnd(root: HTMLElement): () => void {
	const onKeydown = (event: KeyboardEvent) => {
		const radio = event.target;
		if (!(radio instanceof HTMLInputElement) || radio.type !== 'radio' || !radio.name) return;
		if ((event.key !== 'Home' && event.key !== 'End') || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
		const radios = Array.from(root.querySelectorAll<HTMLInputElement>('input[type="radio"]:not(:disabled)')).filter(
			(other) => other.name === radio.name,
		);
		const target = event.key === 'Home' ? radios[0] : radios.at(-1);
		if (!target) return;
		event.preventDefault();
		target.focus();
		// click() checks the radio and fires input and change, as a user's choice does.
		target.click();
	};
	root.addEventListener('keydown', onKeydown);
	return () => root.removeEventListener('keydown', onKeydown);
}
