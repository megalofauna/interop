/**
 * Project settings: `interop.project.json` at the project root, with flags over it for one
 * run. Absent settings take the defaults below.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { CliError } from './errors.ts';

export const SETTINGS_FILE = 'interop.project.json';

export type Styles = 'css' | 'scss';

export interface Settings {
	readonly styles: Styles;
	readonly out: string;
}

const DEFAULTS: Settings = { styles: 'css', out: 'src/interop' };

export interface SettingFlags {
	readonly styles?: string | undefined;
	readonly out?: string | undefined;
}

export async function readSettings(root: string, flags: SettingFlags): Promise<Settings> {
	const file = await readProjectFile(root);
	const styles = flags.styles ?? file.styles ?? DEFAULTS.styles;
	const out = flags.out ?? file.out ?? DEFAULTS.out;

	if (styles !== 'css' && styles !== 'scss') {
		const source = flags.styles === undefined ? `"styles" in ${SETTINGS_FILE}` : '--styles';
		throw new CliError(`${source} must be css or scss, got ${JSON.stringify(styles)}.`, 2);
	}
	return { styles, out };
}

async function readProjectFile(root: string): Promise<{ styles?: string; out?: string }> {
	const text = await readFile(join(root, SETTINGS_FILE), 'utf8').catch(() => null);
	if (text === null) return {};
	try {
		return JSON.parse(text) as { styles?: string; out?: string };
	} catch {
		throw new CliError(`${SETTINGS_FILE} is not valid JSON.`, 2);
	}
}
