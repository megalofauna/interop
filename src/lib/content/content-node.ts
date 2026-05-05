/**
 * AST surface for `<interop-content>`. Re-exports `@djot/djot`'s typed AST so
 * the renderer, the build-time loader, and consumer code all share one source
 * of truth. A version bump of `@djot/djot` updates the type tree everywhere.
 */

export type {
	Alignment,
	AstNode,
	Attributes,
	Block,
	BlockQuote,
	BulletList,
	Caption,
	Cell,
	CheckboxStatus,
	CodeBlock,
	Definition,
	DefinitionList,
	DefinitionListItem,
	Delete,
	DisplayMath,
	Div,
	Doc,
	DoubleQuoted,
	Email,
	Emph,
	Footnote,
	FootnoteReference,
	HardBreak,
	HasAttributes,
	HasChildren,
	Heading,
	Image,
	Inline,
	InlineMath,
	Insert,
	Link,
	ListItem,
	Mark,
	NonBreakingSpace,
	OrderedList,
	OrderedListStyle,
	Para,
	Pos,
	RawBlock,
	RawInline,
	Reference,
	Row,
	Section,
	SingleQuoted,
	SmartPunctuation,
	SmartPunctuationType,
	SoftBreak,
	SourceLoc,
	Span,
	Str,
	Strong,
	Subscript,
	Superscript,
	Symb,
	Table,
	TaskList,
	TaskListItem,
	Term,
	ThematicBreak,
	Url,
	Verbatim,
	Visitor,
} from '@djot/djot';

import type { AstNode } from '@djot/djot';

/**
 * Convenience union covering every node the recursive renderer may encounter
 * while walking a compiled `.djot` slot subtree (Doc, Block, Inline, plus the
 * structural sub-nodes for lists, definition lists, tables, footnotes, and
 * references).
 */
export type ContentNode = AstNode;
