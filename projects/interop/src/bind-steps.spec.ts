import { bindSteps, type StepsChangeDetail } from './bind-steps';

describe('bindSteps', () => {
	let unbind: (() => void) | undefined;
	const setup = (options: Parameters<typeof bindSteps>[1] = {}) => {
		document.body.innerHTML = `
			<form id="apply">
				<ol interop-steps role="list" aria-label="Progress">
					<li>Details <span data-step-status></span></li>
					<li>Address <span data-step-status></span></li>
					<li>Review <span data-step-status></span></li>
				</ol>
				<fieldset id="details">
					<legend><h2>Your details</h2></legend>
					<input name="name" required>
					<button type="button" command="--next" commandfor="apply">Next</button>
				</fieldset>
				<fieldset id="address" hidden>
					<legend><h2>Address</h2></legend>
					<input name="street" required>
				</fieldset>
				<fieldset id="review" hidden>
					<legend><h2>Review</h2></legend>
					<button type="submit">Send</button>
				</fieldset>
			</form>`;
		const form = document.getElementById('apply') as HTMLFormElement;
		unbind = bindSteps(form, options);
		const step = (id: string) => document.getElementById(id) as HTMLFieldSetElement;
		const field = (name: string) => form.querySelector<HTMLInputElement>(`[name="${name}"]`)!;
		const command = (name: string, value = '') =>
			form.dispatchEvent(
				Object.assign(new Event('command'), { command: name, source: Object.assign(document.createElement('button'), { value }) }),
			);
		const shown = () => ['details', 'address', 'review'].filter((id) => !step(id).hidden);
		const indicator = () =>
			Array.from(form.querySelectorAll('li')).map(
				(li) => `${li.getAttribute('aria-current') ?? '-'}:${li.querySelector('span')!.textContent}`,
			);
		return { form, step, field, command, shown, indicator };
	};
	afterEach(() => {
		unbind?.();
		unbind = undefined;
	});

	it('shows one step and marks it in the indicator', () => {
		const { shown, indicator } = setup();
		expect(shown()).toEqual(['details']);
		expect(indicator()).toEqual(['step:current', '-:not completed', '-:not completed']);
	});

	it('stays on a step with an invalid field, and moves on once it is valid', () => {
		const { field, command, shown, indicator } = setup();
		command('--next');
		expect(shown()).toEqual(['details']);
		field('name').value = 'Ada';
		command('--next');
		expect(shown()).toEqual(['address']);
		expect(indicator()).toEqual(['-:completed', 'step:current', '-:not completed']);
	});

	it('moves focus to the new step heading', () => {
		const { field, command } = setup();
		field('name').value = 'Ada';
		command('--next');
		expect(document.activeElement?.textContent).toBe('Address');
		expect((document.activeElement as HTMLElement).tabIndex).toBe(-1);
	});

	it('goes back, and shows a reached step by id but not one ahead', () => {
		const { field, command, shown } = setup();
		field('name').value = 'Ada';
		command('--next');
		command('--back');
		expect(shown()).toEqual(['details']);
		command('--show-step', 'review');
		expect(shown()).toEqual(['details']);
		command('--show-step', 'address');
		expect(shown()).toEqual(['address']);
	});

	it('treats Enter in a field before the last step as Next', () => {
		const { field, shown } = setup();
		field('name').value = 'Ada';
		const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
		field('name').dispatchEvent(enter);
		expect([enter.defaultPrevented, shown()]).toEqual([true, ['address']]);
	});

	it('shows the hidden step of an invalid field when the form is submitted', async () => {
		const { form, field, step, command, shown } = setup();
		field('name').value = 'Ada';
		command('--next');
		command('--back');
		form.checkValidity();
		expect(shown()).toEqual(['address']);
		expect(step('address').contains(field('street'))).toBe(true);
	});

	it('never disables a step, so every value submits', () => {
		const { step } = setup();
		expect(['details', 'address', 'review'].some((id) => step(id).disabled)).toBe(false);
	});

	it('fires interop-steps-change with the step', () => {
		const { form, field, command } = setup();
		const changes: string[] = [];
		form.addEventListener('interop-steps-change', (event) => changes.push((event as CustomEvent<StepsChangeDetail>).detail.step.id));
		field('name').value = 'Ada';
		command('--next');
		expect(changes).toEqual(['address']);
	});

	it('records each step in history and follows Back between reached steps', () => {
		const { field, command, shown } = setup({ history: true });
		field('name').value = 'Ada';
		command('--next');
		expect(history.state['itx-step:apply']).toBe(1);
		window.dispatchEvent(new PopStateEvent('popstate', { state: { 'itx-step:apply': 0 } }));
		expect(shown()).toEqual(['details']);
		window.dispatchEvent(new PopStateEvent('popstate', { state: { 'itx-step:apply': 2 } }));
		expect(shown()).toEqual(['details']);
	});

	it('stops once unbound', () => {
		const { field, command, shown } = setup();
		unbind!();
		field('name').value = 'Ada';
		command('--next');
		expect(shown()).toEqual(['details']);
	});
});
