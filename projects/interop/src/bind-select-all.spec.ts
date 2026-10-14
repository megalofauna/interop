import { bindSelectAll } from './bind-select-all';

describe('bindSelectAll', () => {
	let unbind: () => void;
	const setup = (boxes: string) => {
		document.body.innerHTML = `
			<form>
				<fieldset interop-checkbox-group>
					<legend>Toppings</legend>
					<label interop-checkbox><input type="checkbox" id="all"> All toppings</label>
					${boxes}
				</fieldset>
			</form>`;
		const parent = document.getElementById('all') as HTMLInputElement;
		const boxes_ = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="t"]'));
		unbind = bindSelectAll(parent);
		return { parent, boxes: boxes_ };
	};
	const box = (attributes = '') => `<label interop-checkbox><input type="checkbox" name="t" ${attributes}> Topping</label>`;
	afterEach(() => unbind?.());

	it('shows unchecked, mixed or checked to match the boxes', () => {
		const { parent, boxes } = setup(box() + box());
		expect([parent.checked, parent.indeterminate]).toEqual([false, false]);
		boxes[0].click();
		expect([parent.checked, parent.indeterminate]).toEqual([false, true]);
		boxes[1].click();
		expect([parent.checked, parent.indeterminate]).toEqual([true, false]);
	});

	it('reads the boxes when it binds', () => {
		const { parent } = setup(box('checked') + box());
		expect(parent.indeterminate).toBe(true);
	});

	it('checks and unchecks every enabled box, and leaves disabled boxes alone', () => {
		const { parent, boxes } = setup(box() + box() + box('disabled'));
		parent.click();
		expect(boxes.map((b) => b.checked)).toEqual([true, true, false]);
		// A disabled unchecked box keeps the parent mixed, and the next press unchecks the rest.
		expect(parent.indeterminate).toBe(true);
		parent.click();
		expect(boxes.map((b) => b.checked)).toEqual([false, false, false]);
	});

	it('fires input and change on each box it changes', () => {
		const { parent, boxes } = setup(box() + box('checked'));
		const events: string[] = [];
		for (const b of boxes)
			for (const type of ['input', 'change']) b.addEventListener(type, () => events.push(`${b === boxes[0] ? 0 : 1}:${type}`));
		parent.click();
		expect(events).toEqual(['0:input', '0:change']);
	});

	it('follows a form reset', async () => {
		const { parent, boxes } = setup(box() + box());
		boxes[0].click();
		expect(parent.indeterminate).toBe(true);
		parent.form!.reset();
		await new Promise((resolve) => setTimeout(resolve));
		expect([parent.checked, parent.indeterminate]).toEqual([false, false]);
	});

	it('stops once unbound', () => {
		const { parent, boxes } = setup(box() + box());
		unbind();
		boxes[0].click();
		expect(parent.indeterminate).toBe(false);
	});
});
