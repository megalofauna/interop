/** Naming the component a command acts on: from the argument, or from a list in a terminal. */

import type { Ask } from './ask.ts';
import { CliError } from './errors.ts';
import { closest, type Manifest, type ManifestComponent } from './manifest.ts';

export function themeableNames(manifest: Manifest): string[] {
	return Object.keys(manifest.components).filter((name) => manifest.components[name]!.themeable);
}

/** A themeable component, by name or by choice. `command` names the command in messages. */
export async function chooseThemeable(
	command: string,
	name: string | undefined,
	manifest: Manifest,
	ask: Ask | undefined,
): Promise<{ readonly name: string; readonly component: ManifestComponent }> {
	const themeable = themeableNames(manifest);

	if (name === undefined) {
		if (!ask) {
			throw new CliError(`${command} needs a component: interop ${command} <component>. One of: ${themeable.join(', ')}.`, 2);
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
	return { name, component };
}
