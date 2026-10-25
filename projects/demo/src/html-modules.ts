// Ambient declarations, in a .ts file because the repository ignores *.d.ts.
/** An example's markup, imported as text: `import sizes from "./examples/sizes.html"`. */
declare module "*.html" {
	const markup: string;
	export default markup;
}

/** An example's styles, imported as text: `import heavyCss from "./examples/heavy.css"`. */
declare module "*.css" {
	const css: string;
	export default css;
}
