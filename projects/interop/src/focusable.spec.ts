import { focusables, isFocusable } from './focusable';

describe('focusables', () => {
	it('finds what the keyboard can reach, in document order', () => {
		document.body.innerHTML = `
			<a href="/a" id="link">A</a>
			<a id="anchor">No href</a>
			<button id="button">B</button>
			<button disabled>Disabled</button>
			<input type="hidden" />
			<input id="input" />
			<details><summary id="summary">More</summary></details>
			<div contenteditable id="editable"></div>
			<div contenteditable="false"></div>
			<div tabindex="0" id="stop"></div>
			<div tabindex="-1"></div>
			<div inert><button>Inert</button></div>
		`;
		expect(focusables(document.body).map((element) => element.id)).toEqual(['link', 'button', 'input', 'summary', 'editable', 'stop']);
	});

	it('tells whether one element can take focus from the keyboard', () => {
		document.body.innerHTML = '<h2 id="heading">Title</h2><h2 id="target" tabindex="-1">Target</h2><button id="button">B</button>';
		expect(['heading', 'target', 'button'].map((id) => isFocusable(document.getElementById(id)!))).toEqual([false, false, true]);
	});
});
