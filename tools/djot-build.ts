/**
 * Compiles every `.djot` file under one or more source directories into a
 * `.djot.ts` module. Each top-level `{#id}`-attributed div becomes a named,
 * typed `Div` export.
 *
 * Output placement:
 *   • If the source lives in a `_djot/` directory, the generated file is
 *     written to the parent of `_djot/` (so consumer code can `import
 *     { hero } from './content.djot'` without esbuild trying to load the
 *     raw source — `_djot/` is unreferenced by the bundle graph).
 *   • Otherwise, the generated file is emitted as a sibling.
 *
 * Run once:    npx tsx tools/djot-build.ts projects/demo/src
 * Watch mode:  npx tsx tools/djot-build.ts --watch projects/demo/src
 *
 * Generated files are deterministic and cheap to regenerate. Either commit
 * them or add `*.djot.ts` to `.gitignore` and run this in your build pipeline
 * before `ng build`.
 */
import { promises as fs, watch } from 'node:fs';
import * as path from 'node:path';
import { parse } from '@djot/djot';
import { extractSlots } from './djot-loader/extract';
import { emitModule, InvalidSlotIdError } from './djot-loader/emit';

const args = process.argv.slice(2);
const watchMode = args.includes('--watch');
const roots = args.filter((a) => !a.startsWith('--'));

if (roots.length === 0) {
	console.error('Usage: tsx tools/djot-build.ts [--watch] <dir> [<dir> ...]');
	process.exit(1);
}

const isDjotSource = (p: string): boolean =>
	p.endsWith('.djot') && !p.endsWith('.djot.ts');

const walk = async function* (dir: string): AsyncGenerator<string> {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
			yield* walk(full);
		} else if (entry.isFile() && isDjotSource(entry.name)) {
			yield full;
		}
	}
};

const computeOutPath = (sourcePath: string): string => {
	const parsed = path.parse(sourcePath);
	if (path.basename(parsed.dir) === '_djot') {
		return path.join(path.dirname(parsed.dir), `${parsed.base}.ts`);
	}
	return `${sourcePath}.ts`;
};

const compile = async (sourcePath: string): Promise<void> => {
	const source = await fs.readFile(sourcePath, 'utf8');
	const ast = parse(source);
	const { slots, errors } = extractSlots(ast);

	if (errors.length > 0) {
		const lines = errors.map((e) => `  - ${e.message}`).join('\n');
		throw new Error(`Errors in ${sourcePath}:\n${lines}`);
	}

	let output: string;
	try {
		output = emitModule(slots);
	} catch (err) {
		if (err instanceof InvalidSlotIdError) {
			throw new Error(`In ${sourcePath}: ${err.message}`);
		}
		throw err;
	}

	const outPath = computeOutPath(sourcePath);
	await fs.writeFile(outPath, output, 'utf8');
	console.log(
		`✓ ${path.relative(process.cwd(), sourcePath)} → ${path.relative(process.cwd(), outPath)}`,
	);
};

const compileAll = async (root: string): Promise<void> => {
	for await (const file of walk(root)) {
		try {
			await compile(file);
		} catch (err) {
			console.error((err as Error).message);
			if (!watchMode) process.exitCode = 1;
		}
	}
};

const main = async () => {
	for (const root of roots) await compileAll(root);

	if (!watchMode) return;

	console.log('Watching for .djot changes...');
	for (const root of roots) {
		watch(root, { recursive: true }, (_event, filename) => {
			if (!filename || !isDjotSource(filename)) return;
			const full = path.join(root, filename);
			compile(full).catch((err) => console.error((err as Error).message));
		});
	}
};

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
