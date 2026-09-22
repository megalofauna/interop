import { deepStrictEqual, match, ok, strictEqual } from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { build } from '../build.ts';
import { button } from '../blueprints/button.blueprint.ts';
import { lintRoundTrip } from './lint.ts';
import { resolve, type Config } from './resolve.ts';
import { validate, type Blueprint } from './blueprint.ts';
import { tokenName } from './vocabulary.ts';

const base: Blueprint = {
	name: 'widget',
	selector: ':where(.widget)',
	themeable: true,
	levers: { paint: ['background-color'] },
};

const errorsFor = (blueprint: Blueprint): string => validate(blueprint).errors.join('\n');

describe('validator', () => {
	it('accepts a minimal blueprint', () => {
		ok(validate(base).ok);
	});

	it('rejects an unknown category', () => {
		const result = validate({ ...base, levers: { surface: ['background-color'] } as never });
		match(errorsFor({ ...base, levers: { surface: [] } as never }), /unknown category/);
		ok(!result.ok);
	});

	it('rejects a lever filed under the wrong category', () => {
		const result = validate({ ...base, levers: { paint: ['border-radius'] } as never });
		ok(!result.ok);
		match(result.errors.join('\n'), /belongs to category "shape"/);
	});

	it('rejects an unthemeable component that declares levers', () => {
		match(errorsFor({ ...base, themeable: false }), /unthemeable component has none/);
	});

	it('rejects an axis whose base is not one of its values', () => {
		match(
			errorsFor({ ...base, variants: { attribute: 'itx-variant', values: ['a', 'b'], base: 'c' } }),
			/is not one of: a, b/,
		);
	});

	it('rejects states with nothing stateful to vary', () => {
		match(
			errorsFor({ ...base, levers: { shape: ['border-radius'] }, states: ['hover'] }),
			/no paint or effect lever exists/,
		);
	});

	it('rejects a lever declared twice', () => {
		match(
			errorsFor({ ...base, levers: { paint: ['background-color', 'background-color'] } }),
			/already declared/,
		);
	});
});

describe('resolve', () => {
	it('reports a base token the config never valued', () => {
		const { missing } = resolve(base, {});
		deepStrictEqual(missing, ['--itx-widget-background-color']);
	});

	it('allows an unset state token', () => {
		const blueprint: Blueprint = { ...base, states: ['hover'] };
		const { missing } = resolve(blueprint, {
			values: { '--itx-widget-background-color': 'red' },
		});
		deepStrictEqual(missing, []);
	});

	it('keeps the axis out of the token name', () => {
		const blueprint: Blueprint = {
			...base,
			variants: { attribute: 'itx-variant', values: ['plain', 'loud'], base: 'plain' },
		};
		const { tokens, scopes } = resolve(blueprint, {
			values: { '--itx-widget-background-color': 'red' },
			variants: { loud: { '--itx-widget-background-color': 'blue' } },
		});

		deepStrictEqual(
			tokens.map((t) => t.name),
			['--itx-widget-background-color'],
		);
		strictEqual(scopes.at(-1)?.selector, ':where(.widget)[itx-variant="loud"]');
	});

	it('omits the base axis value', () => {
		const blueprint: Blueprint = {
			...base,
			variants: { attribute: 'itx-variant', values: ['plain', 'loud'], base: 'plain' },
		};
		const { scopes } = resolve(blueprint, {
			values: { '--itx-widget-background-color': 'red' },
			variants: { plain: { '--itx-widget-background-color': 'red' } },
		});
		ok(!scopes.some((s) => s.label.includes('plain')));
	});

	it('drops a disabled category', () => {
		const { tokens } = resolve(base, { disabledCategories: ['paint'] });
		deepStrictEqual(tokens, []);
	});
});

describe('lint', () => {
	const theme = ':where(.w) {\n\t--itx-w-background-color: red;\n}';

	it('catches a declaration nothing reads', () => {
		const issues = lintRoundTrip('w', 'color: var(--itx-w-text-color);', theme, new Set());
		ok(issues.some((i) => i.kind === 'orphan-declaration'));
	});

	it('catches a base token nothing declares', () => {
		const issues = lintRoundTrip('w', 'color: var(--itx-w-text-color);', theme, new Set());
		ok(issues.some((i) => i.kind === 'undeclared-base-token' && i.token === '--itx-w-text-color'));
	});

	it('ignores upstream tokens the component only points at', () => {
		const issues = lintRoundTrip(
			'w',
			'background-color: var(--itx-w-background-color);',
			':where(.w) {\n\t--itx-w-background-color: var(--itx-color-value);\n}',
			new Set(),
		);
		deepStrictEqual(issues, []);
	});

	it('catches a CSS-wide keyword', () => {
		const issues = lintRoundTrip(
			'w',
			'font-family: var(--itx-w-font-family);',
			':where(.w) {\n\t--itx-w-font-family: inherit;\n}',
			new Set(),
		);
		ok(issues.some((i) => i.kind === 'css-wide-keyword'));
	});
});

describe('build', () => {
	const config = async (): Promise<Config> =>
		JSON.parse(await readFile(new URL('../../interop.config.json', import.meta.url), 'utf8')) as Config;

	it('produces a clean build from the committed config', async () => {
		const { issues, missing } = await build(await config());
		deepStrictEqual(missing, []);
		deepStrictEqual(issues, []);
	});

	it('is idempotent', async () => {
		const a = await build(await config());
		const b = await build(await config());
		deepStrictEqual([...a.files.entries()], [...b.files.entries()]);
	});

	it('never registers a state token', async () => {
		// A registered token always has a valid value, so the fallback would never be reached.
		const { files } = await build(await config());
		const properties = files.get('button/properties.css') ?? '';
		for (const state of ['hover', 'active', 'focus-visible', 'disabled']) {
			ok(
				!properties.includes(`@property ${tokenName({ component: 'button', property: 'background-color', state })}`),
				`${state} token must not be registered`,
			);
		}
	});
});
