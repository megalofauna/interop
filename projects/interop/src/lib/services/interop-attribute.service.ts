import { Injectable, Renderer2 } from "@angular/core";

/**
 * Configuration for attribute targeting
 * Keys: CSS selectors scoped to a host element
 * Values: map of attribute name -> value
 * Use null to disable a selector entirely
 */
export interface SetAttrsConfig {
  [selector: string]: Record<string, string | number | boolean> | null;
}

/**
 * Centralized service for attribute presets, composition helpers, and policy-aware application.
 *
 * Goals:
 * - Prefer native semantics: presets are for rescue scenarios on non-standard elements.
 * - Minimal and opt-in: authors choose when to apply presets.
 * - Immediate children by default: avoid deep application except when explicitly marked.
 * - Opt-out support: skip nodes with data-interop-managed="false".
 * - No override by default: do not clobber author-specified attributes unless requested.
 */
@Injectable({ providedIn: "root" })
export class InteropAttribute {
  /**
   * Presets for common semantic conformity scenarios.
   * Authors should bind these via a directive or programmatic application.
   *
   * Do not apply list presets to native UL/OL/LI — prefer native semantics.
   */
  readonly Presets: Readonly<Record<PresetKey, SetAttrsConfig>> = {
    ListPassive: {
      ":host": { role: "list" },
      ':host > :not([data-interop-managed="false"])': { role: "listitem" },
    },

    ListPassiveWithLabelledBy: {
      ":host": { role: "list", "aria-labelledby": "" }, // author supplies ID
      ':host > :not([data-interop-managed="false"])': { role: "listitem" },
    },

    ListNestedPassive: {
      ":host": { role: "list" },
      ':host > :not([data-interop-managed="false"])': { role: "listitem" },
      ":host [data-nested-list]": { role: "list" },
      ':host [data-nested-list] > :not([data-interop-managed="false"])': {
        role: "listitem",
      },
    },

    MinimalNaming: {
      ":host": { "aria-label": "" }, // author supplies label text
    },
  };

