import { deepStrictEqual, match, ok, rejects, strictEqual, throws } from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import type { Ask, Choice } from './ask.ts';
import { Cancelled } from './errors.ts';
import { detectSettings } from './settings.ts';
import { addSpecifiers } from './add-command.ts';
import { insertImports, relativeSpecifier } from './entry.ts';
import { closest, loadManifest, type Manifest, type ManifestComponent } from './manifest.ts';
import { renderTemplate } from './template.ts';
import { runTheme, type Context, type ThemeArgs } from './theme-command.ts';
import { categoryChoices, parseCategories, parseScopes, renderTheme, scopeChoices } from './theme.ts';

const fixture: Manifest = {
	schema: 1,
	categories: ['shape', 'paint'],
	components: {
		chip: {
			selector: ':where([interop-chip])',
			host: { kind: 'any-element', attribute: 'interop-chip' },
			elements: {},
			axes: { variant: { attribute: 'itx-variant', values: ['loud', 'quiet'] } },
			modifiers: {},
			themeable: true,
			stylesheets: ['properties.css', 'structure.css', 'base.css'],
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
		hidden: { selector: ':where([hidden])', host: { kind: 'any-element', attribute: 'itx-hidden' }, elements: {}, axes: {}, modifiers: {}, themeable: false, stylesheets: ['structure.css'], states: [], tokens: [], scopes: [] },
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
			note: quiet,
			async confirm(message: string) {
				asked.push(message);
				return true;
			},
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
		deepStrictEqual(ctx.lines, ['Wrote interop.project.json', 'Wrote src/interop/chip/theme.css']);
		ok((await readFile(join(ctx.cwd, 'src/interop/chip/theme.css'), 'utf8')).includes('@layer interop.default.theme'));
	});

	it('asks for each missing answer when a terminal is attached', async () => {
		const ask = scripted();
		const ctx = await context(ask);
		await runTheme(args, ctx);
		deepStrictEqual(ask.asked, ['Use these settings?', 'Component', 'Categories', 'Scopes']);
		ok(existsSync(join(ctx.cwd, 'src/interop/chip/theme.css')));
	});

	it('skips a question its flag answers', async () => {
		const ask = scripted();
		await runTheme({ ...args, component: 'chip', categories: ['paint'] }, await context(ask));
		deepStrictEqual(ask.asked, ['Use these settings?', 'Scopes']);
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

	it('asks nothing about settings once interop.project.json exists', async () => {
		const ask = scripted();
		const ctx = await context(ask);
		await writeFile(join(ctx.cwd, 'interop.project.json'), '{}');
		await runTheme({ ...args, component: 'chip', categories: ['paint'], scopes: ['default'] }, ctx);
		deepStrictEqual(ask.asked, []);
	});

	it('writes nothing when the detected settings are declined', async () => {
		const ask = { ...scripted(), confirm: async () => false };
		const ctx = await context(ask);
		await rejects(runTheme({ ...args, component: 'chip' }, ctx), Cancelled);
		ok(!existsSync(join(ctx.cwd, 'interop.project.json')));
		ok(!existsSync(join(ctx.cwd, 'src')));
	});

	it('records the detected settings, not the flags given for one run', async () => {
		const ctx = await context();
		await runTheme({ ...args, component: 'chip', styles: 'scss' }, ctx);
		const recorded = JSON.parse(await readFile(join(ctx.cwd, 'interop.project.json'), 'utf8'));
		strictEqual(recorded.styles, 'css');
		ok(existsSync(join(ctx.cwd, 'src/interop/chip/theme.scss')));
	});

	it('writes no settings file on --dry-run', async () => {
		const ctx = await context();
		await runTheme({ ...args, component: 'chip', dryRun: true }, ctx);
		deepStrictEqual(ctx.lines, ['Would write interop.project.json', 'Would write src/interop/chip/theme.css']);
		ok(!existsSync(join(ctx.cwd, 'interop.project.json')));
	});

	it('rejects a style language it does not write', async () => {
		await rejects(runTheme({ ...args, component: 'chip', styles: 'less' }, await context()), /--styles must be css or scss/);
	});
});

describe('insertImports', () => {
	it('starts an empty entry with the imports', () => {
		deepStrictEqual(insertImports('', ['a.css', 'b.css']), {
			text: "@import 'a.css';\n@import 'b.css';\n",
			added: ['a.css', 'b.css'],
		});
	});

	it('goes after the last import at the top', () => {
		const text = "@import 'x.css';\n@import 'y.css';\n\nbody { margin: 0; }\n";
		strictEqual(
			insertImports(text, ['a.css']).text,
			"@import 'x.css';\n@import 'y.css';\n@import 'a.css';\n\nbody { margin: 0; }\n",
		);
	});

	it('goes after leading comments and @layer statements, ahead of the first rule', () => {
		const text = '/* Project styles.\n   Second line. */\n@layer app;\nbody { margin: 0; }\n';
		strictEqual(
			insertImports(text, ['a.css']).text,
			"/* Project styles.\n   Second line. */\n@layer app;\n\n@import 'a.css';\n\nbody { margin: 0; }\n",
		);
	});

	it('keeps a comment with the rule directly under it', () => {
		const text = '/* File header. */\n\n/* About the root rule. */\n:root { color: red; }\n';
		strictEqual(
			insertImports(text, ['a.css']).text,
			"/* File header. */\n\n@import 'a.css';\n\n/* About the root rule. */\n:root { color: red; }\n",
		);
	});

	it('skips a specifier already imported, in either quote style or url()', () => {
		const text = '@import "a.css";\n@import url(\'b.css\');\n';
		deepStrictEqual(insertImports(text, ['a.css', 'b.css', 'c.css']).added, ['c.css']);
	});

	it('changes nothing when every import is there', () => {
		const text = "@import 'a.css';\nbody {}\n";
		deepStrictEqual(insertImports(text, ['a.css']), { text, added: [] });
	});

	it('writes a theme specifier relative to the entry', () => {
		strictEqual(relativeSpecifier('src/styles.css', 'src/interop/button/theme.css'), './interop/button/theme.css');
		strictEqual(relativeSpecifier('styles/main.css', 'src/interop/button/theme.css'), '../src/interop/button/theme.css');
	});
});

describe('renderTemplate', () => {
	const component = (overrides: Partial<ManifestComponent>): ManifestComponent => ({
		...chip,
		axes: {},
		modifiers: {},
		...overrides,
	});
	const markup = (text: string) => text.slice(text.indexOf('-->') + 4);

	it('puts the identity attribute on an HTML host, with an optional element commented out', () => {
		const text = renderTemplate(
			'button',
			component({
				selector: ':where(button[interop-button])',
				host: { kind: 'element', element: 'button', attribute: 'interop-button' },
				elements: { icon: { attribute: 'interop-icon', relation: 'child', tag: 'svg', optional: true } },
			}),
		);
		strictEqual(markup(text), '<button interop-button>\n\t<!-- <svg interop-icon></svg> -->\n</button>\n');
	});

	it('writes a custom element on its own, noting the attribute form', () => {
		const text = renderTemplate(
			'toolbar-section',
			component({
				host: { kind: 'custom-element', element: 'interop-toolbar-section', attribute: 'interop-toolbar-section' },
				elements: {},
			}),
		);
		strictEqual(markup(text), '<interop-toolbar-section></interop-toolbar-section>\n');
		ok(text.includes('interop-toolbar-section also works as an attribute on any element.'));
	});

	it('puts an any-element attribute on a stand-in div, with modifiers as attributes', () => {
		const text = renderTemplate(
			'chip',
			component({
				elements: { mark: { attribute: 'interop-chip-mark', relation: 'child', tag: 'span', optional: false } },
				axes: { variant: { attribute: 'itx-variant', values: ['loud', 'quiet'] } },
				modifiers: { dot: { selector: ':where([interop-chip])[interop-chip=""]' } },
			}),
		);
		strictEqual(markup(text), '<div interop-chip>\n\t<span interop-chip-mark></span>\n</div>\n');
		ok(text.includes('goes on the element it decorates. The div stands in for it.'));
		ok(text.includes('variant: itx-variant="loud | quiet"'));
		ok(text.includes('dot: interop-chip=""'));
	});

	it('writes a void host without children', () => {
		const text = renderTemplate('field', component({ host: { kind: 'element', element: 'input', attribute: 'interop-field' } }));
		strictEqual(markup(text), '<input interop-field>\n');
	});
});

describe('addSpecifiers', () => {
	it('puts layers.css first, then each component in cascade order', () => {
		deepStrictEqual(addSpecifiers(fixture, ['hidden', 'chip']), [
			'interop/layers.css',
			'interop/hidden/structure.css',
			'interop/chip/properties.css',
			'interop/chip/structure.css',
			'interop/chip/base.css',
		]);
	});
});

describe('detectSettings', () => {
	async function project(files: Record<string, string>): Promise<string> {
		const root = await mkdtemp(join(tmpdir(), 'interop-'));
		for (const [path, text] of Object.entries(files)) {
			await mkdir(dirname(join(root, path)), { recursive: true });
			await writeFile(join(root, path), text);
		}
		return root;
	}

	it('defaults an empty directory to plain HTML and CSS', async () => {
		deepStrictEqual(await detectSettings(await project({})), {
			script: 'js',
			styles: 'css',
			framework: 'html',
			out: 'src/interop',
			stylesEntry: 'src/styles.css',
		});
	});

	it('reads an Angular workspace: framework, styles entry, and SCSS', async () => {
		const root = await project({
			'package.json': JSON.stringify({ dependencies: { '@angular/core': '^21.0.0' } }),
			'tsconfig.json': '{}',
			'angular.json': JSON.stringify({
				projects: { app: { architect: { build: { options: { styles: ['src/global.scss'] } } } } },
			}),
		});
		deepStrictEqual(await detectSettings(root), {
			script: 'ts',
			styles: 'scss',
			framework: 'angular',
			out: 'src/interop',
			stylesEntry: 'src/global.scss',
		});
	});

	it('takes SCSS from a sass dependency', async () => {
		const root = await project({ 'package.json': JSON.stringify({ devDependencies: { sass: '^1.0.0' } }) });
		const { styles, stylesEntry } = await detectSettings(root);
		strictEqual(styles, 'scss');
		strictEqual(stylesEntry, 'src/styles.scss');
	});

	it('keeps an existing CSS entry when the project also uses sass', async () => {
		const root = await project({
			'package.json': JSON.stringify({ devDependencies: { sass: '^1.0.0' } }),
			'src/styles.css': '',
		});
		strictEqual((await detectSettings(root)).stylesEntry, 'src/styles.css');
	});

	it('finds src/styles.scss', async () => {
		strictEqual((await detectSettings(await project({ 'src/styles.scss': '' }))).stylesEntry, 'src/styles.scss');
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
		const { status, stderr } = await interop('new', 'rating');
		strictEqual(status, 2);
		match(stderr, /not built yet/);
	});

	it('adds a component, then imports its theme', async () => {
		const { cwd, status } = await interop('add', 'button', 'visually-hidden', '--theme');
		strictEqual(status, 0);
		strictEqual(
			await readFile(join(cwd, 'src/styles.css'), 'utf8'),
			[
				"@import 'interop/layers.css';",
				"@import 'interop/button/properties.css';",
				"@import 'interop/button/structure.css';",
				"@import 'interop/button/base.css';",
				"@import 'interop/visually-hidden/structure.css';",
				"@import './interop/button/theme.css';",
				'',
			].join('\n'),
		);
		ok(existsSync(join(cwd, 'src/interop/button/theme.css')));
		ok(!existsSync(join(cwd, 'src/interop/visually-hidden')));
	});

	it('imports a theme written after its component was added', async () => {
		const { cwd } = await interop('add', 'button');
		const result = run(cwd, ['theme', 'button']);
		strictEqual(result.status, 0);
		match(result.stdout, /Imported it in src\/styles\.css/);
		match(await readFile(join(cwd, 'src/styles.css'), 'utf8'), /@import '\.\/interop\/button\/theme\.css';\n$/);
	});

	it('leaves the entry alone for a theme whose component is not added', async () => {
		const { cwd } = await interop('theme', 'button');
		ok(!existsSync(join(cwd, 'src/styles.css')));
	});

	it('adds nothing twice', async () => {
		const { cwd } = await interop('add', 'button');
		const before = await readFile(join(cwd, 'src/styles.css'), 'utf8');
		const again = run(cwd, ['add', 'button']);
		strictEqual(again.status, 0);
		match(again.stdout, /already imports button/);
		strictEqual(await readFile(join(cwd, 'src/styles.css'), 'utf8'), before);
	});

	it('refuses --theme over an existing theme before touching the entry', async () => {
		const { cwd } = await interop('theme', 'button');
		const result = run(cwd, ['add', 'button', '--theme']);
		strictEqual(result.status, 1);
		ok(!existsSync(join(cwd, 'src/styles.css')));
	});

	it('writes nothing on add --dry-run', async () => {
		const { cwd, status, stdout } = await interop('add', 'button', '--dry-run');
		strictEqual(status, 0);
		match(stdout, /Would add to src\/styles\.css:\n  @import 'interop\/layers\.css';/);
		ok(!existsSync(join(cwd, 'src/styles.css')));
	});

	it('writes a template starter', async () => {
		const { cwd, status, stdout } = await interop('template', 'button');
		strictEqual(status, 0);
		match(stdout, /Wrote src\/interop\/button\/template\.html/);
		const text = await readFile(join(cwd, 'src/interop/button/template.html'), 'utf8');
		ok(text.includes('<button interop-button>\n\t<!-- <svg interop-icon></svg> -->\n</button>'));
		strictEqual(run(cwd, ['template', 'button']).status, 1);
	});

	it('exits 1 on a template for a component that is not themeable', async () => {
		strictEqual((await interop('template', 'visually-hidden')).status, 1);
	});

	it('adds a component with a template starter', async () => {
		const { cwd, status } = await interop('add', 'badge', '--template');
		strictEqual(status, 0);
		ok(existsSync(join(cwd, 'src/interop/badge/template.html')));
		ok(!existsSync(join(cwd, 'src/interop/badge/theme.css')));
	});

	it('refuses --template over an existing template before touching the entry', async () => {
		const { cwd } = await interop('template', 'badge');
		strictEqual(run(cwd, ['add', 'badge', '--template']).status, 1);
		ok(!existsSync(join(cwd, 'src/styles.css')));
	});

	it('exits 2 on add with no component and no terminal', async () => {
		strictEqual((await interop('add')).status, 2);
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

	it('runs through a symlinked bin, as npx runs it', async () => {
		const cwd = await mkdtemp(join(tmpdir(), 'interop-'));
		const bin = join(cwd, 'interop');
		await symlink(main, bin);
		const result = spawnSync(process.execPath, [bin, '--version'], { cwd, encoding: 'utf8' });
		strictEqual(result.stdout.trim(), '0.0.0');
	});

	it('loads the real manifest', async () => {
		ok((await loadManifest()).components.button?.scopes.length);
	});
});
