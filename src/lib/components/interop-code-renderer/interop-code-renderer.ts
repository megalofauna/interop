import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	afterNextRender,
	computed,
	inject,
	input,
	isDevMode,
} from "@angular/core";

export type HighlightToken = {
	text: string;
	color?: string;
	fontStyle?: 0 | 1 | 2 | 3;
};

export type HighlightedLine = { tokens: HighlightToken[] };
export type HighlightedCode = HighlightedLine[];

const LANGUAGE_LABELS: Readonly<Record<string, string>> = {
	ts: "TypeScript",
	typescript: "TypeScript",
	js: "JavaScript",
	javascript: "JavaScript",
	tsx: "TSX",
	jsx: "JSX",
	html: "HTML",
	css: "CSS",
	scss: "SCSS",
	sass: "Sass",
	json: "JSON",
	yaml: "YAML",
	yml: "YAML",
	toml: "TOML",
	bash: "Shell",
	sh: "Shell",
	zsh: "Shell",
	shell: "Shell",
	py: "Python",
	python: "Python",
	rs: "Rust",
	rust: "Rust",
	go: "Go",
	java: "Java",
	kotlin: "Kotlin",
	swift: "Swift",
	c: "C",
	cpp: "C++",
	cs: "C#",
	csharp: "C#",
	rb: "Ruby",
	ruby: "Ruby",
	php: "PHP",
	md: "Markdown",
	markdown: "Markdown",
	sql: "SQL",
	xml: "XML",
	graphql: "GraphQL",
	gql: "GraphQL",
	dockerfile: "Dockerfile",
	docker: "Dockerfile",
	nginx: "Nginx",
	http: "HTTP",
};

export function canonicalizeLanguage(lang: string | null): string | null {
	if (!lang) return null;
	return LANGUAGE_LABELS[lang.toLowerCase()] ?? lang;
}

let _rendererIdCounter = 0;

/**
 * InteropCodeRenderer — Minimal tokenized code renderer.
 *
 * Must be used on a `<figure>` element. Renders pre-tokenized syntax-highlighted
 * code via the `[tokens]` input, or projects a consumer-provided `<pre><code>`.
 *
 * This is a primitive — no toolbar, no copy button, no actions. Compose those
 * via the `CodeBlock` composite from `@interop/composites`.
 *
 * @example Token rendering (from Shiki)
 * ```html
 * <figure interop-code-renderer language="ts" [tokens]="tokens"></figure>
 * ```
 *
 * @example Projection fallback
 * ```html
 * <figure interop-code-renderer language="ts">
 *   <pre><code>const x = 1;</code></pre>
 * </figure>
 * ```
 */
@Component({
	selector: "figure[interop-code-renderer]",
	standalone: true,
	imports: [],
	templateUrl: "./interop-code-renderer.html",
	styleUrl: "./interop-code-renderer.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		"[style.--itx-cr-white-space]": "whiteSpaceValue()",
	},
})
export class InteropCodeRenderer {
	private readonly elementRef = inject(ElementRef<HTMLElement>);

	readonly uid = `itx-code-renderer-${_rendererIdCounter++}`;

	readonly language = input<string | null>(null);
	readonly filename = input<string | null>(null);
	readonly lineNumbers = input<boolean>(false);
	readonly wrap = input<boolean>(false);
	readonly tokens = input<HighlightedCode | null>(null);

	readonly languageLabel = computed(() => canonicalizeLanguage(this.language()));
	readonly headerLabel = computed(
		() => this.filename() ?? this.languageLabel(),
	);
	readonly whiteSpaceValue = computed(() =>
		this.wrap() ? "pre-wrap" : "pre",
	);

	constructor() {
		if (isDevMode()) {
			afterNextRender(() => {
				const el = this.elementRef.nativeElement;
				if (el.tagName !== "FIGURE") {
					console.warn(
						`InteropCodeRenderer must be used on <figure> elements. Found on: ${el.tagName.toLowerCase()}`,
					);
				}
			});
		}
	}
}
