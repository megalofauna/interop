/**
 * `interop theme <component>`. Writes `<out>/<component>/theme.<styles>` once; after that the
 * file belongs to the consumer.
 *
 * Inserting the import into `stylesEntry` belongs with `add`, which is not built yet.
 */

import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { Ask } from './ask.ts';
import { CliError } from './errors.ts';
import { closest, type Manifest } from './manifest.ts';
import { readSettings } from './settings.ts';
import { categoryChoices, parseCategories, parseScopes, renderTheme, scopeChoices } from './theme.ts';

export interface ThemeArgs {
	readonly component?: string | undefined;
	readonly categories?: readonly string[] | undefined;
	readonly scopes?: readonly string[] | undefined;
	readonly styles?: string | undefined;
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
	const themeable = Object.keys(manifest.components).filter((n) => manifest.components[n]!.themeable);

	ask?.intro('interop theme');

	let name = args.component;
	if (name === undefined) {
		if (!ask) {
			throw new CliError(`theme needs a component: interop theme <component>. One of: ${themeable.join(', ')}.`, 2);
		}
		name = await ask.select(
			'Component',
			themeable.map((n) => ({ value: n })),
		);
	}

	const component = manifest.components[name];
	if (!component) {
		const suggestion = closest(name, Object.keys(manifest.components));
		throw new CliError(`Unknown component "${name}".${suggestion ? ` Did you mean ${suggestion}?` : ''}`, 1);
	}
	if (!component.themeable) {
		throw new CliError(`${name} is not themeable: it has no tokens. Themeable: ${themeable.join(', ')}.`, 1);
	}

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

	const settings = await readSettings(context.cwd, { styles: args.styles, out: args.out });
	const text = renderTheme(name, component, manifest, { categories, scopes }, settings.styles);
	if (text === null) {
		throw new CliError('No token matches the chosen categories and scopes.', 2);
	}

	const path = join(settings.out, name, `theme.${settings.styles}`);
	const target = join(context.cwd, path);

	if (args.dryRun) {
		report(context, `Would write ${path}`);
		return;
	}
	if (!args.force && (await exists(target))) {
		throw new CliError(`${path} exists. Pass --force to overwrite it.`, 1);
	}

	await mkdir(dirname(target), { recursive: true });
	await writeFile(target, text, 'utf8');

	if (ask) {
		ask.success(`Wrote ${path}`);
		ask.outro('Uncomment a token to change it.');
	} else {
		context.print(`Wrote ${path}`);
	}
}

function report(context: Context, line: string): void {
	if (context.ask) context.ask.outro(line);
	else context.print(line);
}

async function exists(path: string): Promise<boolean> {
	return stat(path).then(
		() => true,
		() => false,
	);
}
