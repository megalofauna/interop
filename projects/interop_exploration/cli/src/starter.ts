/**
 * Writing a starter file: once, then it belongs to the consumer. An existing file is only
 * overwritten with `--force`.
 */

import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { CliError } from './errors.ts';
import type { Ask } from './ask.ts';

export interface StarterArgs {
	readonly dryRun: boolean;
	readonly force: boolean;
}

export interface Reporter {
	readonly cwd: string;
	readonly ask?: Ask | undefined;
	readonly print: (line: string) => void;
}

export async function writeStarter(path: string, text: string, args: StarterArgs, context: Reporter): Promise<void> {
	const target = join(context.cwd, path);
	if (!args.dryRun && !args.force && (await exists(target))) {
		throw new CliError(`${path} exists. Pass --force to overwrite it.`, 1);
	}
	if (args.dryRun) {
		report(context, `Would write ${path}`);
		return;
	}
	await mkdir(dirname(target), { recursive: true });
	await writeFile(target, text, 'utf8');
	report(context, `Wrote ${path}`);
}

/** Every path that would refuse without `--force`, so a command can stop before writing anything. */
export async function blocked(paths: readonly string[], args: StarterArgs, cwd: string): Promise<string[]> {
	if (args.dryRun || args.force) return [];
	const found = await Promise.all(paths.map(async (path) => ((await exists(join(cwd, path))) ? path : null)));
	return found.filter((path): path is string => path !== null);
}

export function report(context: Reporter, line: string): void {
	if (context.ask) context.ask.success(line);
	else context.print(line);
}

async function exists(path: string): Promise<boolean> {
	return stat(path).then(
		() => true,
		() => false,
	);
}
