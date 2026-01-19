export type PhSvgNode = readonly [
  tag: string,
  attrs: Record<string, string | number | null | undefined>,
];

export interface PhIconDefinition {
  name: string;
  viewBox: string;
  nodes: readonly PhSvgNode[];
}
