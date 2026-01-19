import { SetAttrsConfig } from "../services/interop-attrs.service";

/**
 * Preset registry for semantic conformity using ManageAttributesDirective backed by InteropAttrs.
 *
 * Design principles:
 * - Prefer native semantics: do not use these presets for native UL/OL/LI.
 * - Minimal and opt-in: authors choose presets only when they need passive semantics on non-standard elements.
 * - Immediate children by default: avoid deep application except where authors explicitly mark nested content.
 * - Opt-out convention: any node with data-interop-managed="false" is skipped.
 *
 * Usage examples (Angular templates):
 *
 * <interop-list [setAttrs]="Presets.ListPassive">
 *   <div>Item A</div>
 *   <div>Item B</div>
 * </interop-list>
 *
 * <h2 id="myListHeading">Fruits</h2>
 * <interop-list
 *   [setAttrs]="{
 *     ...Presets.ListPassiveWithLabelledBy,
 *     ':host': { role: 'list', 'aria-labelledby': 'myListHeading' }
 *   }"
 * >
 *   <div>Apple</div>
 *   <div>Banana</div>
 * </interop-list>
 *
 * <div [setAttrs]="Presets.ListNestedPassive">
 *   <span>Item 1</span>
 *   <div data-nested-list>
 *     <span>Nested A</span>
 *     <span>Nested B</span>
 *   </div>
 * </div>
 */
export const Presets = {
  /**
   * Passive list semantics for non-semantic containers and immediate children.
   * Applies minimal roles only where native semantics are absent.
   *
   * Notes:
   * - Do not apply to native UL/OL or LI elements.
   * - Immediate children only; avoids mislabeling deep descendants.
   * - Elements can opt out via data-interop-managed="false".
   */
  ListPassive: {
    ":host": { role: "list" },
    ':host > :not([data-interop-managed="false"])': { role: "listitem" },
  } satisfies SetAttrsConfig,

  /**
   * Passive list with author-provided name via aria-labelledby.
   * Author must supply a valid ID value when binding.
   *
   * Example:
   * [setAttrs]="{
   *   ...Presets.ListPassiveWithLabelledBy,
   *   ':host': { role: 'list', 'aria-labelledby': 'headingId' }
   * }"
   */
  ListPassiveWithLabelledBy: {
    ":host": { role: "list", "aria-labelledby": "" }, // author fills the value
    ':host > :not([data-interop-managed="false"])': { role: "listitem" },
  } satisfies SetAttrsConfig,

  /**
   * Passive nested lists: author marks nested roots with data-nested-list.
   * Applies roles only to marked subtrees and their immediate children.
   *
   * Example:
   * <div [setAttrs]="Presets.ListNestedPassive">
   *   <span>Item 1</span>
   *   <div data-nested-list>
   *     <span>Nested A</span>
   *     <span>Nested B</span>
   *   </div>
   * </div>
   */
  ListNestedPassive: {
    ":host": { role: "list" },
    ':host > :not([data-interop-managed="false"])': { role: "listitem" },
    ":host [data-nested-list]": { role: "list" },
    ':host [data-nested-list] > :not([data-interop-managed="false"])': {
      role: "listitem",
    },
  } satisfies SetAttrsConfig,

  /**
   * Minimal naming-only preset for any component needing a name.
   * Does not change roles; authors provide the value.
   *
   * Example:
   * [setAttrs]="{ ...Presets.MinimalNaming, ':host': { 'aria-label': 'My Widget' } }"
   */
  MinimalNaming: {
    ":host": { "aria-label": "" }, // author supplies the value
  } satisfies SetAttrsConfig,
} as const;

export type PresetKey = keyof typeof Presets;
