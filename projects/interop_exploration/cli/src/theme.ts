/**
 * The theme file: every token a component has, commented out, with its current value, in the
 * scopes and layers `base.css` uses.
 */

import { CliError } from './errors.ts';
import type { Manifest, ManifestComponent, ManifestScope, ManifestToken } from './manifest.ts';
import type { Styles } from './settings.ts';

export interface ThemeSelection {
	/** Category names. */
	readonly categories: readonly string[];
	/** Scope ids: `default`, `variant:danger`, `modifier:dot`. */
	readonly scopes: readonly string[];
}

export interface ScopeChoice {
	readonly id: string;
	readonly label: string;
}

export function scopeId(scope: ManifestScope): string {
	return scope.name ? `${scope.scope}:${scope.name}` : scope.scope;
}

function scopeLabel(scope: ManifestScope): string {
	return scope.name ? `${scope.scope}: ${scope.name}` : scope.scope;
}

export function scopeChoices(component: ManifestComponent): ScopeChoice[] {
	return component.scopes.map((scope) => ({ id: scopeId(scope), label: scopeLabel(scope) }));
}

/** The categories the component has tokens in, in manifest order. */
export function categoryChoices(manifest: Manifest, component: ManifestComponent): string[] {
	const present = new Set(component.tokens.map((t) => t.category));
	return manifest.categories.filter((category) => present.has(category));
}

/** Validates `--categories` names. */
export function parseCategories(
	requested: readonly string[],
	manifest: Manifest,
	component: ManifestComponent,
): string[] {
	const available = categoryChoices(manifest, component);
	const unknown = requested.filter((category) => !available.includes(category));
	if (unknown.length > 0) {
		throw new CliError(
			`Unknown categor${unknown.length > 1 ? 'ies' : 'y'} ${unknown.join(', ')} for --categories. ` +
				`Available: ${available.join(', ')}.`,
			2,
		);
	}
	return available.filter((category) => requested.includes(category));
}

/** Validates `--scopes` ids. A bare kind, such as `variant`, selects every scope of that kind. */
export function parseScopes(requested: readonly string[], component: ManifestComponent): string[] {
	const ids = component.scopes.map(scopeId);
	const selected = new Set<string>();
	const unknown: string[] = [];

	for (const request of requested) {
		const matches = component.scopes
			.filter((scope) => scopeId(scope) === request || (!request.includes(':') && scope.scope === request))
			.map(scopeId);
		if (matches.length === 0) unknown.push(request);
		for (const id of matches) selected.add(id);
	}

	if (unknown.length > 0) {
		throw new CliError(`Unknown scope ${unknown.join(', ')} for --scopes. Available: ${ids.join(', ')}.`, 2);
	}
	return ids.filter((id) => selected.has(id));
}

/** The file text, or `null` when the selection leaves no token to list. */
export function renderTheme(
	name: string,
	component: ManifestComponent,
	manifest: Manifest,
	selection: ThemeSelection,
	styles: Styles,
): string | null {
	const note = styles === 'scss' ? (text: string) => `// ${text}` : (text: string) => `/* ${text} */`;
	const byName = new Map(component.tokens.map((t) => [t.name, t]));
	const baseTokens = component.tokens.filter((t) => t.base === undefined);
	const statesOf = new Map<string, ManifestToken[]>();
	for (const token of component.tokens) {
		if (token.base) statesOf.set(token.base, [...(statesOf.get(token.base) ?? []), token]);
	}

	const defaults = valuesOf(component.scopes.find((s) => s.scope === 'default'));
	const categories = manifest.categories.filter((c) => selection.categories.includes(c));
	const byLayer = new Map<string, string[]>();

	for (const scope of component.scopes) {
		if (!selection.scopes.includes(scopeId(scope))) continue;

		const declared = valuesOf(scope);
		// A token's current value in this scope: what the scope sets, else what the default
		// scope sets. A state token set by neither falls back to its base.
		const current = (token: ManifestToken): string =>
			declared.get(token.name) ??
			defaults.get(token.name) ??
			(token.base ? `var(${token.base})` : (token.value ?? 'initial'));

		const listed =
			scope.scope === 'default'
				? baseTokens
				: baseTokens.filter((base) =>
						scope.declarations.some((d) => d.token === base.name || byName.get(d.token)?.base === base.name),
					);

		const groups: string[] = [];
		for (const category of categories) {
			const tokens = listed.filter((t) => t.category === category);
			if (tokens.length === 0) continue;
			const lines = [note(category)];
			for (const token of tokens) {
				for (const t of [token, ...(statesOf.get(token.name) ?? [])]) {
					lines.push(note(`${t.name}: ${current(t)};`));
				}
			}
			groups.push(lines.map((line) => `\t\t${line}`).join('\n'));
		}
		if (groups.length === 0) continue;

		const block = [`\t${note(scopeLabel(scope))}`, `\t${scope.selector} {`, groups.join('\n\n'), '\t}'].join('\n');
		byLayer.set(scope.themeLayer, [...(byLayer.get(scope.themeLayer) ?? []), block]);
	}

	if (byLayer.size === 0) return null;

	const header =
		styles === 'scss'
			? [
					`// ${name} theme. Uncomment a token to change it.`,
					`// Written by \`interop theme ${name}\`. This file is yours.`,
				].join('\n')
			: [
					'/*',
					` * ${name} theme. Uncomment a token to change it.`,
					` * Written by \`interop theme ${name}\`. This file is yours.`,
					' */',
				].join('\n');

	const layers = [...byLayer].map(([layer, blocks]) => `@layer ${layer} {\n${blocks.join('\n\n')}\n}`);
	return `${[header, ...layers].join('\n\n')}\n`;
}

function valuesOf(scope: ManifestScope | undefined): Map<string, string> {
	return new Map((scope?.declarations ?? []).map((d) => [d.token, d.value]));
}
