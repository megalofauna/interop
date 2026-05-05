import { promises as fs } from 'node:fs';
import type { Plugin, OnLoadResult } from 'esbuild';
import { parse } from '@djot/djot';
import { extractSlots } from './extract';
import { emitModule, InvalidSlotIdError } from './emit';

export interface DjotPluginOptions {
	/** Pattern matched against import paths. Default: /\.djot$/ */
	readonly filter?: RegExp;
}

/**
 * esbuild plugin that compiles `.djot` source files into TypeScript modules
 * exposing each top-level `{#id}` div as a named, typed `Div` export.
 *
 * Wiring (Angular 21 / `@angular/build`) requires a custom esbuild builder
 * such as `@angular-builders/custom-esbuild`. The plugin itself is framework
 * agnostic and can also be consumed directly by Vite (`plugins: [djotPlugin()]`).
 */
export const djotPlugin = (options: DjotPluginOptions = {}): Plugin => ({
	name: 'interop-djot',
	setup(build) {
		const filter = options.filter ?? /\.djot$/;

		build.onLoad({ filter }, async (args): Promise<OnLoadResult> => {
			const source = await fs.readFile(args.path, 'utf8');
			const ast = parse(source);
			const { slots, errors } = extractSlots(ast);

			if (errors.length > 0) {
				return {
					errors: errors.map((e) => ({
						text: e.message,
						location: { file: args.path },
					})),
					watchFiles: [args.path],
				};
			}

			try {
				return {
					contents: emitModule(slots),
					loader: 'ts',
					watchFiles: [args.path],
				};
			} catch (err) {
				if (err instanceof InvalidSlotIdError) {
					return {
						errors: [{ text: err.message, location: { file: args.path } }],
						watchFiles: [args.path],
					};
				}
				throw err;
			}
		});
	},
});

export default djotPlugin;
