/**
 * InteropLayout directive and utilities
 *
 * Provides universal layout control for Interop components via CSS custom properties.
 * Supports constrained flexbox vocabulary to prevent "CSS prop soup" while maintaining
 * design system consistency through token-based values.
 */

export { InteropLayoutDirective } from './interop-layout.directive';
export { parseLayoutShorthand, layoutConfigToShorthand } from './layout-parser';
export {
  LayoutCapable,
  checkElementLayoutCapability,
  getLayoutVariableInfo,
  isLayoutCapableClass,
  LAYOUT_CAPABLE_MARKER
} from './layout-capable';
export type { LayoutCapable as ILayoutCapable } from './layout-capable';
export type {
  LayoutConfig,
  LayoutDirection,
  LayoutJustify,
  LayoutAlign,
  LayoutWrap,
  LayoutGap
} from './layout.types';
export { LAYOUT_CSS_VARS, LAYOUT_CSS_VALUES } from './layout.types';
