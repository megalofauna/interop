import type { LayoutConfig, LayoutDirection, LayoutJustify, LayoutAlign, LayoutWrap, LayoutGap } from './layout.types';

/**
 * Parse shorthand layout strings into LayoutConfig objects.
 *
 * Supports common layout patterns with space-separated tokens:
 * - "row center between" -> { direction: 'row', align: 'center', justify: 'between' }
 * - "column start wrap" -> { direction: 'column', align: 'start', wrap: 'wrap' }
 * - "row center gap-4" -> { direction: 'row', align: 'center', gap: 4 }
 */

const DIRECTION_TOKENS: Record<string, LayoutDirection> = {
  'row': 'row',
  'column': 'column',
  'col': 'column',
  'row-reverse': 'row-reverse',
  'column-reverse': 'column-reverse',
  'col-reverse': 'column-reverse'
};

const JUSTIFY_TOKENS: Record<string, LayoutJustify> = {
  'start': 'start',
  'end': 'end',
  'center': 'center',
  'between': 'between',
  'around': 'around',
  'evenly': 'evenly'
};

const ALIGN_TOKENS: Record<string, LayoutAlign> = {
  'start': 'start',
  'end': 'end',
  'center': 'center',
  'stretch': 'stretch',
  'baseline': 'baseline'
};

const WRAP_TOKENS: Record<string, LayoutWrap> = {
  'nowrap': 'nowrap',
  'wrap': 'wrap',
  'wrap-reverse': 'wrap-reverse'
};

/**
 * Parse a shorthand layout string into a LayoutConfig object.
 *
 * @param shorthand Space-separated layout tokens
 * @returns Parsed LayoutConfig or null if invalid/empty
 *
 * @example
 * ```typescript
 * parseLayoutShorthand('row center between')
 * // => { direction: 'row', align: 'center', justify: 'between' }
 *
 * parseLayoutShorthand('column start wrap gap-4')
 * // => { direction: 'column', align: 'start', wrap: 'wrap', gap: 4 }
 * ```
 */
export function parseLayoutShorthand(shorthand: string | null): LayoutConfig | null {
  if (!shorthand?.trim()) {
    return null;
  }

  const tokens = shorthand.trim().toLowerCase().split(/\s+/);
  const config: LayoutConfig = {};

  for (const token of tokens) {
    // Check for gap token (gap-N format)
    if (token.startsWith('gap-')) {
      const gapValue = token.slice(4);
      const numValue = parseInt(gapValue, 10);
      if (!isNaN(numValue) && isValidGap(numValue)) {
        config.gap = numValue as LayoutGap;
      }
      continue;
    }

    // Check other layout properties
    if (token in DIRECTION_TOKENS) {
      config.direction = DIRECTION_TOKENS[token];
    } else if (token in JUSTIFY_TOKENS) {
      config.justify = JUSTIFY_TOKENS[token];
    } else if (token in ALIGN_TOKENS) {
      config.align = ALIGN_TOKENS[token];
    } else if (token in WRAP_TOKENS) {
      config.wrap = WRAP_TOKENS[token];
    }
    // Ignore unrecognized tokens silently
  }

  return Object.keys(config).length > 0 ? config : null;
}

/**
 * Validate if a number is a valid gap value
 */
function isValidGap(value: number): boolean {
  const validGaps: number[] = [0, 1, 2, 3, 4, 6, 8, 12, 16, 24];
  return validGaps.includes(value);
}

/**
 * Convert LayoutConfig back to shorthand string (for debugging/serialization)
 *
 * @param config LayoutConfig object
 * @returns Shorthand string representation
 */
export function layoutConfigToShorthand(config: LayoutConfig): string {
  const tokens: string[] = [];

  if (config.direction) {
    tokens.push(config.direction);
  }
  if (config.align) {
    tokens.push(config.align);
  }
  if (config.justify) {
    tokens.push(config.justify);
  }
  if (config.wrap) {
    tokens.push(config.wrap);
  }
  if (config.gap !== undefined) {
    tokens.push(`gap-${config.gap}`);
  }

  return tokens.join(' ');
}
