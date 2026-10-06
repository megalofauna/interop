import { deepStrictEqual, match, ok, rejects, strictEqual, throws } from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import type { Ask, Choice } from './ask.ts';
import { closest, loadManifest, type Manifest } from './manifest.ts';
import { runTheme, type Context, type ThemeArgs } from './theme-command.ts';
import { categoryChoices, parseCategories, parseScopes, renderTheme, scopeChoices } from './theme.ts';

const fixture: Manifest = {
	schema: 1,
	categories: ['shape', 'paint'],
	components: {
		chip: {
			selector: ':where([interop-chip])',
			themeable: true,
			states: ['hover'],
			tokens: [
				{ name: '--itx-chip-border-radius', category: 'shape', type: 'length', syntax: '<length>', description: '', value: '4px' },
				{ name: '--itx-chip-background-color', category: 'paint', type: 'color', syntax: '<color>', description: '', value: 'white' },
				{
					name: '--itx-chip-background-color-hover',
					category: 'paint',
					type: 'color',
					syntax: '<color>',
					description: '',
					state: 'hover',
					base: '--itx-chip-background-color',
					value: 'gray',
				},
				{ name: '--itx-chip-text-color', category: 'paint', type: 'color', syntax: '<color>', description: '', value: 'black' },
				{
					name: '--itx-chip-text-color-hover',
					category: 'paint',
					type: 'color',
					syntax: '<color>',
					description: '',
					state: 'hover',
					base: '--itx-chip-text-color',
				},
			],
			scopes: [
				{
					scope: 'default',
					selector: ':where([interop-chip])',
					themeLayer: 'interop.default.theme',
					declarations: [
						{ token: '--itx-chip-border-radius', value: '4px' },
						{ token: '--itx-chip-background-color', value: 'white' },
						{ token: '--itx-chip-background-color-hover', value: 'gray' },
						{ token: '--itx-chip-text-color', value: 'black' },
					],
				},
				{
					scope: 'variant',
					name: 'loud',
					selector: ':where([interop-chip])[itx-variant="loud"]',
					themeLayer: 'interop.variant.theme',
					declarations: [{ token: '--itx-chip-background-color', value: 'red' }],
				},
				{
					scope: 'variant',
					name: 'quiet',
					selector: ':where([interop-chip])[itx-variant="quiet"]',
					themeLayer: 'interop.variant.theme',
					declarations: [{ token: '--itx-chip-text-color-hover', value: 'silver' }],
				},
			],
		},
		hidden: { selector: ':where([hidden])', themeable: false, states: [], tokens: [], scopes: [] },
	},
};

const chip = fixture.components.chip!;
const everything = { categories: ['shape', 'paint'], scopes: ['default', 'variant:loud', 'variant:quiet'] };
const render = (selection = everything, styles: 'css' | 'scss' = 'css') =>
	renderTheme('chip', chip, fixture, selection, styles) ?? '';

/** The commented lines of one scope's block, label included. */
function block(text: string, label: string): string[] {
	const lines = text.split('\n');
	const start = lines.findIndex((line) => line.trim() === `/* ${label} */`);
	const end = lines.findIndex((line, i) => i > start && line === '\t}');
	return lines.slice(start, end).map((line) => line.trim()).filter((line) => line.startsWith('/*'));
}

