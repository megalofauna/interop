/*
 * Content loader — markdown authored in an external editor (iA Writer), dropped
 * into projects/protocol/src/content/*.md, served as a static asset under
 * /content, fetched and rendered at runtime.
 *
 * Pipeline: markdown -> semantic HTML (marked) -> interop markup
 * (content-upgrade). The result is injected inside an [interop-typography-root]
 * scope (see ContentPage), which styles bare h1-h6 / p / lists / blockquote /
 * pre at zero specificity, while content-upgrade rewrites CSS-contract
 * constructs (tables, inline code) into their interop class skeletons.
 *
 * Upgrade path (Layer 2, not built yet): replace content-upgrade's DOM surgery
 * with an AST walk that *instantiates* behaviour-contract components — code
 * fences -> itx-code-block (shiki + tabs + copy), authored ::: directives ->
 * callouts/steppers. The route, asset convention, and authoring workflow stay
 * unchanged either way.
 */
import { marked } from "marked";
import { upgradeContentHtml } from "./content-upgrade";

/** Frontmatter is a flat block of `key: value` scalars — no nested YAML. */
export interface ContentMeta {
	title?: string;
	description?: string;
	order?: number;
	[key: string]: string | number | undefined;
}

export interface LoadedContent {
	meta: ContentMeta;
	html: string;
}

/** Thrown when no .md asset exists for the requested slug. */
export class ContentNotFoundError extends Error {
	constructor(readonly slug: string) {
		super(`No content asset for slug "${slug}"`);
		this.name = "ContentNotFoundError";
	}
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function parseFrontmatter(raw: string): { meta: ContentMeta; body: string } {
	const match = FRONTMATTER.exec(raw);
	if (!match) return { meta: {}, body: raw };

	const meta: ContentMeta = {};
	for (const line of match[1].split(/\r?\n/)) {
		const colon = line.indexOf(":");
		if (colon === -1) continue;
		const key = line.slice(0, colon).trim();
		const value = line
			.slice(colon + 1)
			.trim()
			.replace(/^["']|["']$/g, "");
		meta[key] = key === "order" && value !== "" ? Number(value) : value;
	}
	return { meta, body: raw.slice(match[0].length) };
}

/**
 * Fetch and render the content page for `slug`. The slug maps directly to the
 * filename: `getting-started` -> /content/getting-started.md.
 */
export async function loadContent(slug: string): Promise<LoadedContent> {
	const response = await fetch(`/content/${slug}.md`);
	if (!response.ok) throw new ContentNotFoundError(slug);

	const { meta, body } = parseFrontmatter(await response.text());
	const html = upgradeContentHtml(await marked.parse(body, { gfm: true }));
	return { meta, html };
}
