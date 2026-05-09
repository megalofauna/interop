import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  computed,
  input,
  inject,
  TrackByFunction,
  TemplateRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  type InteropCollectionInput,
  interopCollection,
} from "../../collection/public-api";
import { NormalizeSemanticsDirective } from "../../directives/normalize-semantics.directive";
import {
  InteropAttribute,
  SetAttrsConfig,
  PresetKey,
} from "../../services/interop-attribute.service";
import { createComponentTrackByFn } from "../../utils/track-by";
import { LayoutCapable } from "../../directives/interop-layout";

@LayoutCapable(["direction", "justify", "align", "wrap", "gap"])
@Component({
  selector:
    "ul[interop-list], ol[interop-list], dl[interop-list], interop-list",
  standalone: true,
  imports: [CommonModule],
  hostDirectives: [
    {
      directive: NormalizeSemanticsDirective,
    },
  ],

  templateUrl: "interop-list.html",
  styleUrls: ["interop-list.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InteropList<T = any> {
  private elementRef = inject(ElementRef);
  private attrsManager = inject(InteropAttribute);

  // Inputs
  /**
   * Determines how list items are tracked for change detection and DOM updates.
   *
   * Modes:
   * - "auto" (default): if an item is an object, uses common id keys ("id" or "_id"); otherwise falls back to index
   * - "index": always uses the item index; useful for stable lists or when no unique id exists
   * - function: a custom TrackByFunction<T> provided by the author
   *
   * Notes:
   * - For best performance with dynamic lists, prefer a stable unique id over index.
   * - When combined with `trackByField`, the field value is used first; if absent, falls back per mode.
   *
   * @example Use index-based tracking
   * ```ts
   * <ul interop-list [collection]="items" [trackBy]="'index'"></ul>
   * ```
   *
   * @example Use a custom trackBy function
   * ```ts
   * <ul interop-list [collection]="items" [trackBy]="(i, item) => item.sku"></ul>
   * ```
   */
  trackBy = input<TrackByFunction<T> | "auto" | "index">("auto");

  /**
   * Field name to use for tracking item identity when available.
   * If provided, the value of this field on the item is used as the track key.
   * If the field is missing or undefined on an item, tracking falls back to `trackBy` mode.
   *
   * @example Track by "id" field
   * ```ts
   * <ul interop-list [collection]="users" [trackByField]="'id'"></ul>
   * ```
   *
   * @example Track by custom field
   * ```ts
   * <ul interop-list [collection]="products" [trackByField]="'sku'"></ul>
   * ```
   */
  trackByField = input<keyof T | null>(null);

  collection = input<InteropCollectionInput<T>>();

  /**
   * Optional template for rendering each list item.
   * Receives the `$implicit` item and its `index`.
   *
   * @example
   * ```html
   * <ng-template #item let-item let-i="index">
   *   <li>{{ i + 1 }}. {{ item.name }}</li>
   * </ng-template>
   *
   * <ul interop-list [collection]="users" [listItemTemplate]="item"></ul>
   * ```
   */
  listItemTemplate = input<TemplateRef<any>>();

  /**
   * Optional preset key to apply semantic conformity attributes via ManageAttributesDirective.
   * When provided, the corresponding preset config will be supplied to the host directive's `manageAttrs` input.
   */
  attrsPreset = input<PresetKey | null>(null);

  // Resolved preset config for the host directive input mapping
  attrsPresetResolved = computed<SetAttrsConfig | null>(() => {
    const key = this.attrsPreset();
    return key ? this.attrsManager.Presets[key] : null;
  });

  // Resolved collection — handles arrays, signals, observables, promises,
  // iterables, and existing InteropCollection instances. Cleanup wired to
  // component DestroyRef.
  private readonly resolved = interopCollection<T>(this.collection);

  readonly items = this.resolved.items;

  /**
   * Internal resolver for Angular's `trackBy` to optimize DOM updates.
   *
   * Precedence:
   * 1. Explicit `"index"` mode returns the item index.
   * 2. `trackByField` when set uses the specified field value from the item, if defined.
   * 3. `"auto"` mode attempts common id keys (`id`, `_id`), then falls back to index.
   * 4. Custom `TrackByFunction<T>` when provided.
   *
   * This strategy minimizes DOM churn while preserving intuitive defaults.
   */
  trackByFn = createComponentTrackByFn<T>(
    () => this.trackBy(),
    () => this.trackByField(),
  );

  getItemText(item: T): string {
    if (item === null || item === undefined) return "";
    if (
      typeof item === "string" ||
      typeof item === "number" ||
      typeof item === "boolean"
    ) {
      return String(item);
    }
    if (typeof item === "object") {
      const obj = item as any;
      if ("name" in obj) return String(obj.name);
      if ("title" in obj) return String(obj.title);
      if ("label" in obj) return String(obj.label);
    }
    return JSON.stringify(item);
  }
}
