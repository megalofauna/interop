import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	input,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import type {
	Block,
	ContentNode,
	Div,
	Doc,
	Heading,
	Inline,
	ListItem,
} from './content-node';
import {
	CONTENT_DIV_RENDERERS,
	CONTENT_SYMBOL_RENDERER,
	type DivRenderer,
	type SymbolRenderer,
} from './content-renderers';

type ChildArray = readonly (Block | Inline | ListItem)[];

const childrenOf = (node: ContentNode): ChildArray => {
	if ('children' in node && Array.isArray(node.children)) {
		return node.children as ChildArray;
	}
	return [];
};

const classListOf = (node: { attributes?: { class?: string } }): readonly string[] => {
	const cls = node.attributes?.class;
	return cls ? cls.split(/\s+/).filter(Boolean) : [];
};

const inlineText = (nodes: readonly Inline[]): string => {
	let out = '';
	for (const n of nodes) {
		if (n.tag === 'str' || n.tag === 'verbatim' || n.tag === 'smart_punctuation') {
			out += n.text;
		} else if (n.tag === 'soft_break' || n.tag === 'non_breaking_space') {
			out += ' ';
		} else if ('children' in n && Array.isArray(n.children)) {
			out += inlineText(n.children as readonly Inline[]);
		}
	}
	return out;
};

/**
 * Recursive renderer that walks a compiled `.djot` AST subtree and emits
 * semantically-correct HTML. Block-level dispatch handles paragraphs,
 * headings, lists, code, quotes, tables, divs, and rules; inline dispatch
 * handles emphasis, links, images, verbatim spans, smart punctuation, breaks,
 * and symbols.
 *
 * Class-tagged `:::`-divs can be replaced by consumer components via
 * `provideContentDivRenderers`. Symbols (`:alias:`) can be wired to an icon
 * system via `provideContentSymbolRenderer`. With neither provider in place,
 * divs render as plain `<div class="…">` and symbols render as `:alias:` text
 * — the same default behavior as a stock djot HTML renderer.
 */
@Component({
	selector: 'interop-content',
	standalone: true,
	imports: [NgComponentOutlet],
	templateUrl: './interop-content.html',
	styleUrls: ['./interop-content.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InteropContent {
	private readonly divRenderers = inject(CONTENT_DIV_RENDERERS);
	private readonly symbolRenderer = inject(CONTENT_SYMBOL_RENDERER);

	readonly node = input.required<ContentNode>();

	protected readonly tag = computed(() => this.node().tag);
	protected readonly children = computed<ChildArray>(() =>
		childrenOf(this.node()),
	);
	protected readonly attrId = computed(() => this.node().attributes?.['id']);
	protected readonly attrClass = computed(
		() => this.node().attributes?.['class'],
	);

	// Tag-narrowed accessors. Each is only read inside its matching @case so the
	// cast is locally safe; using $any() in the template would lose IDE support.
	protected readonly asHeading = computed(() => this.node() as Heading);
	protected readonly asDoc = computed(() => this.node() as Doc);
	protected readonly asDiv = computed(() => this.node() as Div);
	protected readonly asListItem = computed(() => this.node() as ListItem);
	protected readonly asAny = computed(() => this.node() as ContentNode & Record<string, unknown>);

	protected readonly headingLevel = computed(() => {
		const lvl = this.asHeading().level;
		return Math.min(6, Math.max(1, lvl));
	});

	protected readonly divRenderer = computed<DivRenderer | null>(() => {
		if (this.tag() !== 'div') return null;
		for (const cls of classListOf(this.asDiv())) {
			const renderer = this.divRenderers.get(cls);
			if (renderer) return renderer;
		}
		return null;
	});

	protected readonly divRendererInputs = computed(() => ({
		node: this.asDiv(),
	}));

	protected readonly symbolComponent = computed<SymbolRenderer | null>(
		() => this.symbolRenderer,
	);

	protected readonly symbolComponentInputs = computed(() => ({
		node: this.node(),
	}));

	protected readonly imageAlt = computed(() => {
		const node = this.asAny();
		const kids = node['children'] as readonly Inline[] | undefined;
		return kids ? inlineText(kids) : '';
	});
}
