type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/** The `ValidityState` keys a message can be given for. */
export type ValidityKey =
	| 'badInput'
	| 'valueMissing'
	| 'typeMismatch'
	| 'tooShort'
	| 'tooLong'
	| 'rangeUnderflow'
	| 'rangeOverflow'
	| 'stepMismatch'
	| 'patternMismatch'
	| 'customError';

/** A message, or a function of the control and its label's text. */
export type ValidationMessage = string | ((control: Control, label: string) => string);

export interface ValidationOptions {
	/** An `[interop-error-summary]` with an empty `<ul>`. A failed submit lists every error there, linked, and focuses it. */
	summary?: HTMLElement | null;
	/** Messages per validity key, merged over the defaults. */
	messages?: Partial<Record<ValidityKey, ValidationMessage>>;
}

/** The order errors are checked in: the first that applies is shown. */
const KEYS: ValidityKey[] = [
	'badInput',
	'valueMissing',
	'typeMismatch',
	'tooShort',
	'tooLong',
	'rangeUnderflow',
	'rangeOverflow',
	'stepMismatch',
	'patternMismatch',
	'customError',
];

/** "Email address" becomes "email address" inside a sentence; "URL" stays. */
const inSentence = (label: string) => (/^.[a-z]/.test(label) ? label[0].toLowerCase() + label.slice(1) : label);

export const defaultValidationMessages: Record<ValidityKey, (control: Control, label: string) => string> = {
	badInput: (_, label) => `Enter ${inSentence(label)} in the right format`,
	// A question cannot go inside a sentence, so its message is general.
	valueMissing: (control, label) =>
		control instanceof HTMLSelectElement || control.type === 'radio'
			? label.endsWith('?')
				? 'Select an option'
				: `Select ${inSentence(label)}`
			: control.type === 'checkbox'
				? `${label} is required`
				: label.endsWith('?')
					? 'Enter an answer'
					: `Enter ${inSentence(label)}`,
	typeMismatch: (control, label) =>
		control.type === 'email'
			? 'Enter an email address like name@example.com'
			: control.type === 'url'
				? 'Enter a web address that starts with https://'
				: `Enter ${inSentence(label)} in the right format`,
	tooShort: (control, label) => `${label} must be ${(control as HTMLInputElement).minLength} characters or more`,
	tooLong: (control, label) => `${label} must be ${(control as HTMLInputElement).maxLength} characters or fewer`,
	rangeUnderflow: (control, label) => `${label} must be ${(control as HTMLInputElement).min} or more`,
	rangeOverflow: (control, label) => `${label} must be ${(control as HTMLInputElement).max} or less`,
	stepMismatch: (control, label) => `${label} must be in steps of ${(control as HTMLInputElement).step}`,
	patternMismatch: (control, label) => control.title || `Enter ${inSentence(label)} in the right format`,
	customError: (control) => control.validationMessage,
};

let ids = 0;

const isControl = (element: unknown): element is Control =>
	element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement;

/**
 * Shows a form's errors in the page, using the browser's own validity, at the right time.
 *
 * - The form gets `novalidate`, so the browser's message bubbles never show; the browser still
 *   checks every constraint (`required`, `type`, `minlength`, `pattern`, `setCustomValidity()`).
 * - A field's error shows in the `[interop-error]` of its `[interop-field]`, or of the nearest
 *   fieldset that has one: a radio group, or a date as three fields, shares one error, which shows
 *   the first failing control's message. While it shows, it is in the control's `aria-describedby`
 *   (the fieldset's, for a group), and each failing control is `aria-invalid="true"`. Otherwise
 *   controls are `aria-invalid="false"`, which also stops `setCustomValidity()` marking an untouched
 *   field invalid.
 * - When: on submit; or when the user leaves a field they changed and its format is wrong. An empty
 *   required field waits for submit. Once shown, the error updates as the user types and clears when
 *   the value is fixed.
 * - A failed submit is stopped, other submit listeners included. With `summary`, its `<ul>` lists each
 *   error as a link to its field and it takes focus; a link moves focus to the field and scrolls its
 *   label into view. Without it, focus moves to the first invalid field.
 * - The `invalid` event is handled too, so `reportValidity()` from bindSteps() or bindTagInput() shows
 *   the same message.
 * - A field's own error updates when it fires `interop-validity-change`, after a `setCustomValidity()`
 *   that came from outside the form's events.
 *
 * Messages come from `messages`, merged over `defaultValidationMessages`, keyed by the first failing
 * `ValidityState` key. Returns a function that removes the behavior and the attributes it added.
 */
