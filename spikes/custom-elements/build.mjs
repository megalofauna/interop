// Bundles interop/tabs and interop.css for the spike's plain HTML and React pages, then serves this
// folder. Run from the repo root: node spikes/custom-elements/build.mjs
import * as esbuild from "esbuild";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const root = fileURLToPath(new URL("../../", import.meta.url));

await esbuild.build({
	entryPoints: {
		tabs: `${root}projects/interop/tabs/public-api.ts`,
		interop: `${root}projects/interop/interop.css`,
	},
	bundle: true,
	format: "esm",
	outdir: `${here}dist`,
	alias: { interop: `${root}projects/interop/src/public-api.ts` },
	loader: { ".woff2": "file" },
	logLevel: "info",
});

const { port } = await (
	await esbuild.context({})
).serve({ servedir: here, port: 8137 });
console.log(`Serving the spike at http://localhost:${port}/`);
