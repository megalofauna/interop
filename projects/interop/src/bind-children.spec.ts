import { bindChildren } from './bind-children';

describe('bindChildren', () => {
	const flush = () => Promise.resolve();
	let stop: (() => void) | undefined;
	afterEach(() => {
		stop?.();
		stop = undefined;
		document.body.innerHTML = '';
	});

	const watch = (host: HTMLElement) => {
		const log: string[] = [];
		stop = bindChildren(
			host,
			() => [host.querySelector(':scope > input')],
			(input) => {
				if (!input) return null;
				log.push(`bind ${input.id}`);
				return () => log.push(`unbind ${input.id}`);
			},
		);
		return log;
	};

	it('binds the children already in place', () => {
		document.body.innerHTML = '<div><input id="a"></div>';
		expect(watch(document.querySelector('div')!)).toEqual(['bind a']);
	});

	it('binds a child added later, as a framework renders it', async () => {
		document.body.innerHTML = '<div></div>';
		const host = document.querySelector('div')!;
		const log = watch(host);
		expect(log).toEqual([]);
		host.insertAdjacentHTML('beforeend', '<input id="a">');
		await flush();
		expect(log).toEqual(['bind a']);
	});

	it('binds again when the child is replaced, and not when other children change', async () => {
		document.body.innerHTML = '<div><input id="a"></div>';
		const host = document.querySelector('div')!;
		const log = watch(host);
		host.append(document.createElement('p'));
		await flush();
		expect(log).toEqual(['bind a']);
		host.querySelector('input')!.replaceWith(Object.assign(document.createElement('input'), { id: 'b' }));
		await flush();
		expect(log).toEqual(['bind a', 'unbind a', 'bind b']);
	});

	it('removes the binding when the child goes, and when it stops', async () => {
		document.body.innerHTML = '<div><input id="a"></div>';
		const host = document.querySelector('div')!;
		const log = watch(host);
		host.querySelector('input')!.remove();
		await flush();
		expect(log).toEqual(['bind a', 'unbind a']);
		host.insertAdjacentHTML('beforeend', '<input id="b">');
		await flush();
		stop!();
		stop = undefined;
		expect(log).toEqual(['bind a', 'unbind a', 'bind b', 'unbind b']);
	});

	it('watches direct children only', async () => {
		document.body.innerHTML = '<div><span></span></div>';
		const host = document.querySelector('div')!;
		const log = watch(host);
		host.querySelector('span')!.append(document.createElement('input'));
		await flush();
		expect(log).toEqual([]);
	});
});
