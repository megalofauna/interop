import type { Block, Div, Doc } from '@djot/djot';

export interface ExtractError {
	readonly message: string;
}

export interface ExtractResult {
	readonly slots: ReadonlyMap<string, Div>;
	readonly errors: readonly ExtractError[];
}

const isDiv = (node: Block): node is Div => node.tag === 'div';

/**
 * Picks top-level `:::`-divs that carry an explicit `{#id ...}` block attribute
 * and returns them keyed by id. Divs without an id are ignored — they are
 * usable for in-prose grouping but are not addressable as slots.
 *
 * Duplicate ids are reported as errors so a content author cannot silently
 * shadow a slot.
 */
export const extractSlots = (ast: Doc): ExtractResult => {
	const slots = new Map<string, Div>();
	const errors: ExtractError[] = [];

	for (const node of ast.children) {
		if (!isDiv(node)) continue;
		const id = node.attributes?.['id'];
		if (!id) continue;

		if (slots.has(id)) {
			errors.push({ message: `Duplicate slot id "${id}"` });
			continue;
		}
		slots.set(id, node);
	}

	return { slots, errors };
};
