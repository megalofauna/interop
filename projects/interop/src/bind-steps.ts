import { watchInteropInDevMode } from './audit';

export interface StepsOptions {
	/** The step indicator to keep in step. Defaults to an `ol[interop-steps]` inside the form. */
	indicator?: HTMLOListElement | null;
	/** Text for elements marked `data-step-status` in the indicator, so translations can replace it. */
	status?: { completed: string; current: string; upcoming: string };
	/** Add a history entry per step, on the same URL, so the browser's Back and Forward move between reached steps. */
	history?: boolean;
}

export interface StepsChangeDetail {
	step: HTMLFieldSetElement;
	index: number;
}

/** Where focus goes after a step change: the step's first heading, else its legend, else the step. */
const HEADINGS = 'h1, h2, h3, h4, h5, h6';

/**
 * Turns a form into a multi-step form. Each direct child `<fieldset>` is a step, with its own
 * buttons, which drive it through invoker commands aimed at the form:
 *
 *   <button type="button" command="--back" commandfor="apply">Back</button>
 *   <button type="button" command="--next" commandfor="apply">Next</button>
 *   <button type="button" command="--show-step" value="details" commandfor="apply">Change</button>
 *
 * - One step shows; the others are `hidden`, never `disabled`, so every value submits. Without
 *   script, every step shows: a long form.
 * - `--next` reports the current step's first invalid field and stays, or moves on. `--back` moves
 *   back. `--show-step` shows the step whose `id` is the button's `value`, if it has been reached.
 * - Enter in a field of any step but the last means Next, not submit.
 * - On submit, an invalid field in a hidden step cannot be shown or focused by the browser, so the
 *   submit fails silently. The helper shows that step and reports the field.
 * - After a step change, focus moves to the step's first heading, else its legend, which gets
 *   `tabindex="-1"`.
 * - The indicator's `aria-current="step"` follows, and `data-step-status` elements in it get the
 *   status text.
 * - A step change fires `interop-steps-change` on the form, detail `{ step, index }`.
 *
 * Returns a function that removes the behavior.
 */
export function bindSteps(form: HTMLFormElement, options: StepsOptions = {}): () => void {
	const status = options.status ?? { completed: 'completed', current: 'current', upcoming: 'not completed' };
	const indicator = options.indicator ?? form.querySelector<HTMLOListElement>('ol[interop-steps]');
	const view = form.ownerDocument.defaultView;
	const key = `itx-step:${form.id}`;

	const steps = () => Array.from(form.querySelectorAll<HTMLFieldSetElement>(':scope > fieldset'));
	let current = Math.max(0, steps().findIndex((step) => !step.hidden));
	let furthest = current;
	/** Set while one submit's invalid events are handled, so only the first one moves the form. */
	let rescuing = false;

	const update = () => {
		const all = steps();
		all.forEach((step, index) => (step.hidden = index !== current));
		if (!indicator) return;
		Array.from(indicator.children).forEach((item, index) => {
			if (index === current) item.setAttribute('aria-current', 'step');
			else item.removeAttribute('aria-current');
			const text = item.querySelector('[data-step-status]');
			if (text) text.textContent = index === current ? status.current : index < current ? status.completed : status.upcoming;
		});
	};

	const focusHeading = (step: HTMLFieldSetElement) => {
		// A heading inside the legend wins over the legend, so focus lands on something announced as a heading.
		const heading = step.querySelector<HTMLElement>(HEADINGS) ?? step.querySelector<HTMLElement>('legend') ?? step;
		if (!heading.hasAttribute('tabindex')) heading.tabIndex = -1;
		heading.focus();
	};

	const go = (index: number, { focus = true, record = true } = {}) => {
		const all = steps();
		if (index < 0 || index >= all.length || index === current) return;
		current = index;
		furthest = Math.max(furthest, index);
		update();
		if (focus) focusHeading(all[index]);
		if (record && options.history && view) view.history.pushState({ ...view.history.state, [key]: index }, '');
		const detail: StepsChangeDetail = { step: all[index], index };
		form.dispatchEvent(new CustomEvent('interop-steps-change', { bubbles: true, detail }));
	};

	/** The current step's first invalid field, reported, or nothing when the step is valid. */
	const reportStep = () => {
		const invalid = Array.from(steps()[current]?.elements ?? []).find(
			(element) => 'checkValidity' in element && (element as HTMLInputElement).willValidate && !(element as HTMLInputElement).checkValidity(),
		) as HTMLInputElement | undefined;
		invalid?.reportValidity();
		return invalid;
	};

	const next = () => {
		if (!reportStep()) go(current + 1);
	};

	const onCommand = (event: Event) => {
		const { command, source } = event as Event & { command: string; source: HTMLButtonElement | null };
		if (command === '--next') next();
		else if (command === '--back') go(current - 1);
		else if (command === '--show-step') {
			const index = steps().findIndex((step) => step.id === source?.value);
			if (index >= 0 && index <= furthest) go(index);
		}
	};

	// Enter submits a form from any field. Before the last step it means Next.
	const onKeydown = (event: KeyboardEvent) => {
		const field = event.target as HTMLElement;
		if (event.key !== 'Enter' || current === steps().length - 1) return;
		if (!(field instanceof HTMLInputElement) || ['button', 'submit', 'reset', 'checkbox', 'radio'].includes(field.type)) return;
		event.preventDefault();
		next();
	};

	// The browser fires invalid on a hidden field before it gives up on submitting.
	const onInvalid = (event: Event) => {
		const field = event.target as HTMLInputElement;
		const index = steps().findIndex((step) => step.contains(field));
		if (rescuing || index < 0 || index === current) return;
		rescuing = true;
		event.preventDefault();
		go(index, { focus: false });
		setTimeout(() => {
			rescuing = false;
			field.reportValidity();
		});
	};

	const onPopstate = (event: PopStateEvent) => {
		const index = (event.state as Record<string, unknown> | null)?.[key];
		if (typeof index === 'number' && index <= furthest) go(index, { record: false });
	};

	const listening = new AbortController();
	const { signal } = listening;
	form.addEventListener('command', onCommand, { signal });
	form.addEventListener('keydown', onKeydown, { signal });
	form.addEventListener('invalid', onInvalid, { capture: true, signal });
	if (options.history && view) {
		view.history.replaceState({ ...view.history.state, [key]: current }, '');
		view.addEventListener('popstate', onPopstate, { signal });
	}
	update();
	watchInteropInDevMode();

	return () => listening.abort();
}
