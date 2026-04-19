import {
	Directive,
	ElementRef,
	computed,
	effect,
	inject,
	input,
	isDevMode,
} from "@angular/core";
import type { LayoutConfig } from "./layout.types";
import { LAYOUT_CSS_VARS, LAYOUT_CSS_VALUES } from "./layout.types";
import { parseLayoutShorthand } from "./layout-parser";

/**
 * InteropLayout - Universal layout directive for Interop components.
 *
 * Provides controlled flexbox layout overrides via CSS custom properties.
 * Works with any component that opts into layout capability by consuming
 * the --itx-layout-* CSS variables in their stylesheets.
 *
 * Key features:
 * - Constrained vocabulary prevents "CSS prop soup"
 * - Token-based gap values for design system consistency
 * - Shorthand string syntax for common cases
 * - Explicit object syntax for complex cases
 * - Dev mode validation and warnings
 *
 * @example Shorthand syntax (80% use case)
 * ```html
 * <interop-toolbar interopLayout="row center between">
 *   <button>Save</button>
 *   <button>Cancel</button>
 * </interop-toolbar>
 * ```
 *
 * @example Explicit object syntax
 * ```html
 * <interop-stack [interopLayoutConfig]="{ direction: 'column', gap: 4, align: 'stretch' }">
 *   <interop-card>Card 1</interop-card>
 *   <interop-card>Card 2</interop-card>
 * </interop-stack>
 * ```
 *
 * @example Gap spacing with design tokens
 * ```html
 * <interop-button-group interopLayout="row center gap-2">
 *   <button interop-button>Edit</button>
 *   <button interop-button>Delete</button>
 * </interop-button-group>
 * ```
 */
@Directive({
	selector: "[interopLayout]",
	standalone: true,
})
export class InteropLayoutDirective {
	private elementRef = inject(ElementRef);

	/**
	 * Shorthand layout string for common use cases.
	 * Space-separated tokens: direction, align, justify, wrap, gap-N
	 *
	 * @example "row center between gap-4"
	 */
	interopLayout = input<string | null>(null);

	/**
	 * Explicit layout configuration object for complex cases.
	 * Takes precedence over shorthand string.
	 */
	interopLayoutConfig = input<LayoutConfig | null>(null);

	/**
	 * Resolved layout configuration from either input method.
	 */
	private resolvedConfig = computed<LayoutConfig | null>(() => {
		// Explicit config takes precedence
		const explicit = this.interopLayoutConfig();
		if (explicit) {
			return explicit;
		}

		// Parse shorthand string
		const shorthand = this.interopLayout();
		return parseLayoutShorthand(shorthand);
	});

	constructor() {
		// Apply CSS custom properties when configuration changes
		effect(() => {
			const config = this.resolvedConfig();
			const element = this.elementRef.nativeElement;

			if (config) {
				this.applyLayoutVars(element, config);
				this.setDataAttribute(element, config);
			} else {
				this.clearLayoutVars(element);
				element.removeAttribute("data-interop-layout");
			}
		});

		// Validate in development mode
		if (isDevMode()) {
			effect(() => {
				const config = this.resolvedConfig();
				if (config) {
					this.validateLayoutConfig(config);
				}
			});
		}
	}

	/**
	 * Apply CSS custom properties to the host element
	 */
	private applyLayoutVars(element: HTMLElement, config: LayoutConfig): void {
		// Set direction
		if (config.direction) {
			element.style.setProperty(LAYOUT_CSS_VARS.direction, config.direction);
		}

		// Set justify-content with CSS value mapping
		if (config.justify) {
			const cssValue = LAYOUT_CSS_VALUES.justify[config.justify];
			element.style.setProperty(LAYOUT_CSS_VARS.justify, cssValue);
		}

		// Set align-items with CSS value mapping
		if (config.align) {
			const cssValue = LAYOUT_CSS_VALUES.align[config.align];
			element.style.setProperty(LAYOUT_CSS_VARS.align, cssValue);
		}

		// Set flex-wrap
		if (config.wrap) {
			element.style.setProperty(LAYOUT_CSS_VARS.wrap, config.wrap);
		}

		// Set gap with token mapping
		if (config.gap !== undefined) {
			const cssValue = LAYOUT_CSS_VALUES.gap[config.gap];
			element.style.setProperty(LAYOUT_CSS_VARS.gap, cssValue);
		}
	}

	/**
	 * Clear all layout CSS custom properties
	 */
	private clearLayoutVars(element: HTMLElement): void {
		Object.values(LAYOUT_CSS_VARS).forEach((varName) => {
			element.style.removeProperty(varName);
		});
	}

	/**
	 * Set data attribute for styling hooks (optional)
	 */
	private setDataAttribute(element: HTMLElement, config: LayoutConfig): void {
		const tokens: string[] = [];

		if (config.direction) tokens.push(config.direction);
		if (config.align) tokens.push(config.align);
		if (config.justify) tokens.push(config.justify);
		if (config.wrap) tokens.push(config.wrap);
		if (config.gap !== undefined) tokens.push(`gap-${config.gap}`);

		if (tokens.length > 0) {
			element.setAttribute("data-interop-layout", tokens.join(" "));
		}
	}

	/**
	 * Validate layout configuration in development mode
	 */
	private validateLayoutConfig(config: LayoutConfig): void {
		const element = this.elementRef.nativeElement;
		const tagName = element.tagName.toLowerCase();

		// Check if element is likely layout-capable
		const isLayoutCapable = this.checkLayoutCapability(element);

		if (!isLayoutCapable) {
			console.warn(
				`InteropLayout: Applied to <${tagName}> which may not be layout-capable. ` +
					`Consider using on container elements or components that consume --itx-layout-* variables.`,
				element,
			);
		}

		// Warn about potentially conflicting properties
		if (
			config.direction?.includes("column") &&
			config.justify === "between" &&
			!config.gap
		) {
			console.warn(
				'InteropLayout: Using justify="between" with column direction may create unexpected spacing. ' +
					'Consider adding gap or using align="stretch" instead.',
				element,
			);
		}
	}

	/**
	 * Heuristic check for layout capability
	 */
	private checkLayoutCapability(element: HTMLElement): boolean {
		const tagName = element.tagName.toLowerCase();

		// Known Interop layout-capable components
		const interopLayoutComponents = [
			"interop-toolbar",
			"interop-stack",
			"interop-button-group",
			"interop-list",
			"interop-grid",
		];

		if (interopLayoutComponents.includes(tagName)) {
			return true;
		}

		// Generic container elements
		const containerElements = [
			"div",
			"section",
			"header",
			"footer",
			"nav",
			"main",
		];
		if (containerElements.includes(tagName)) {
			return true;
		}

		// Check for existing display: flex
		const computedStyle = getComputedStyle(element);
		if (computedStyle.display === "flex") {
			return true;
		}

		return false;
	}
}
