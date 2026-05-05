import type { Div } from '@djot/djot';

const VALID_IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

const RESERVED = new Set([
	'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
	'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'false',
	'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'new',
	'null', 'return', 'super', 'switch', 'this', 'throw', 'true', 'try',
	'typeof', 'var', 'void', 'while', 'with', 'yield', 'let', 'static',
	'implements', 'interface', 'package', 'private', 'protected', 'public',
	'await', 'async',
]);

export class InvalidSlotIdError extends Error {
	constructor(id: string, reason: string) {
		super(`Slot id "${id}" cannot be used as an export name: ${reason}`);
	}
}

const assertValidIdent = (id: string): void => {
	if (!VALID_IDENT.test(id)) {
		throw new InvalidSlotIdError(
			id,
			'must match /^[A-Za-z_$][A-Za-z0-9_$]*$/',
		);
	}
	if (RESERVED.has(id)) {
		throw new InvalidSlotIdError(id, 'is a reserved JavaScript keyword');
	}
};

/**
 * Emits a TypeScript module exposing each slot as a named export plus a
 * `__slots` literal-tuple and a `Slot` type alias for typed slot lookups.
 *
 * The compiled output ships zero parser code — only the pre-resolved AST
 * subtree per slot, frozen at build time. V8 keeps frozen object literals
 * as immutable maps, so consumer hot paths avoid per-render shape churn.
 */
export const emitModule = (slots: ReadonlyMap<string, Div>): string => {
	const ids = [...slots.keys()];
	for (const id of ids) assertValidIdent(id);

	const lines: string[] = [
		'// AUTO-GENERATED from .djot source. Do not edit by hand.',
		"import type { Div } from '@djot/djot';",
		'',
	];

	// `as unknown as Div` is required because TS narrows JSON literals such
	// that nested `tag` fields infer as `string` rather than the discriminant
	// literal types (e.g. `"heading"`). The runtime shape is identical; the
	// cast just satisfies the Div interface contract.
	for (const id of ids) {
		const literal = JSON.stringify(slots.get(id));
		lines.push(
			`export const ${id}: Div = /*#__PURE__*/ Object.freeze(${literal}) as unknown as Div;`,
		);
	}

	lines.push('');
	lines.push(
		`export const __slots = [${ids.map((id) => JSON.stringify(id)).join(', ')}] as const;`,
	);
	lines.push('export type Slot = typeof __slots[number];');
	lines.push('');

	return lines.join('\n');
};
