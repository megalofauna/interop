#!/usr/bin/env node
/**
 * The `interop` entry point. Parses the command line, picks a command, and maps failures to
 * exit statuses.
 */

import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { terminal, type Ask } from './ask.ts';
import { Cancelled, CliError } from './errors.ts';
import { closest, loadManifest } from './manifest.ts';
import { VERSION } from './package.ts';
import { runAdd } from './add-command.ts';
import { runTemplate } from './template-command.ts';
import { runTheme } from './theme-command.ts';

interface Command {
	readonly name: string;
	readonly usage: string;
	readonly summary: string;
	readonly built: boolean;
}

const COMMANDS: readonly Command[] = [
	{ name: 'init', usage: 'init', summary: 'Create a project. `npm create interop` runs this.', built: false },
	{ name: 'new', usage: 'new <name>', summary: 'Create a new component: a blueprint and its config entry.', built: false },
	{ name: 'add', usage: 'add <component>...', summary: "Wire shipped components' stylesheets into the project.", built: true },
	{ name: 'theme', usage: 'theme <component>', summary: "Create a component's theme file.", built: true },
	{ name: 'template', usage: 'template <component>', summary: 'Create a custom template starter for a component.', built: true },
];

const OPTIONS = {
	script: { type: 'string' },
	styles: { type: 'string' },
	framework: { type: 'string' },
	out: { type: 'string' },
	categories: { type: 'string', multiple: true },
	scopes: { type: 'string', multiple: true },
	theme: { type: 'boolean', default: false },
	template: { type: 'boolean', default: false },
	'dry-run': { type: 'boolean', default: false },
	force: { type: 'boolean', default: false },
	yes: { type: 'boolean', short: 'y', default: false },
	help: { type: 'boolean', short: 'h', default: false },
	version: { type: 'boolean', short: 'v', default: false },
} as const;

const USAGE = `USAGE
    interop <command> [<component>...] [options]

COMMANDS
${COMMANDS.map((c) => `    ${c.usage.padEnd(23)}${c.summary}${c.built ? '' : '  (not built)'}`).join('\n')}

OPTIONS
    --script <ts|js>              Script language. Default: the project setting.
    --styles <css|scss>           Style language. Default: the project setting.
    --framework <angular|html>    Template format. Default: the project setting.
    --out <path>                  Directory for written files. Default: the project setting.
    --dry-run                     List the files that would be written. Write nothing.
    --force                       Overwrite existing files.
    -y, --yes                     Take every default. Never prompt.
    -h, --help                    Show help for interop, or for one command.
    -v, --version                 Show the version.
`;

const ADD_USAGE = `USAGE
    interop add <component>... [options]

Inserts each component's stylesheet imports into the project's styles entry, after
layers.css, which comes first and once. Running it again adds no line twice.

OPTIONS
    --theme                       Then create a theme for each themeable component.
    --template                    Then create a template starter for each themeable component.
    --styles <css|scss>           Style language for a theme. Default: the project setting.
    --out <path>                  Directory for theme files. Default: the project setting.
    --dry-run                     Show the lines that would be added. Write nothing.
    --force                       Overwrite existing theme files.
    -y, --yes                     Take every default. Never prompt.
`;

const TEMPLATE_USAGE = `USAGE
    interop template <component> [options]

Writes <out>/<component>/template.html: the markup the component's CSS needs to match. The
host, its identity attribute, and the elements under it, with the axis and modifier attributes
listed in a comment. Fill in the content and keep the attributes.

OPTIONS
    --out <path>                  Directory for written files. Default: the project setting.
    --dry-run                     Show the file that would be written. Write nothing.
    --force                       Overwrite an existing template file.
    -y, --yes                     Take every default. Never prompt.
`;

const THEME_USAGE = `USAGE
    interop theme <component> [options]

Writes <out>/<component>/theme.css: every token the component has, commented out, with its
current value. Uncomment a token to change it.

OPTIONS
    --categories <name,...>       Categories to list. Default: all.
    --scopes <scope,...>          Scopes to list: default, variant, variant:danger. Default: all.
    --styles <css|scss>           Style language. Default: the project setting.
    --out <path>                  Directory for written files. Default: the project setting.
    --dry-run                     Show the file that would be written. Write nothing.
    --force                       Overwrite an existing theme file.
    -y, --yes                     Take every default. Never prompt.
`;

export async function main(argv: readonly string[]): Promise<number> {
	let ask: Ask | undefined;
	try {
		const { values, positionals } = parse(argv);
		if (values.version) {
			console.log(VERSION);
			return 0;
		}

		ask = process.stdin.isTTY && process.stdout.isTTY && !values.yes ? terminal : undefined;

		let [command, ...rest] = positionals;
		if (command === undefined) {
			if (values.help || !ask) {
				console.log(USAGE);
				return 0;
			}
			command = await ask.select(
				'Command',
				COMMANDS.map((c) => ({
					value: c.name,
					hint: c.built ? c.summary : 'not built yet',
					disabled: !c.built,
				})),
			);
		}

		const spec = COMMANDS.find((c) => c.name === command);
		if (!spec) {
			const suggestion = closest(command, COMMANDS.map((c) => c.name));
			throw new CliError(`Unknown command "${command}".${suggestion ? ` Did you mean ${suggestion}?` : ''}`, 2);
		}
		if (values.help) {
			const help: Record<string, string> = { theme: THEME_USAGE, add: ADD_USAGE, template: TEMPLATE_USAGE };
			console.log(help[spec.name] ?? USAGE);
			return 0;
		}
		if (!spec.built) {
			throw new CliError(`\`interop ${spec.name}\` is not built yet.`, 2);
		}

		const context = { cwd: process.cwd(), manifest: await loadManifest(), ask, print: (line: string) => console.log(line) };
		const settingFlags = {
			script: values.script,
			styles: values.styles,
			framework: values.framework,
			out: values.out,
			dryRun: values['dry-run'],
			force: values.force,
		};

		if (spec.name === 'add') {
			await runAdd({ components: rest, theme: values.theme, template: values.template, ...settingFlags }, context);
			return 0;
		}

		if (spec.name === 'template') {
			await runTemplate({ component: rest[0], ...settingFlags }, context);
			return 0;
		}

		await runTheme(
			{
				component: rest[0],
				categories: list(values.categories),
				scopes: list(values.scopes),
				script: values.script,
				styles: values.styles,
				framework: values.framework,
				out: values.out,
				dryRun: values['dry-run'],
				force: values.force,
			},
			context,
		);
		return 0;
	} catch (error) {
		if (error instanceof Cancelled) {
			terminal.outro(error.message || 'Cancelled. Nothing was written.');
			return 0;
		}
		if (error instanceof CliError) {
			if (ask) ask.error(error.message);
			else console.error(`interop: ${error.message}`);
			return error.status;
		}
		throw error;
	}
}

function parse(argv: readonly string[]) {
	try {
		return parseArgs({ args: [...argv], options: OPTIONS, allowPositionals: true, strict: true });
	} catch (error) {
		throw new CliError(`${(error as Error).message}\nRun \`interop --help\` for usage.`, 2);
	}
}

/** `--scopes a,b --scopes c` is `[a, b, c]`. Absent stays absent. */
function list(values: readonly string[] | undefined): string[] | undefined {
	return values?.flatMap((v) => v.split(',')).map((v) => v.trim()).filter(Boolean);
}

// Run as a script, not when imported. `argv[1]` is the bin symlink under `npx`, so both
// sides are compared as real paths.
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
	process.exitCode = await main(process.argv.slice(2));
}
