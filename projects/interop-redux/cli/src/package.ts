/** The package the CLI ships in. Its name is the specifier every written import starts with. */

import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as {
	readonly name: string;
	readonly version: string;
};

export const PACKAGE = pkg.name;
export const VERSION = pkg.version;
