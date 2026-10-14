
/** One shape. Every Tabler icon is drawn with paths only. */
export interface IconPath {
	readonly d: string;
	readonly fill?: string;
	readonly stroke?: string;
	readonly opacity?: string;
}

export interface IconDefinition {
	/** The value of `name` on `svg[interop-icon]`, e.g. `tabler-check`. */
	readonly name: string;
	readonly viewBox: string;
	/** `none` for an outline icon, `currentColor` for a filled one. */
	readonly fill: string;
	readonly stroke: string;
	readonly paths: readonly IconPath[];
}

const icons = new Map<string, IconDefinition>();

/** Makes icons available by name. A later definition with the same name replaces the earlier one. */
export function registerIcons(...definitions: readonly IconDefinition[]): void {
	for (const definition of definitions) icons.set(definition.name, definition);
}

export function getIcon(name: string): IconDefinition | undefined {
	return icons.get(name);
}