describe('renderTheme', () => {
	it('lists every base token in the default scope, each followed by its state tokens', () => {
		deepStrictEqual(block(render(), 'default'), [
			'/* default */',
			'/* shape */',
			'/* --itx-chip-border-radius: 4px; */',
			'/* paint */',
			'/* --itx-chip-background-color: white; */',
			'/* --itx-chip-background-color-hover: gray; */',
			'/* --itx-chip-text-color: black; */',
			'/* --itx-chip-text-color-hover: var(--itx-chip-text-color); */',
		]);
	});

	it('lists only what a scope sets, with state tokens taking the default scope value', () => {
		deepStrictEqual(block(render(), 'variant: loud'), [
			'/* variant: loud */',
			'/* paint */',
			'/* --itx-chip-background-color: red; */',
			'/* --itx-chip-background-color-hover: gray; */',
		]);
	});

	it('lists the base of a state token a scope sets', () => {
		deepStrictEqual(block(render(), 'variant: quiet'), [
			'/* variant: quiet */',
			'/* paint */',
			'/* --itx-chip-text-color: black; */',
			'/* --itx-chip-text-color-hover: silver; */',
		]);
	});

	it('puts each scope in its theme layer, in manifest order', () => {
		const layers = [...render().matchAll(/^@layer (\S+) \{$/gm)].map((m) => m[1]);
		deepStrictEqual(layers, ['interop.default.theme', 'interop.variant.theme']);
	});

	it('leaves out categories and scopes not selected', () => {
		const text = render({ categories: ['shape'], scopes: ['default'] });
		ok(text.includes('--itx-chip-border-radius'));
		ok(!text.includes('paint'));
		ok(!text.includes('interop.variant.theme'));
	});

	it('returns null when nothing is selected', () => {
		strictEqual(renderTheme('chip', chip, fixture, { categories: ['shape'], scopes: ['variant:loud'] }, 'css'), null);
	});

	it('comments with // in SCSS', () => {
		const text = render(everything, 'scss');
		ok(!text.includes('/*'));
		ok(text.includes('\t\t// --itx-chip-border-radius: 4px;'));
	});
});

describe('selection', () => {
	it('offers the categories the component has, in manifest order', () => {
		deepStrictEqual(categoryChoices(fixture, chip), ['shape', 'paint']);
	});

	it('rejects an unknown category and lists the available ones', () => {
		throws(() => parseCategories(['paint', 'motion'], fixture, chip), /Unknown category motion.*Available: shape, paint/);
	});

	it('expands a bare scope kind to every scope of that kind', () => {
		deepStrictEqual(parseScopes(['variant'], chip), ['variant:loud', 'variant:quiet']);
		deepStrictEqual(parseScopes(['variant:quiet', 'default'], chip), ['default', 'variant:quiet']);
	});

	it('rejects an unknown scope and lists the available ones', () => {
		throws(() => parseScopes(['size:lg'], chip), /Unknown scope size:lg.*Available: default, variant:loud, variant:quiet/);
	});

	it('labels scopes for the prompt', () => {
		deepStrictEqual(scopeChoices(chip).map((s) => s.label), ['default', 'variant: loud', 'variant: quiet']);
	});

	it('suggests the closest component name', () => {
		strictEqual(closest('buton', ['badge', 'button']), 'button');
		strictEqual(closest('slider', ['badge', 'button']), undefined);
	});
});

describe('runTheme', () => {
	const args: ThemeArgs = { dryRun: false, force: false };

	async function context(ask?: Ask): Promise<Context & { lines: string[] }> {
		const lines: string[] = [];
		return { cwd: await mkdtemp(join(tmpdir(), 'interop-')), manifest: fixture, ask, print: (l) => lines.push(l), lines };
	}

	/** Answers every prompt with its first choice, or every preselected choice. */
	function scripted(): Ask & { asked: string[] } {
		const asked: string[] = [];
		const quiet = () => {};
		return {
			asked,
			intro: quiet,
			outro: quiet,
			success: quiet,
			error: quiet,
			async select<T extends string>(message: string, choices: readonly Choice<T>[]) {
				asked.push(message);
				return choices[0]!.value;
			},
			async multiselect<T extends string>(message: string, _choices: readonly Choice<T>[], initial: readonly T[]) {
				asked.push(message);
				return [...initial];
			},
		};
	}

	it('writes the theme under the default out directory', async () => {
		const ctx = await context();
		await runTheme({ ...args, component: 'chip' }, ctx);
		deepStrictEqual(ctx.lines, ['Wrote src/interop/chip/theme.css']);
		ok((await readFile(join(ctx.cwd, 'src/interop/chip/theme.css'), 'utf8')).includes('@layer interop.default.theme'));
	});

	it('asks for each missing answer when a terminal is attached', async () => {
		const ask = scripted();
		const ctx = await context(ask);
		await runTheme(args, ctx);
		deepStrictEqual(ask.asked, ['Component', 'Categories', 'Scopes']);
		ok(existsSync(join(ctx.cwd, 'src/interop/chip/theme.css')));
	});

	it('skips a question its flag answers', async () => {
		const ask = scripted();
		await runTheme({ ...args, component: 'chip', categories: ['paint'] }, await context(ask));
		deepStrictEqual(ask.asked, ['Scopes']);
	});

	it('offers only themeable components', async () => {
		let offered: string[] = [];
		const ask = { ...scripted(), async select<T extends string>(_: string, choices: readonly Choice<T>[]) {
			offered = choices.map((c) => c.value);
			return choices[0]!.value;
		} };
		await runTheme(args, await context(ask));
		deepStrictEqual(offered, ['chip']);
	});

	it('reads styles and out from interop.project.json', async () => {
		const ctx = await context();
		await writeFile(join(ctx.cwd, 'interop.project.json'), JSON.stringify({ styles: 'scss', out: 'styles/ix' }));
		await runTheme({ ...args, component: 'chip' }, ctx);
		ok(existsSync(join(ctx.cwd, 'styles/ix/chip/theme.scss')));
	});

	it('lets a flag override interop.project.json for one run', async () => {
		const ctx = await context();
		await writeFile(join(ctx.cwd, 'interop.project.json'), JSON.stringify({ styles: 'scss' }));
		await runTheme({ ...args, component: 'chip', styles: 'css' }, ctx);
		ok(existsSync(join(ctx.cwd, 'src/interop/chip/theme.css')));
	});

	it('rejects a style language it does not write', async () => {
		await rejects(runTheme({ ...args, component: 'chip', styles: 'less' }, await context()), /--styles must be css or scss/);
	});
});

describe('the interop command', () => {
	const main = fileURLToPath(new URL('./main.ts', import.meta.url));

	async function interop(...argv: string[]) {
		const cwd = await mkdtemp(join(tmpdir(), 'interop-'));
		return { cwd, ...run(cwd, argv) };
	}

	function run(cwd: string, argv: string[]) {
		const result = spawnSync(process.execPath, [main, ...argv], { cwd, encoding: 'utf8' });
		return { status: result.status, stdout: result.stdout, stderr: result.stderr };
	}

	it('writes a theme for a shipped component and exits 0', async () => {
		const { cwd, status, stdout } = await interop('theme', 'button');
		strictEqual(status, 0);
		match(stdout, /Wrote src\/interop\/button\/theme\.css/);
		const text = await readFile(join(cwd, 'src/interop/button/theme.css'), 'utf8');
		ok(text.includes('/* --itx-button-outline-width-focus-visible: 2px; */'));
		ok(text.includes('@layer interop.size.theme'));
	});

	it('exits 1 when the theme exists, and overwrites it with --force', async () => {
		const { cwd } = await interop('theme', 'button');
		const again = run(cwd, ['theme', 'button']);
		strictEqual(again.status, 1);
		match(again.stderr, /exists\. Pass --force/);
		strictEqual(run(cwd, ['theme', 'button', '--force']).status, 0);
	});

	it('writes nothing on --dry-run', async () => {
		const { cwd, status, stdout } = await interop('theme', 'button', '--dry-run');
		strictEqual(status, 0);
		match(stdout, /Would write src\/interop\/button\/theme\.css/);
		ok(!existsSync(join(cwd, 'src')));
	});

	it('exits 1 on an unknown component, with a suggestion', async () => {
		const { status, stderr } = await interop('theme', 'buton');
		strictEqual(status, 1);
		match(stderr, /Did you mean button\?/);
	});

	it('exits 1 on a component that is not themeable', async () => {
		strictEqual((await interop('theme', 'visually-hidden')).status, 1);
	});

	it('exits 2 when a component is needed and there is no terminal', async () => {
		const { status, stderr } = await interop('theme');
		strictEqual(status, 2);
		match(stderr, /One of: badge, button/);
	});

	it('exits 2 on an unknown option', async () => {
		strictEqual((await interop('theme', 'button', '--colour')).status, 2);
	});

	it('exits 2 on a command that is not built', async () => {
		const { status, stderr } = await interop('add', 'button');
		strictEqual(status, 2);
		match(stderr, /not built yet/);
	});

	it('lists the commands with no arguments', async () => {
		const { status, stdout } = await interop();
		strictEqual(status, 0);
		match(stdout, /theme <component>\s+Create a component's theme file\./);
	});

	it('reads a scope list given across flags and commas', async () => {
		const { cwd, status } = await interop('theme', 'button', '--scopes', 'default', '--scopes', 'size:sm,size:lg');
		strictEqual(status, 0);
		const text = await readFile(join(cwd, 'src/interop/button/theme.css'), 'utf8');
		ok(!text.includes('interop.variant.theme'));
		ok(text.includes('/* size: lg */'));
	});

	it('loads the real manifest', async () => {
		ok((await loadManifest()).components.button?.scopes.length);
	});
});