  /**
   * Merge multiple configs. Later configs win on collisions.
   */
  merge(...configs: Array<SetAttrsConfig | null | undefined>): SetAttrsConfig {
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
   * Constrain broad item selectors to skip nodes opted out via data-interop-managed="false".
   * By default, rewrites ":host > *" to exclude opted-out nodes.
   */
  withOptOut(
    config: SetAttrsConfig,
    itemSelectors: string[] = [":host > *"],
  ): SetAttrsConfig {
    const out: SetAttrsConfig = {};

    // Normalize the itemSelectors list too so callers can pass either spacing.
    const normalizedItemSelectors = new Set(
      itemSelectors.map((s) => s.replace(/\s+/g, " ").trim()),
    );

    for (const [selector, attrs] of Object.entries(config)) {
      if (!attrs) continue;

      const normalized = selector.replace(/\s+/g, " ").trim();
      const shouldConstrain =
        normalizedItemSelectors.has(selector) ||
        normalizedItemSelectors.has(normalized);

      if (shouldConstrain) {
        // Constrain to skip opt-out nodes for any designated item selector.
        const constrained = ':host > :not([data-interop-managed="false"])';
        out[constrained] = attrs;
      } else {
        out[selector] = attrs;
      }
    }

    return out;
  }

  /**
   * Prune attributes for targets that already define them to avoid overriding author values.
   * Returns a filtered config safe to apply.
   */
  noOverride(host: Element, config: SetAttrsConfig): SetAttrsConfig {
    const out: SetAttrsConfig = {};

    for (const [selector, attrs] of Object.entries(config)) {
      if (!attrs) continue;

      const targets =
        selector.replace(/\s+/g, " ").trim() === ":host"
          ? [host]
          : safeQueryAll(host, selector);

      const prunedAttrs: Record<string, string | number | boolean> = {};

      for (const [name, value] of Object.entries(attrs)) {
        const missingOnSomeTarget = targets.some(
          (el) => !el.hasAttribute(name),
        );
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
   * Decide whether subtree observation is needed based on selectors used.
   * Use to configure MutationObserver efficiently.
   */
  deriveObserverOptions(config: SetAttrsConfig): {
    childList: boolean;
    subtree: boolean;
  } {
    const selectors = Object.keys(config).map(normalizeSelectorForAnalysis);

    const onlyShallow =
      selectors.length > 0 &&
      selectors.every((sel) => sel === ":host" || /^:host\s*>\s*/.test(sel));

    return {
      childList: true,
      subtree: !onlyShallow,
    };
  }

  /**
   * Detect whether a config contains any deep selectors (beyond direct children).
   */
  hasDeepSelectors(config: SetAttrsConfig): boolean {
    const selectors = Object.keys(config).map(normalizeSelectorForAnalysis);
    if (selectors.length === 0) return false;

    return selectors.some(
      (sel) => sel !== ":host" && !/^:host\s*>\s*/.test(sel),
    );
  }

  /**
   * Apply a config to the host element's subtree using the provided Renderer2.
   * Policy:
   * - If override is false, existing author attributes will not be replaced.
   * - Attributes are normalized to strings; boolean becomes "true"/"false".
   * - Invalid selectors are ignored.
   */
  applyConfig(
    renderer: Renderer2,
    host: Element,
    config: SetAttrsConfig | null | undefined,
    options: { override?: boolean } = {},
  ): void {
    if (!config) return;

    const allowOverride = !!options.override;

    for (const [selector, attrs] of Object.entries(config)) {
      if (!attrs) continue;

      const targets =
        selector.replace(/\s+/g, " ").trim() === ":host"
          ? [host]
          : safeQueryAll(host, selector);

      for (const el of targets) {
        for (const [name, value] of Object.entries(attrs)) {
          // Type guard is currently redundant, but safe if you widen types later
          if (!isValidAttrValue(value)) continue;

          const stringValue = normalizeAttrValue(value);
          const hasExisting = el.hasAttribute(name);

          if (!hasExisting || allowOverride) {
            renderer.setAttribute(el, name, stringValue);
          }
        }
      }
    }
  }
}

/**
 * Keys of available presets.
 */
export type PresetKey =
  | "ListPassive"
  | "ListPassiveWithLabelledBy"
  | "ListNestedPassive"
  | "MinimalNaming";

/**
 * Safe query that catches invalid selectors and returns an empty array on failure.
 */
function safeQueryAll(root: Element, selector: string): Element[] {
  const q = normalizeSelectorForQuery(selector);

  try {
    return Array.from(root.querySelectorAll(q));
  } catch (err) {
    // Invalid selector; ignore gracefully
    console.warn(
      `Invalid CSS selector: "${selector}" (normalized: "${q}")`,
      err,
    );
    return [];
  }
}

/**
 * Normalize Interop selector DSL into a selector usable with Element.querySelectorAll().
 *
 * Why this exists:
 * - Interop configs allow `:host` as a *DSL token* to express "relative to the host element".
 * - DOM APIs do NOT accept `:host` in regular document selectors (it’s a Shadow DOM concept).
 * - DOM APIs DO accept `:scope`, which represents the current query root.
 *
 * Behavior:
 * - Collapses whitespace and trims.
 * - Rewrites a leading `:host` token into `:scope`.
 * - Leaves all other selector text intact.
 *
 * Examples:
 * - `:host`                          -> `:scope`
 * - `:host > *`                      -> `:scope > *`
 * - `:host [data-nested-list] > *`   -> `:scope [data-nested-list] > *`
 */
function normalizeSelectorForQuery(selector: string): string {
  const normalized = selector.replace(/\s+/g, " ").trim();
  return normalized.replace(/^:host\b/, ":scope");
}

/**
 * Normalize Interop selector DSL into a canonical form for analysis.
 *
 * Use this when you are not actually querying the DOM, but you want consistent checks such as:
 * - "is this selector shallow (direct children only) or deep (subtree)?"
 * - "does this selector address the host itself?"
 *
 * Behavior:
 * - Collapses whitespace and trims.
 * - Leaves `:host` in place (unlike normalizeSelectorForQuery), because this is for
 *   *config analysis*, not DOM querying.
 */
function normalizeSelectorForAnalysis(selector: string): string {
  return selector.replace(/\s+/g, " ").trim();
}

/**
 * Checks if a value is valid for an HTML attribute
 */
function isValidAttrValue(value: string | number | boolean): boolean {
  return value !== null && value !== undefined;
}

/**
 * Normalizes attribute values to strings
 */
function normalizeAttrValue(value: string | number | boolean): string {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return String(value);
}
