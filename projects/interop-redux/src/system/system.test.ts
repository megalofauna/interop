import { deepStrictEqual, match, ok, strictEqual, throws } from 'node:assert/strict';
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
	properties: { paint: ['background-color'] },
};

const red = { '--itx-widget-background-color': 'red' };

const errorsFor = (blueprint: Blueprint): string => validate(blueprint).errors.join('\n');

describe('validator', () => {
	it('accepts a minimal blueprint', () => {
		ok(validate(base).ok);
	});

	it('rejects an unknown category', () => {
		const result = validate({ ...base, properties: { surface: ['background-color'] } as never });
		match(errorsFor({ ...base, properties: { surface: [] } as never }), /unknown category/);
		ok(!result.ok);
	});

	it('rejects a lever filed under the wrong category', () => {
		const result = validate({ ...base, properties: { paint: ['border-radius'] } as never });
		ok(!result.ok);
		match(result.errors.join('\n'), /belongs to category "shape"/);
	});

	it('rejects an unthemeable component that declares levers', () => {
		match(errorsFor({ ...base, themeable: false }), /unthemeable component has none/);
	});

	it('rejects states with nothing stateful to vary', () => {
		match(
			errorsFor({ ...base, properties: { shape: ['border-radius'] }, states: ['hover'] }),
			/no stateful lever exists/,
		);
	});

	it('rejects a lever declared twice', () => {
		match(
			errorsFor({ ...base, properties: { paint: ['background-color', 'background-color'] } }),
			/already declared/,
		);
	});

	it('rejects sizes without base', () => {
		match(errorsFor({ ...base, sizes: ['sm', 'lg'] }), /must include "base"/);
	});

	it('rejects a cursor on a component with no states', () => {
		match(errorsFor({ ...base, cursor: ['cursor'] }), /cursor: declared on a component with no states/);
	});

	it('rejects the cursor category inside properties', () => {
		match(
			errorsFor({ ...base, properties: { cursor: ['cursor'] } as never }),
			/belongs in the top-level `cursor` field/,
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
		const { missing } = resolve(blueprint, { values: red });
		deepStrictEqual(missing, []);
	});

	it('keeps the axis out of the token name', () => {
		const { tokens, axes, scopes } = resolve(base, {
			values: red,
			variants: { loud: { '--itx-widget-background-color': 'blue' } },
		});

		deepStrictEqual(
			tokens.map((t) => t.name),
			['--itx-widget-background-color'],
		);
		deepStrictEqual(axes, [{ name: 'variant', attribute: 'itx-variant', values: ['loud'] }]);
		strictEqual(scopes.at(-1)?.selector, ':where(.widget)[itx-variant="loud"]');
	});

	it('drops an axis value that redeclares nothing the component has', () => {
		const { axes, scopes } = resolve(base, {
			values: red,
			variants: { big: { '--itx-widget-font-size': '2rem' } },
		});
		deepStrictEqual(axes, []);
		ok(!scopes.some((scope) => scope.label.startsWith('variant:')));
	});

	it('rejects an axis value that is not kebab-case', () => {
		throws(
			() => resolve(base, { values: red, variants: { Loud: {} } }),
			/kebab-case/,
		);
	});

	it('rejects an axis on a component with no tokens to redeclare', () => {
		throws(
			() => resolve({ ...base, themeable: false, properties: {} }, { variants: { loud: {} } }),
			/not themeable/,
		);
	});

	it('varies the stateful levers and leaves the rest alone', () => {
		// Both widths draw a line; only the outline can change width without moving anything.
		const blueprint: Blueprint = {
			...base,
			properties: { border: ['border-width'], outline: ['outline-width'] },
			states: ['focus-visible'],
		};
		const { rules } = resolve(blueprint, {
			values: { '--itx-widget-border-width': '1px', '--itx-widget-outline-width': '0' },
		});

		deepStrictEqual(rules.find((r) => r.label === 'focus-visible')?.declarations, [
			'outline-width: var(--itx-widget-outline-width-focus-visible, var(--itx-widget-outline-width))',
		]);
	});

	it('leads the rule with prerequisites, then the declarations its levers require', () => {
		const blueprint: Blueprint = {
			...base,
			prerequisites: ['box-sizing: border-box'],
			properties: { border: ['border-width'], outline: ['outline-width'] },
		};
		const { rules } = resolve(blueprint, {
			values: { '--itx-widget-border-width': '1px', '--itx-widget-outline-width': '0' },
		});
		const declarations = rules.find((r) => r.label === 'base')?.declarations ?? [];

		deepStrictEqual(declarations, [
			'box-sizing: border-box',
			'border-style: solid',
			'outline-style: solid',
			'border-width: var(--itx-widget-border-width)',
			'outline-width: var(--itx-widget-outline-width)',
		]);
	});

	it('skips a required declaration an active lever already sets', () => {
		const blueprint: Blueprint = { ...base, properties: { border: ['border-width', 'border-style'] } };
		const { rules } = resolve(blueprint, {
			values: { '--itx-widget-border-width': '1px', '--itx-widget-border-style': 'dashed' },
		});

		deepStrictEqual(rules.find((r) => r.label === 'base')?.declarations, [
			'border-width: var(--itx-widget-border-width)',
			'border-style: var(--itx-widget-border-style)',
		]);
	});

	it('reads the cursor under each state, falling through to the base', () => {
		const blueprint: Blueprint = { ...base, states: ['disabled'], cursor: ['cursor'] };
		const { rules, tokens } = resolve(blueprint, {
			values: { ...red, '--itx-widget-cursor': 'pointer' },
		});

		strictEqual(tokens.find((t) => t.name === '--itx-widget-cursor')?.category, 'cursor');
		ok(rules.find((r) => r.label === 'base')?.declarations.includes('cursor: var(--itx-widget-cursor)'));
		ok(
			rules
				.find((r) => r.label === 'disabled')
				?.declarations.includes('cursor: var(--itx-widget-cursor-disabled, var(--itx-widget-cursor))'),
		);
	});

	describe('sizes', () => {
		const sizable: Blueprint = { ...base, properties: { type: ['font-size'] }, sizes: ['sm', 'base', 'lg'] };
		const values = { '--itx-widget-font-size': '1rem' };
		const sm = { '--itx-widget-font-size': '0.875rem' };
		const lg = { '--itx-widget-font-size': '1.25rem' };

		it('takes the values from the blueprint, with base as the default', () => {
			const { axes } = resolve(sizable, { values, sizes: { sm, lg } });
			deepStrictEqual(axes, [
				{ name: 'size', attribute: 'itx-size', values: ['sm', 'base', 'lg'], default: 'base' },
			]);
		});

		it('emits no scope for base', () => {
			const { scopes } = resolve(sizable, { values, sizes: { sm, lg } });
			deepStrictEqual(
				scopes.map((scope) => scope.selector),
				[':where(.widget)', ':where(.widget)[itx-size="sm"]', ':where(.widget)[itx-size="lg"]'],
			);
		});

		it('reports a blueprint size the config gives no entry', () => {
			const { missing } = resolve(sizable, { values, sizes: { sm } });
			deepStrictEqual(missing, ['sizes.lg']);
		});

		it('rejects a config size the blueprint does not list', () => {
			throws(() => resolve(sizable, { values, sizes: { sm, lg, xl: lg } }), /not a size the blueprint lists/);
		});

		it('rejects config values for base', () => {
			throws(() => resolve(sizable, { values, sizes: { sm, lg, base: sm } }), /takes the base values/);
		});

		it('rejects config sizes for a component that is not sizable', () => {
			throws(() => resolve(base, { values: red, sizes: { sm: {} } }), /the blueprint lists none/);
		});
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

	it('orders layers by scope, then owner', async () => {
		const { files } = await build(await config());
		const order = (files.get('layers.css') ?? '').match(/interop\.[a-z.]+/g);
		deepStrictEqual(order, [
			'interop.structure',
			'interop.default.base',
			'interop.default.theme',
			'interop.variant.base',
			'interop.variant.theme',
			'interop.size.base',
			'interop.size.theme',
		]);
	});

	it('declares each scope in its own layer', async () => {
		const { files } = await build(await config());
		const base = files.get('button/base.css') ?? '';
		match(base, /@layer interop\.default\.base \{\n\t\/\* base \*\//);
		match(base, /@layer interop\.variant\.base \{\n\t\/\* variant: secondary \*\//);
		match(base, /@layer interop\.size\.base \{\n\t\/\* size: sm \*\//);
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
