import { deepStrictEqual, match, ok, strictEqual, throws } from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { build } from '../build.ts';
import { button } from '../blueprints/button.blueprint.ts';
import { lintRoundTrip } from './lint.ts';
import { resolve, type Config } from './resolve.ts';
import { elementSelector, hostSelector, validate, type Blueprint } from './blueprint.ts';
import { tokenName } from './vocabulary.ts';

const base: Blueprint = {
	name: 'widget',
	host: 'any-element',
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
		strictEqual(scopes.at(-1)?.selector, ':where([interop-widget])[itx-variant="loud"]');
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
				[':where([interop-widget])', ':where([interop-widget])[itx-size="sm"]', ':where([interop-widget])[itx-size="lg"]'],
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

	describe('elements and modifiers', () => {
		const decorated: Blueprint = {
			...base,
			properties: {},
			elements: {
				mark: {
					attribute: 'interop-mark',
					prerequisites: ['position: fixed'],
					properties: { paint: ['background-color'] },
				},
			},
			modifiers: {
				small: { selector: '[small]' },
				left: { selector: '[at="left"]', elements: { mark: ['inset-inline-start: 0'] } },
			},
		};
		const values = { '--itx-widget-mark-background-color': 'red' };

		it('leads an element rule with its prerequisites', () => {
			const { rules } = resolve(decorated, { values });
			deepStrictEqual(rules.find((r) => r.label === 'element: mark')?.declarations, [
				'position: fixed',
				'background-color: var(--itx-widget-mark-background-color)',
			]);
		});

		it('emits a modifier\'s fixed declarations under its selector', () => {
			const { rules } = resolve(decorated, { values });
			deepStrictEqual(rules.find((r) => r.label === 'element: mark — modifier: left'), {
				label: 'element: mark — modifier: left',
				selector: ':where([interop-widget])[at="left"] > :where([interop-mark])',
				declarations: ['inset-inline-start: 0'],
			});
		});

		it('declares a modifier\'s token values in the modifier scope', () => {
			const { scopes } = resolve(decorated, {
				values,
				modifiers: { small: { '--itx-widget-mark-background-color': 'blue' } },
			});
			deepStrictEqual(scopes.at(-1), {
				scope: 'modifier',
				name: 'small',
				label: 'modifier: small',
				selector: ':where([interop-widget])[small]',
				declarations: [{ token: '--itx-widget-mark-background-color', value: 'blue' }],
			});
		});

		it('rejects config for a modifier the blueprint does not declare', () => {
			throws(() => resolve(decorated, { values, modifiers: { large: {} } }), /not a modifier the blueprint declares/);
		});

		it('rejects a modifier naming an element the component does not have', () => {
			match(
				errorsFor({ ...decorated, modifiers: { left: { selector: '[at]', elements: { tail: [] } } } }),
				/names no element of this component/,
			);
		});
	});

	it('drops a disabled category', () => {
		const { tokens } = resolve(base, { disabledCategories: ['paint'] });
		deepStrictEqual(tokens, []);
	});
});

describe('host', () => {
	const named = (host: Blueprint['host'], extra: Partial<Blueprint> = {}): Blueprint => ({
		...base,
		name: 'toolbar-section',
		host,
		...extra,
	});

	it('selects an HTML element by its identity attribute', () => {
		strictEqual(hostSelector(named({ element: 'section' })), ':where(section[interop-toolbar-section])');
	});

	it('selects a custom element and the attribute form together', () => {
		strictEqual(
			hostSelector(named('custom-element')),
			':where(interop-toolbar-section, [interop-toolbar-section])',
		);
	});

	it('selects an any-element host by attribute alone', () => {
		strictEqual(hostSelector(named('any-element')), ':where([interop-toolbar-section])');
	});

	it('takes an explicit identity attribute', () => {
		strictEqual(hostSelector(named('any-element', { attribute: 'itx-toolbar-section' })), ':where([itx-toolbar-section])');
	});

	it('builds child and descendant element selectors', () => {
		strictEqual(elementSelector({ attribute: 'interop-icon', properties: {} }), ' > :where([interop-icon])');
		strictEqual(
			elementSelector({ attribute: 'interop-icon', relation: 'descendant', properties: {} }),
			' :where([interop-icon])',
		);
	});

	it('requires a display for a custom-element host', () => {
		match(errorsFor(named('custom-element')), /needs a display lever or a display prerequisite/);
		ok(validate(named('custom-element', { prerequisites: ['display: block'] })).ok);
	});

	it('rejects an attribute outside the interop- and itx- namespaces', () => {
		match(errorsFor(named('any-element', { attribute: 'data-section' })), /must start interop- or itx-/);
		match(
			errorsFor({ ...base, elements: { mark: { attribute: 'mark', properties: {} } } }),
			/elements\.mark\.attribute: must start interop- or itx-/,
		);
	});

	it('rejects a custom element whose attribute form would differ from its tag', () => {
		match(
			errorsFor(named('custom-element', { attribute: 'itx-toolbar-section', prerequisites: ['display: block'] })),
			/uses interop-toolbar-section for both forms/,
		);
	});

	it('rejects a host that is none of the three kinds', () => {
		match(errorsFor(named('slot' as never)), /must be \{ element/);
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
			'interop.modifier.base',
			'interop.modifier.theme',
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

	it('lists every scope in the manifest with its theme layer and declarations', async () => {
		const { files } = await build(await config());
		const button = JSON.parse(files.get('manifest.json') ?? '{}').components.button;

		deepStrictEqual(
			button.scopes.map((s: { scope: string; name?: string; themeLayer: string }) => [s.scope, s.name, s.themeLayer]),
			[
				['default', undefined, 'interop.default.theme'],
				['variant', 'secondary', 'interop.variant.theme'],
				['variant', 'danger', 'interop.variant.theme'],
				['size', 'sm', 'interop.size.theme'],
				['size', 'lg', 'interop.size.theme'],
			],
		);
	});

	it('describes each host and element in the manifest', async () => {
		const { files } = await build(await config());
		const { components } = JSON.parse(files.get('manifest.json') ?? '{}');
		deepStrictEqual(components.button.host, { kind: 'element', element: 'button', attribute: 'interop-button' });
		deepStrictEqual(components.button.elements.icon, {
			attribute: 'interop-icon',
			relation: 'child',
			tag: 'svg',
			optional: true,
		});
		deepStrictEqual(components.badge.host, { kind: 'any-element', attribute: 'interop-badge' });
		deepStrictEqual(components['visually-hidden'].host, { kind: 'any-element', attribute: 'itx-visually-hidden' });
	});

	it('names the base token on each state token in the manifest', async () => {
		const { files } = await build(await config());
		const tokens = JSON.parse(files.get('manifest.json') ?? '{}').components.button.tokens;
		const hover = tokens.find((t: { name: string }) => t.name === '--itx-button-icon-text-color-hover');
		strictEqual(hover.base, '--itx-button-icon-text-color');
	});
});
