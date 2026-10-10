/**
 * Project settings: `interop.project.json` at the project root, with flags over it for one
 * run. When the file is absent, the settings are detected from the project, confirmed, and
 * written.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { Ask } from './ask.ts';
import { Cancelled, CliError } from './errors.ts';

export const SETTINGS_FILE = 'interop.project.json';

export type Styles = 'css' | 'scss';

export interface Settings {
	readonly script: 'ts' | 'js';
	readonly styles: Styles;
	readonly framework: 'angular' | 'html';
	readonly out: string;
	readonly stylesEntry: string;
}

export interface SettingFlags {
	readonly script?: string | undefined;
	readonly styles?: string | undefined;
	readonly framework?: string | undefined;
	readonly out?: string | undefined;
}

export interface SettingsContext {
	readonly ask?: Ask | undefined;
	readonly dryRun: boolean;
	readonly print: (line: string) => void;
}

const ALLOWED = {
	script: ['ts', 'js'],
	styles: ['css', 'scss'],
	framework: ['angular', 'html'],
} as const;

export async function loadSettings(root: string, flags: SettingFlags, context: SettingsContext): Promise<Settings> {
	const file = await readProjectFile(root);
	const detected = await detectSettings(root);

	if (file === null) await recordSettings(root, detected, context);

	const merged = { ...detected, ...(file ?? {}) };
	const settings = {
		script: flags.script ?? merged.script,
		styles: flags.styles ?? merged.styles,
		framework: flags.framework ?? merged.framework,
		out: flags.out ?? merged.out,
		stylesEntry: merged.stylesEntry,
	};

	for (const key of ['script', 'styles', 'framework'] as const) {
		const allowed: readonly string[] = ALLOWED[key];
		if (!allowed.includes(settings[key])) {
			const source = flags[key] === undefined ? `"${key}" in ${SETTINGS_FILE}` : `--${key}`;
			throw new CliError(`${source} must be ${allowed.join(' or ')}, got ${JSON.stringify(settings[key])}.`, 2);
		}
	}
	return settings as Settings;
}

/** Reads the project the way the settings table in docs/cli.md describes. */
export async function detectSettings(root: string): Promise<Settings> {
	const pkg = await readJson<{ dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>(
		join(root, 'package.json'),
	);
	const deps = { ...pkg?.dependencies, ...pkg?.devDependencies };
	const angular = await readJson<AngularWorkspace>(join(root, 'angular.json'));
	const framework = '@angular/core' in deps ? 'angular' : 'html';

	const angularEntry = framework === 'angular' && angular ? firstStyle(angular) : undefined;
	const existing = (await exists(join(root, 'src/styles.scss')))
		? 'src/styles.scss'
		: (await exists(join(root, 'src/styles.css')))
			? 'src/styles.css'
			: undefined;
	const found = angularEntry ?? existing;

	const scss = found?.endsWith('.scss') || (angular !== null && usesScss(angular)) || 'sass' in deps;
	// With no stylesheet to find, the entry follows the style language.
	const stylesEntry = found ?? (scss ? 'src/styles.scss' : 'src/styles.css');

	return {
		script: (await exists(join(root, 'tsconfig.json'))) ? 'ts' : 'js',
		styles: scss ? 'scss' : 'css',
		framework,
		out: 'src/interop',
		stylesEntry,
	};
}

async function recordSettings(root: string, detected: Settings, context: SettingsContext): Promise<void> {
	const { ask } = context;
	if (ask) {
		ask.note(
			Object.entries(detected)
				.map(([key, value]) => `${key.padEnd(12)}${value}`)
				.join('\n'),
			`Detected settings, for ${SETTINGS_FILE}`,
		);
		if (!(await ask.confirm('Use these settings?'))) {
			throw new Cancelled(`Edit or create ${SETTINGS_FILE}, then run the command again.`);
		}
	}

	if (context.dryRun) {
		report(context, `Would write ${SETTINGS_FILE}`);
		return;
	}
	await writeFile(join(root, SETTINGS_FILE), `${JSON.stringify(detected, null, '\t')}\n`, 'utf8');
	report(context, `Wrote ${SETTINGS_FILE}`);
}

function report(context: SettingsContext, line: string): void {
	if (context.ask) context.ask.success(line);
	else context.print(line);
}

interface AngularWorkspace {
	readonly projects?: Readonly<
		Record<
			string,
			{
				readonly schematics?: Readonly<Record<string, { readonly style?: string }>>;
				readonly architect?: { readonly build?: { readonly options?: AngularBuildOptions } };
			}
		>
	>;
}

interface AngularBuildOptions {
	readonly styles?: readonly (string | { readonly input: string })[];
	readonly inlineStyleLanguage?: string;
}

function firstStyle(workspace: AngularWorkspace): string | undefined {
	for (const project of Object.values(workspace.projects ?? {})) {
		const first = project.architect?.build?.options?.styles?.[0];
		if (first !== undefined) return typeof first === 'string' ? first : first.input;
	}
	return undefined;
}

function usesScss(workspace: AngularWorkspace): boolean {
	return Object.values(workspace.projects ?? {}).some(
		(project) =>
			project.architect?.build?.options?.inlineStyleLanguage === 'scss' ||
			project.schematics?.['@schematics/angular:component']?.style === 'scss',
	);
}

async function readProjectFile(root: string): Promise<Partial<Record<keyof Settings, string>> | null> {
	const text = await readFile(join(root, SETTINGS_FILE), 'utf8').catch(() => null);
	if (text === null) return null;
	try {
		return JSON.parse(text) as Partial<Record<keyof Settings, string>>;
	} catch {
		throw new CliError(`${SETTINGS_FILE} is not valid JSON.`, 2);
	}
}

async function readJson<T>(path: string): Promise<T | null> {
	const text = await readFile(path, 'utf8').catch(() => null);
	if (text === null) return null;
	try {
		return JSON.parse(text) as T;
	} catch {
		return null;
	}
}

async function exists(path: string): Promise<boolean> {
	return readFile(path).then(
		() => true,
		() => false,
	);
}
