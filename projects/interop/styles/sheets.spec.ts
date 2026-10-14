import { bundle, sheets } from './sheets';

describe('stylesheet list', () => {
	const imported = [...bundle.matchAll(/@import "\.\/([^"]+)";/g)].map(([, path]) => path);

	it('lists every stylesheet interop.css imports, so every guard can reach it', () => {
		expect(imported.filter((path) => !(path in sheets))).toEqual([]);
	});

	it('lists nothing interop.css does not import, except the opt-in reset', () => {
		expect(Object.keys(sheets).filter((path) => !imported.includes(path))).toEqual(['styles/reset.css']);
	});
});
