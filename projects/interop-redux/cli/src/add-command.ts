/**
 * `interop add <component>...`. Inserts each component's stylesheet imports into
 * `stylesEntry`, `layers.css` first and once. Changes nothing in the package.
 */

import type { Ask } from './ask.ts';
import { insertImports, readEntry, writeEntry } from './entry.ts';
import { CliError } from './errors.ts';
import { closest, type Manifest } from './manifest.ts';
import { PACKAGE } from './package.ts';
import { loadSettings } from './settings.ts';
import { categoryChoices, scopeChoices } from './theme.ts';
import { blocked, report, writeStarter } from './starter.ts';
import { renderTemplate } from './template.ts';
import { templatePath } from './template-command.ts';
import { themePath, writeTheme, type Context } from './theme-command.ts';

export interface AddArgs {
	readonly components: readonly string[];
	readonly theme: boolean;
	readonly template: boolean;
	readonly script?: string | undefined;
	readonly styles?: string | undefined;
	readonly framework?: string | undefined;
	readonly out?: string | undefined;
	readonly dryRun: boolean;
	readonly force: boolean;
}

/** The imports for the named components, in cascade order. */
export function addSpecifiers(manifest: Manifest, names: readonly string[]): string[] {
	return [
		`${PACKAGE}/layers.css`,
		...names.flatMap((name) => manifest.components[name]!.stylesheets.map((file) => `${PACKAGE}/${name}/${file}`)),
	];
}

export async function runAdd(args: AddArgs, context: Context): Promise<void> {
	const { manifest, ask } = context;
	const all = Object.keys(manifest.components);

	ask?.intro('interop add');

	const settings = await loadSettings(
		context.cwd,
		{ script: args.script, styles: args.styles, framework: args.framework, out: args.out },
		{ ask, dryRun: args.dryRun, print: context.print },
	);

	let names = [...args.components];
	if (names.length === 0) {
		if (!ask) throw new CliError(`add needs at least one component. One of: ${all.join(', ')}.`, 2);
		names = await pick(ask, all);
	}
	for (const name of names) {
		if (manifest.components[name]) continue;
		const suggestion = closest(name, all);
		throw new CliError(`Unknown component "${name}".${suggestion ? ` Did you mean ${suggestion}?` : ''}`, 1);
	}

	const themeable = names.filter((name) => manifest.components[name]!.themeable);
	const offer = async (flag: boolean, question: string) =>
		flag || (ask !== undefined && themeable.length > 0 && (await ask.confirm(question, false)));
	const theme = await offer(args.theme, 'Then create a theme?');
	const template = await offer(args.template, 'Then create a template starter?');

	// Check before writing anything, so a refusal leaves the project as it was.
	const starters = [
		...(theme ? themeable.map((name) => themePath(name, settings)) : []),
		...(template ? themeable.map((name) => templatePath(name, settings)) : []),
	];
	const existing = await blocked(starters, args, context.cwd);
	if (existing.length > 0) {
		throw new CliError(`${existing.join(', ')} exists. Pass --force to overwrite, or leave out --theme and --template.`, 1);
	}

	const entry = (await readEntry(context.cwd, settings.stylesEntry)) ?? '';
	const insertion = insertImports(entry, addSpecifiers(manifest, names));

	if (insertion.added.length === 0) {
		report(context, `${settings.stylesEntry} already imports ${names.join(', ')}.`);
	} else if (args.dryRun) {
		report(context, `Would add to ${settings.stylesEntry}:\n${insertion.added.map((s) => `  @import '${s}';`).join('\n')}`);
	} else {
		await writeEntry(context.cwd, settings.stylesEntry, insertion.text);
		report(context, `Added ${insertion.added.length} imports to ${settings.stylesEntry}`);
	}

	if (theme) {
		for (const name of themeable) {
			const component = manifest.components[name]!;
			const selection = {
				categories: categoryChoices(manifest, component),
				scopes: scopeChoices(component).map((s) => s.id),
			};
			await writeTheme(name, selection, settings, args, context);
		}
	}
	if (template) {
		for (const name of themeable) {
			await writeStarter(templatePath(name, settings), renderTemplate(name, manifest.components[name]!), args, context);
		}
	}

	ask?.outro(args.dryRun ? 'Nothing was written.' : 'Done.');
}

async function pick(ask: Ask, all: readonly string[]): Promise<string[]> {
	return ask.multiselect(
		'Components',
		all.map((value) => ({ value })),
		[],
	);
}
