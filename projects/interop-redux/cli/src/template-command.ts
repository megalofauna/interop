/**
 * `interop template <component>`. Writes `<out>/<component>/template.html`: the markup the
 * component's CSS needs to match. The same markup serves Angular and plain HTML.
 */

import { join } from 'node:path';

import { chooseThemeable } from './choose.ts';
import { loadSettings, type Settings } from './settings.ts';
import { writeStarter } from './starter.ts';
import { renderTemplate } from './template.ts';
import type { Context } from './theme-command.ts';

export interface TemplateArgs {
	readonly component?: string | undefined;
	readonly script?: string | undefined;
	readonly styles?: string | undefined;
	readonly framework?: string | undefined;
	readonly out?: string | undefined;
	readonly dryRun: boolean;
	readonly force: boolean;
}

export function templatePath(name: string, settings: Settings): string {
	return join(settings.out, name, 'template.html');
}

export async function runTemplate(args: TemplateArgs, context: Context): Promise<void> {
	const { manifest, ask } = context;
	ask?.intro('interop template');

	const settings = await loadSettings(
		context.cwd,
		{ script: args.script, styles: args.styles, framework: args.framework, out: args.out },
		{ ask, dryRun: args.dryRun, print: context.print },
	);
	const { name, component } = await chooseThemeable('template', args.component, manifest, ask);

	await writeStarter(templatePath(name, settings), renderTemplate(name, component), args, context);
	ask?.outro(args.dryRun ? 'Nothing was written.' : 'Fill in the content. Keep the attributes.');
}
