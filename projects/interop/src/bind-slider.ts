export interface SliderOptions {
	/**
	 * The value as words, for a number that alone misleads: `(v) => \`$${v}\``, `(v) => \`${v} degrees\``.
	 * It sets `aria-valuetext` and the readout's text. Leave it out for a plain number.
	 */
	format?: (value: number) => string;
	/** An element the page leaves empty, to show the value. It is hidden from assistive technology: the slider speaks its own value. */
	readout?: HTMLElement | null;
}

/**
 * Draws the fill of an `input[type="range"][interop-slider]` and keeps its value text current. It
 * sets `--itx-slider-value`, from 0 at `min` to 1 at `max`, which the stylesheet turns into the
 * filled part of the track, and with `format` it sets `aria-valuetext`.
 *
 * Without it the slider works the same and its track draws unfilled.
 */
export function paintSlider(input: HTMLInputElement, options: SliderOptions = {}): void {
	const value = input.valueAsNumber;
	const min = Number(input.min || 0);
	const max = Number(input.max || 100);
	input.style.setProperty('--itx-slider-value', String(max > min ? (value - min) / (max - min) : 0));
	const text = options.format?.(value);
	if (text === undefined) input.removeAttribute('aria-valuetext');
	else input.setAttribute('aria-valuetext', text);
	if (options.readout) {
		options.readout.setAttribute('aria-hidden', 'true');
		options.readout.textContent = text ?? String(value);
	}
}

/**
 * Calls paintSlider() now, on every `input`, and after the slider's form resets, which fires no
 * `input` event. A value set by script fires none either: call paintSlider() after setting it.
 *
 * Returns a function that removes the behavior.
 */
export function bindSlider(input: HTMLInputElement, options: SliderOptions = {}): () => void {
	const paint = () => paintSlider(input, options);
	const listening = new AbortController();
	const { signal } = listening;
	input.addEventListener('input', paint, { signal });
	// The form restores its fields after its reset event has run.
	input.form?.addEventListener('reset', () => setTimeout(paint), { signal });
	paint();
	return () => listening.abort();
}
