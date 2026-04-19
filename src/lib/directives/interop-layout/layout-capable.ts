/**
 * Layout capability interface and utilities for Interop components.
 *
 * Provides a contract for components that can consume layout directives
 * and utilities for checking layout capability at runtime.
 */

/**
 * Interface for components that support InteropLayout directive.
 * Components implementing this interface should consume --itx-layout-* CSS variables.
 */
export interface LayoutCapable {
	readonly supportsLayout: true;
	readonly supportedLayoutProps: ReadonlyArray<
		"direction" | "justify" | "align" | "wrap" | "gap"
	>;
}

/**
 * Marker for layout-capable components to declare their support.
 * Add this to component classes that consume layout variables.
 */
export const LAYOUT_CAPABLE_MARKER = Symbol("InteropLayoutCapable");

/**
 * Check if a component class is marked as layout-capable
 */
export function isLayoutCapableClass(componentClass: any): boolean {
	return componentClass && componentClass[LAYOUT_CAPABLE_MARKER] === true;
}

/**
 * Decorator to mark a component class as layout-capable
 */
export function LayoutCapable(
	supportedProps: Array<"direction" | "justify" | "align" | "wrap" | "gap"> = [
		"direction",
		"justify",
		"align",
		"wrap",
		"gap",
	],
) {
	return function <T extends { new (...args: any[]): {} }>(constructor: T) {
		(constructor as any)[LAYOUT_CAPABLE_MARKER] = true;
		(constructor as any).supportedLayoutProps = supportedProps;
		return constructor;
	};
}

/**
 * Runtime check for layout capability based on element characteristics
 */
export function checkElementLayoutCapability(element: HTMLElement): {
	isCapable: boolean;
	reason: string;
} {
	const tagName = element.tagName.toLowerCase();

	// Known Interop layout-capable components
	const interopLayoutComponents = [
		"interop-toolbar",
		"interop-stack",
		"interop-button-group",
		"interop-list",
		"interop-grid",
		"interop-card",
	];

	if (interopLayoutComponents.includes(tagName)) {
		return {
			isCapable: true,
			reason: "Known layout-capable Interop component",
		};
	}

	// Generic container elements
	const containerElements = [
		"div",
		"section",
		"header",
		"footer",
		"nav",
		"main",
		"article",
		"aside",
	];
	if (containerElements.includes(tagName)) {
		return { isCapable: true, reason: "Generic container element" };
	}

	// Check computed styles
	const computedStyle = getComputedStyle(element);

	if (computedStyle.display === "flex") {
		return { isCapable: true, reason: "Element has display: flex" };
	}

	if (computedStyle.display === "grid") {
		return {
			isCapable: true,
			reason: "Element has display: grid (partial support)",
		};
	}

	// Check for layout-related CSS variables
	const hasLayoutVars = [
		"--itx-layout-direction",
		"--itx-layout-justify",
		"--itx-layout-align",
		"--itx-layout-wrap",
		"--itx-layout-gap",
	].some((varName) => {
		const value = computedStyle.getPropertyValue(varName);
		return value && value.trim() !== "";
	});

	if (hasLayoutVars) {
		return { isCapable: true, reason: "Element consumes layout CSS variables" };
	}

	// Form elements and inline elements are typically not layout containers
	const nonLayoutElements = [
		"input",
		"button",
		"select",
		"textarea",
		"label",
		"span",
		"a",
		"strong",
		"em",
		"code",
		"img",
	];

	if (nonLayoutElements.includes(tagName)) {
		return {
			isCapable: false,
			reason: `${tagName} elements are typically not layout containers`,
		};
	}

	return { isCapable: false, reason: "No layout capability indicators found" };
}

/**
 * Get CSS variable consumption info for debugging
 */
export function getLayoutVariableInfo(
	element: HTMLElement,
): Record<string, string | null> {
	const computedStyle = getComputedStyle(element);

	return {
		direction: computedStyle.getPropertyValue("--itx-layout-direction") || null,
		justify: computedStyle.getPropertyValue("--itx-layout-justify") || null,
		align: computedStyle.getPropertyValue("--itx-layout-align") || null,
		wrap: computedStyle.getPropertyValue("--itx-layout-wrap") || null,
		gap: computedStyle.getPropertyValue("--itx-layout-gap") || null,
	};
}