export function bindValidation(form: HTMLFormElement, options: ValidationOptions = {}): () => void {
	const messages = { ...defaultValidationMessages, ...options.messages };
	const summary = options.summary ?? null;
	const addedNoValidate = !form.noValidate;
	/** Controls whose errors update as the user types. */
	const active = new Set<Control>();
	/** Controls given aria-invalid here, so unbinding can remove it. */
	const marked = new Set<Control>();
	let submitted = false;

	const controls = () => Array.from(form.elements).filter((element): element is Control => isControl(element) && element.willValidate);
	/** Where a control's error is: the nearest field or fieldset with an `[interop-error]`. */
	const ownerOf = (control: Control) =>
		control.closest<HTMLElement>(':is([interop-field], fieldset):has(> [interop-error])') ??
		control.closest<HTMLElement>('[interop-field], fieldset');
	const isGrouped = (control: Control) => ownerOf(control)?.tagName === 'FIELDSET';
	/** The controls one error speaks for: every control under a fieldset's error, else the control alone. */
	const groupOf = (control: Control) => {
		const owner = ownerOf(control);
		return isGrouped(control) ? controls().filter((other) => ownerOf(other) === owner) : [control];
	};

	const labelOf = (control: Control) => {
		const owner = ownerOf(control);
		// A radio or checkbox in a group is named by the legend; a part of a date, by its own label.
		const choice = control.type === 'radio' || control.type === 'checkbox';
		const source = choice && isGrouped(control) ? owner?.querySelector(':scope > legend') : control.labels?.[0];
		return (source?.textContent ?? control.name).replace(/\s+/g, ' ').trim();
	};

	const messageFor = (control: Control) => {
		const key = KEYS.find((candidate) => control.validity[candidate]);
		if (!key) return '';
		const message = messages[key];
		return typeof message === 'function' ? message(control, labelOf(control)) : message;
	};

	const describe = (element: Element, id: string, on: boolean) => {
		const ids = (element.getAttribute('aria-describedby') ?? '').split(/\s+/).filter((existing) => existing && existing !== id);
		if (on) ids.push(id);
		if (ids.length) element.setAttribute('aria-describedby', ids.join(' '));
		else element.removeAttribute('aria-describedby');
	};

	const setInvalid = (control: Control, invalid: boolean) => {
		if (!control.hasAttribute('aria-invalid')) marked.add(control);
		control.setAttribute('aria-invalid', String(invalid));
	};

	/** Shows or clears the error for `control` and its group. Returns the message. */
	const update = (control: Control) => {
		const group = groupOf(control);
		// Only controls the user has reached speak: changing the day does not flag an untouched month.
		const failing = group.find((member) => !member.validity.valid && active.has(member));
		const message = failing ? messageFor(failing) : '';
		for (const member of group) setInvalid(member, !member.validity.valid && active.has(member));
		const owner = ownerOf(control);
		const error = owner?.querySelector<HTMLElement>(':scope > [interop-error]');
		if (error) {
			error.id ||= `itx-error-${++ids}`;
			error.textContent = message;
			error.hidden = !message;
			const described = isGrouped(control) ? owner! : control;
			describe(described, error.id, !!message);
		}
		return message;
	};

	/** A radio or checkbox activates its whole name group; any other control only itself. */
	const activate = (control: Control) => {
		const choice = control.type === 'radio' || control.type === 'checkbox';
		for (const member of groupOf(control)) if (member === control || (choice && member.name === control.name)) active.add(member);
	};

	const onInvalid = (event: Event) => {
		if (!isControl(event.target)) return;
		event.preventDefault();
		activate(event.target);
		update(event.target);
	};

	const onChange = (event: Event) => {
		const control = event.target;
		if (!isControl(control) || !control.willValidate) return;
		// Leaving a changed field: a wrong format shows now; an empty required field waits for submit.
		if (!control.validity.valid && !(control.validity.valueMissing && !submitted)) activate(control);
		if (groupOf(control).some((member) => active.has(member))) update(control);
	};

	const onInput = (event: Event) => {
		if (isControl(event.target) && groupOf(event.target).some((member) => active.has(member))) update(event.target);
	};

	const focusField = (control: Control) => {
		const heading = isGrouped(control) ? ownerOf(control)?.querySelector(':scope > legend') : control.labels?.[0];
		(heading ?? control).scrollIntoView?.({ block: 'start' });
		control.focus({ preventScroll: true });
	};

	const fillSummary = (errors: { control: Control; message: string }[]) => {
		if (!summary) return;
		const list = summary.querySelector('ul');
		const document = form.ownerDocument;
		list?.replaceChildren(
			...errors.map(({ control, message }) => {
				control.id ||= `itx-field-${++ids}`;
				const link = document.createElement('a');
				// The page's own address: a <base href> would send a bare #id elsewhere.
				link.href = `${document.URL.split('#')[0]}#${control.id}`;
				link.textContent = message;
				const item = document.createElement('li');
				item.append(link);
				return item;
			}),
		);
		summary.hidden = errors.length === 0;
	};

	const onSubmit = (event: SubmitEvent) => {
		submitted = true;
		const errors: { control: Control; message: string }[] = [];
		const seen = new Set<Control>();
		for (const control of controls()) {
			if (seen.has(control)) continue;
			const group = groupOf(control);
			group.forEach((member) => seen.add(member));
			// checkValidity() fires invalid, which shows the error and lets bindSteps() show a hidden step.
			// Every member, not until the first failure, so each one is flagged.
			const valid = group.map((member) => member.checkValidity()).every(Boolean);
			if (valid) {
				if (group.some((member) => active.has(member))) update(control);
				continue;
			}
			const failing = group.find((member) => !member.validity.valid)!;
			errors.push({ control: failing, message: messageFor(failing) });
		}
		fillSummary(errors);
		if (!errors.length) return;
		event.preventDefault();
		event.stopImmediatePropagation();
		if (summary) {
			if (!summary.hasAttribute('tabindex')) summary.tabIndex = -1;
			summary.focus();
		} else focusField(errors[0].control);
	};

	const onSummaryClick = (event: MouseEvent) => {
		const link = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
		const target = link?.hash && form.ownerDocument.getElementById(decodeURIComponent(link.hash.slice(1)));
		if (!isControl(target)) return;
		event.preventDefault();
		focusField(target);
	};

	// The reset event fires before the form resets, so clear the errors after it.
	const onReset = () =>
		setTimeout(() => {
			submitted = false;
			const shown = Array.from(active);
			active.clear();
			for (const control of shown) {
				for (const member of groupOf(control)) setInvalid(member, false);
				const error = ownerOf(control)?.querySelector<HTMLElement>(':scope > [interop-error]');
				if (error) {
					error.textContent = '';
					error.hidden = true;
					describe(isGrouped(control) ? ownerOf(control)! : control, error.id, false);
				}
			}
			fillSummary([]);
		});

	const onValidityChange = (event: Event) => {
		if (isControl(event.target) && active.has(event.target)) update(event.target);
	};

	form.noValidate = true;
	for (const control of controls()) if (!control.hasAttribute('aria-invalid')) setInvalid(control, false);

	const listening = new AbortController();
	const { signal } = listening;
	// Capture, so a failed submit stops before any other submit listener on the form.
	form.addEventListener('submit', onSubmit, { capture: true, signal });
	form.addEventListener('invalid', onInvalid, { capture: true, signal });
	form.addEventListener('change', onChange, { signal });
	form.addEventListener('input', onInput, { signal });
	form.addEventListener('reset', onReset, { signal });
	form.addEventListener('interop-validity-change', onValidityChange, { signal });
	summary?.addEventListener('click', onSummaryClick, { signal });

	return () => {
		listening.abort();
		if (addedNoValidate) form.noValidate = false;
		for (const control of marked) control.removeAttribute('aria-invalid');
	};
}
