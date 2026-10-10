/**
 * `interop theme <component>`. Writes `<out>/<component>/theme.<styles>` once; after that the
 * file belongs to the consumer.
 *
 * The theme's import goes into `stylesEntry` once the component has been added there.
 */

import { join } from 'node:path';

import type { Ask } from './ask.ts';
import { CliError } from './errors.ts';
import { chooseThemeable } from './choose.ts';
import type { Manifest } from './manifest.ts';
import { imports, insertImports, readEntry, relativeSpecifier, writeEntry } from './entry.ts';
import { PACKAGE } from './package.ts';
import { loadSettings, type Settings } from './settings.ts';
import { report, writeStarter } from './starter.ts';
import { categoryChoices, parseCategories, parseScopes, renderTheme, scopeChoices, type ThemeSelection } from './theme.ts';

export interface ThemeArgs {
	readonly component?: string | undefined;
	readonly categories?: readonly string[] | undefined;
	readonly scopes?: readonly string[] | undefined;
	readonly script?: string | undefined;
	readonly styles?: string | undefined;
	readonly framework?: string | undefined;
	readonly out?: string | undefined;
	readonly dryRun: boolean;
	readonly force: boolean;
}

export interface Context {
	readonly cwd: string;
	readonly manifest: Manifest;
	/** Present when a terminal is attached and `--yes` was not given. */
	readonly ask?: Ask | undefined;
	readonly print: (line: string) => void;
}

export async function runTheme(args: ThemeArgs, context: Context): Promise<void> {
	const { manifest, ask } = context;
	ask?.intro('interop theme');

	const settings = await loadSettings(
		context.cwd,
		{ script: args.script, styles: args.styles, framework: args.framework, out: args.out },
		{ ask, dryRun: args.dryRun, print: context.print },
	);

	const { name, component } = await chooseThemeable('theme', args.component, manifest, ask);

	const allCategories = categoryChoices(manifest, component);
	const categories = args.categories
		? parseCategories(args.categories, manifest, component)
		: ask
			? await ask.multiselect(
					'Categories',
					allCategories.map((c) => ({ value: c })),
					allCategories,
				)
			: allCategories;

	const allScopes = scopeChoices(component);
	const scopes = args.scopes
		? parseScopes(args.scopes, component)
		: ask && allScopes.length > 1
			? await ask.multiselect(
					'Scopes',
					allScopes.map((s) => ({ value: s.id, label: s.label })),
					allScopes.map((s) => s.id),
				)
			: allScopes.map((s) => s.id);

	await writeTheme(name, { categories, scopes }, settings, args, context);
	ask?.outro(args.dryRun ? 'Nothing was written.' : 'Uncomment a token to change it.');
}

/**
 * Writes the theme file, then imports it from the styles entry if the component has been
 * added there. Used by `theme`, and by `add --theme`.
 */
export async function writeTheme(
	name: string,
	selection: ThemeSelection,
	settings: Settings,
	args: { readonly dryRun: boolean; readonly force: boolean },
	context: Context,
): Promise<void> {
	const component = context.manifest.components[name]!;
	const text = renderTheme(name, component, context.manifest, selection, settings.styles);
	if (text === null) {
		throw new CliError('No token matches the chosen categories and scopes.', 2);
	}

	const path = themePath(name, settings);
	await writeStarter(path, text, args, context);

	const entry = await readEntry(context.cwd, settings.stylesEntry);
	const added = entry !== null && component.stylesheets.some((file) => imports(entry, `${PACKAGE}/${name}/${file}`));
	if (!added) return;

	const insertion = insertImports(entry, [relativeSpecifier(settings.stylesEntry, path)]);
	if (insertion.added.length === 0) return;
	if (args.dryRun) {
		report(context, `Would import it in ${settings.stylesEntry}`);
		return;
	}
	await writeEntry(context.cwd, settings.stylesEntry, insertion.text);
	report(context, `Imported it in ${settings.stylesEntry}`);
}

export function themePath(name: string, settings: Settings): string {
	return join(settings.out, name, `theme.${settings.styles}`);
}
