/**
 * Layout configuration types for InteropLayout directive.
 *
 * Supports CSS flexbox properties with constrained vocabulary to prevent
 * "CSS prop soup" while maintaining type safety and predictability.
 */

/**
 * Supported flex-direction values
 */
export type LayoutDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';

/**
 * Supported justify-content values
 */
export type LayoutJustify = 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';

/**
 * Supported align-items values
 */
export type LayoutAlign = 'start' | 'end' | 'center' | 'stretch' | 'baseline';

/**
 * Supported flex-wrap values
 */
export type LayoutWrap = 'nowrap' | 'wrap' | 'wrap-reverse';

/**
 * Supported gap values mapped to design tokens
 */
export type LayoutGap = 0 | 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16 | 24;

/**
 * Complete layout configuration object
 */
export interface LayoutConfig {
  direction?: LayoutDirection;
  justify?: LayoutJustify;
  align?: LayoutAlign;
  wrap?: LayoutWrap;
  gap?: LayoutGap;
}

/**
 * CSS custom property mapping for layout values
 */
export const LAYOUT_CSS_VARS = {
  direction: '--ntr-layout-direction',
  justify: '--ntr-layout-justify',
  align: '--ntr-layout-align',
  wrap: '--ntr-layout-wrap',
  gap: '--ntr-layout-gap'
} as const;

/**
 * CSS value mapping for layout properties
 */
export const LAYOUT_CSS_VALUES = {
  justify: {
    start: 'flex-start',
    end: 'flex-end',
    center: 'center',
    between: 'space-between',
    around: 'space-around',
    evenly: 'space-evenly'
  },
  align: {
    start: 'flex-start',
    end: 'flex-end',
    center: 'center',
    stretch: 'stretch',
    baseline: 'baseline'
  },
  gap: {
    0: 'var(--ntr-layout-gap-0)',
    1: 'var(--ntr-layout-gap-1)',
    2: 'var(--ntr-layout-gap-2)',
    3: 'var(--ntr-layout-gap-3)',
    4: 'var(--ntr-layout-gap-4)',
    6: 'var(--ntr-layout-gap-6)',
    8: 'var(--ntr-layout-gap-8)',
    12: 'var(--ntr-layout-gap-12)',
    16: 'var(--ntr-layout-gap-16)',
    24: 'var(--ntr-layout-gap-24)'
  }
} as const;
