// Builds the spike's bundles and pages into dist/ and serves this folder.
//
// - dist/interop.css, for the CSS-only pages (list, progress); dist/tabs.js for the plain HTML page; dist/password.js, dist/character-count.js and
//   dist/validation.js, the field page;
//   dist/react.js, the React page.
// - dist/hydration.html: the hydration app rendered on the server by @angular/platform-server, with
//   dist/hydration-client.js to hydrate it in the browser.
import * as esbuild from "esbuild";
import { writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const root = fileURLToPath(new URL("../../", import.meta.url));
const dist = `${here}dist`;

const alias = {
	interop: `${root}projects/interop/src/public-api.ts`,
	"interop/tabs": `${root}projects/interop/tabs/public-api.ts`,
};
// The hydration app is compiled just in time, which needs Angular's decorator form.
const tsconfigRaw = {
	compilerOptions: {
		experimentalDecorators: true,
		useDefineForClassFields: false,
	},
};

export async function build() {
	await esbuild.build({
		entryPoints: {
			tabs: `${root}projects/interop/tabs/public-api.ts`,
			password: `${root}projects/interop/field/password.ts`,
			"character-count": `${root}projects/interop/field/character-count.ts`,
			validation: `${root}projects/interop/field/validation.ts`,
			interop: `${root}projects/interop/interop.css`,
			"hydration-client": `${here}hydration/client.ts`,
			react: `${here}react/app.js`,
		},
		bundle: true,
		format: "esm",
		outdir: dist,
		alias,
		tsconfigRaw,
		loader: { ".woff2": "file" },
		logLevel: "warning",
	});
	await esbuild.build({
		entryPoints: [`${here}hydration/server.ts`],
		bundle: true,
		platform: "node",
		format: "esm",
		outfile: `${dist}/hydration-server.mjs`,
		alias,
		tsconfigRaw,
		logLevel: "warning",
	});
	const { render } = await import(
		`${pathToFileURL(`${dist}/hydration-server.mjs`).href}?${Date.now()}`
	);
	const html = await render(
		'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Hydration</title>' +
			'<link rel="stylesheet" href="interop.css"></head>' +
			'<body><app-root></app-root><script type="module" src="hydration-client.js"></script></body></html>',
	);
	await writeFile(`${dist}/hydration.html`, html);
}

/** Builds, then serves the spike folder. Resolves to its address and a function that stops it. */
export async function serve(port = 0) {
	await build();
	const context = await esbuild.context({});
	const { port: actual } = await context.serve({ servedir: here, port });
	return {
		url: `http://localhost:${actual}`,
		stop: () => context.dispose(),
	};
}
