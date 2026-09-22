/**
 * Entry point. A CLI edits the config, then calls `build()`.
 *
 *   node src/build.ts           write the generated files
 *   node src/build.ts --check   fail if anything on disk differs from a fresh build
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { BLUEPRINTS } from './blueprints/index.ts';
import { lintRoundTrip, type LintIssue } from './system/lint.ts';
import { resolve as resolveComponent, type Config } from './system/resolve.ts';
import { emitDocs } from './system/emit/docs.ts';
import { emitManifest } from './system/emit/manifest.ts';
import { emitProperties } from './system/emit/properties.ts';
import { emitStructure } from './system/emit/structure.ts';
import { emitTheme } from './system/emit/theme.ts';
import type { Blueprint } from './system/blueprint.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src/generated');

export interface BuildResult {
	readonly files: ReadonlyMap<string, string>;
	readonly issues: readonly LintIssue[];
	readonly missing: readonly string[];
}

/** Layer order, declared once. Unlayered consumer CSS beats all three. */
const LAYERS = `@layer interop.structure, interop.theme, interop.overrides;\n`;

export async function build(config: Config): Promise<BuildResult> {
	const files = new Map<string, string>();
	const issues: LintIssue[] = [];
	const missing: string[] = [];
	const manifestEntries: { blueprint: Blueprint; component: ReturnType<typeof resolveComponent> }[] = [];

	files.set('layers.css', LAYERS);

	for (const blueprint of BLUEPRINTS) {
		const source = relative(ROOT, join(ROOT, `src/blueprints/${blueprint.name}.blueprint.ts`));
		const component = resolveComponent(blueprint, config.components[blueprint.name] ?? {});
		missing.push(...component.missing);

		const structure = emitStructure(component, source);
		const theme = emitTheme(component, source);
		const properties = emitProperties(component, source);

		files.set(`${blueprint.name}/structure.css`, structure);
		if (theme) files.set(`${blueprint.name}/theme.css`, theme);
		if (properties) files.set(`${blueprint.name}/properties.css`, properties);
		files.set(`${blueprint.name}/docs.md`, emitDocs(blueprint, component));

		const stateTokens = new Set(component.tokens.filter((t) => t.state).map((t) => t.name));
		issues.push(...lintRoundTrip(blueprint.name, structure, theme, stateTokens));

		manifestEntries.push({ blueprint, component });
	}

	files.set('manifest.json', emitManifest(manifestEntries));
	return { files, issues, missing };
}

async function loadConfig(): Promise<Config> {
	return JSON.parse(await readFile(join(ROOT, 'interop.config.json'), 'utf8')) as Config;
}

async function main(): Promise<void> {
	const check = process.argv.includes('--check');
	const { files, issues, missing } = await build(await loadConfig());
	const problems: string[] = [];

	for (const token of missing) {
		problems.push(`missing value: ${token} is consumed but the config gives it none`);
	}
	for (const issue of issues) {
		problems.push(`${issue.kind}: ${issue.detail}`);
	}

	for (const [name, contents] of files) {
		const path = join(OUT, name);
		if (check) {
			const current = await readFile(path, 'utf8').catch(() => null);
			if (current !== contents) problems.push(`stale: ${name} differs from a fresh build`);
			continue;
		}
		await mkdir(dirname(path), { recursive: true });
		await writeFile(path, contents, 'utf8');
	}

	if (problems.length > 0) {
		console.error(problems.map((p) => `  ${p}`).join('\n'));
		process.exitCode = 1;
		return;
	}

	console.log(`${check ? 'checked' : 'wrote'} ${files.size} files`);
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
	await main();
}
