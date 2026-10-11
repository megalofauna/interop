import { scopeSelectAll } from './scope-select-all';

describe('scopeSelectAll', () => {
	const press = () => {
		const event = new KeyboardEvent('keydown', { key: 'a', metaKey: true, bubbles: true, cancelable: true });
		document.dispatchEvent(event);
		return event;
	};

	it('selects the code of the block the selection is in, then the page on a second press', () => {
		document.body.innerHTML = '<h1>Title</h1><pre><code id="one">first block</code></pre><pre><code>second block</code></pre>';
		const remove = scopeSelectAll();
		const selection = document.getSelection()!;
		selection.collapse(document.getElementById('one')!.firstChild, 2);

		expect(press().defaultPrevented).toBe(true);
		expect(selection.toString()).toBe('first block');
		expect(press().defaultPrevented).toBe(false);
		remove();
	});

	it('leaves Select All alone outside code', () => {
		document.body.innerHTML = '<p id="p">Text</p><pre><code>code</code></pre>';
		const remove = scopeSelectAll();
		document.getSelection()!.collapse(document.getElementById('p')!.firstChild, 1);
		expect(press().defaultPrevented).toBe(false);
		remove();
	});
});
