import { SetAttrsConfig } from "../services/interop-attrs.service";

/**
 * Helpers to compose preset configs and improve ergonomics when using ManageAttributesDirective backed by InteropAttrs.
 *
 * Design goals:
 * - Make it easy to combine presets with ad hoc configs.
 * - Provide opt-out friendly selectors for item-like targets.
 * - Avoid overriding author-set attributes unless explicitly desired.
 * - Offer hints to scope MutationObserver efficiently based on selector usage.
 */

/**
 * Merge multiple SetAttrsConfig objects into a single config.
 * Later configs win on both selector collisions and attribute collisions.
 *
 * Example:
 * merge(
 *   Presets.ListPassive,
 *   { ':host': { 'aria-labelledby': 'myHeading' } }
 * )
 */
export function merge(
  ...configs: Array<SetAttrsConfig | null | undefined>
): SetAttrsConfig {
  const out: SetAttrsConfig = {};
  for (const cfg of configs) {
    if (!cfg) continue;
    for (const [selector, attrs] of Object.entries(cfg)) {
      if (!attrs) continue;
      out[selector] ??= {};
      Object.assign(out[selector]!, attrs);
    }
  }
  return out;
}

/**
 * Constrain generic item selectors to skip nodes opted out via data-interop-managed="false".
 * This is useful when a preset uses broad selectors (e.g., ":host > *") and you want
 * to respect a project-wide opt-out convention.
 *
 * By default, only the exact selector ":host > *" is constrained. Pass additional selectors
 * if you want more patterns to be rewritten to exclude opted-out nodes.
 *
 * Example:
 * withOptOut(Presets.ListPassive) ->
 * {
 *   ':host': { role: 'list' },
 *   ':host > :not([data-interop-managed="false"])': { role: 'listitem' }
 * }
 */
export function withOptOut(
  config: SetAttrsConfig,
  itemSelectors: string[] = [":host > *"],
): SetAttrsConfig {
  const out: SetAttrsConfig = {};
  for (const [selector, attrs] of Object.entries(config)) {
    if (!attrs) continue;

    const shouldConstrain =
      itemSelectors.includes(selector) ||
      // Also constrain trivial whitespace variants
      itemSelectors.includes(selector.replace(/\s+/g, " ").trim());

    if (shouldConstrain) {
      // Replace ":host > *" occurrences with an exclusion of opted-out nodes
      const constrained = selector.replace(
        /\:host\s*>\s*\*/g,
        ':host > :not([data-interop-managed="false"])',
      );
      out[constrained] = attrs;
    } else {
      out[selector] = attrs;
    }
  }
  return out;
}

/**
 * Runtime guard that prunes attributes which are already set on target elements,
 * to avoid overriding author-supplied values. This produces a filtered config to
 * pass into ManageAttributesDirective.
 *
 * Note:
 * - Requires the host element to resolve matches and check existing attributes.
 * - This function does not execute DOM mutations; it only computes a safe config.
 *
 * Example:
 * const safe = noOverride(hostEl, Presets.ListPassiveWithLabelledBy);
 * <interop-list [manageAttrs]="safe">...</interop-list>
 */
export function noOverride(
  host: Element,
  config: SetAttrsConfig,
): SetAttrsConfig {
  const out: SetAttrsConfig = {};

  for (const [selector, attrs] of Object.entries(config)) {
    if (!attrs) continue;

    const targets: Element[] =
      selector === ":host"
        ? [host]
        : // Query within the host subtree only
          Array.from(host.querySelectorAll(selector));

    // Build a pruned attribute map: include keys only if at least one target lacks the attribute
    const prunedAttrs: Record<string, string | number | boolean> = {};
    for (const [name, value] of Object.entries(attrs)) {
      const missingOnSomeTarget = targets.some((el) => !el.hasAttribute(name));
      if (missingOnSomeTarget) {
        prunedAttrs[name] = value;
      }
    }

    if (Object.keys(prunedAttrs).length > 0) {
      out[selector] = prunedAttrs;
    }
  }

  return out;
}

/**
 * Derive efficient MutationObserver options based on selectors used in a config.
 * If the config only targets ":host" and direct children (":host > ..."), subtree
 * observation can be disabled for performance.
 *
 * Returns a minimal option object you can feed into an observer:
 * { childList: true, subtree: boolean }
 */
export function deriveObserverOptions(config: SetAttrsConfig): {
  childList: boolean;
  subtree: boolean;
} {
  const selectors = Object.keys(config);

  // Consider only ":host" and direct child selectors as "shallow"
  const isShallowSelector = (sel: string) =>
    sel === ":host" || /^:host\s*>\s*/.test(sel);

  const onlyShallow =
    selectors.length > 0 && selectors.every(isShallowSelector);

  return {
    childList: true,
    subtree: !onlyShallow,
  };
}

/**
 * Utility to detect whether a config contains any deep selectors (beyond direct children).
 * Can be used for conditional behavior outside of observers (e.g., deciding batching strategy).
 */
export function hasDeepSelectors(config: SetAttrsConfig): boolean {
  const selectors = Object.keys(config);
  if (selectors.length === 0) return false;
  return selectors.some((sel) => sel !== ":host" && !/^:host\s*>\s*/.test(sel));
}
