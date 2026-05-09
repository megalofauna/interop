import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  isDevMode,
} from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { InteropIconDefinition, InteropIconRegistry } from "../../iconsets/core";

/**
 * InteropIcon — Renders icons from the InteropIconRegistry or projects
 * arbitrary icon content from any third-party library.
 *
 * ## Registry path (primary)
 * Icons are registered at any DI scope via `provideInteropIcons()` and
 * rendered by name. The registry supports Phosphor, Tabler, and any custom
 * icons adapted via `fromSvg()`.
 *
 * ```html
 * <interop-icon name="ph-copy" [size]="16" />
 * <interop-icon name="tabler-camera" [size]="24" />
 * ```
 *
 * ## Projection path (escape hatch)
 * When `name` is not provided, InteropIcon renders projected content instead.
 * Use this to integrate any third-party icon component while still getting
 * Interop's sizing and accessibility wrapper.
 *
 * ```html
 * <interop-icon [size]="20" ariaLabel="Settings">
 *   <i-tabler name="settings" />
 * </interop-icon>
 * ```
 *
 * ## Security note — innerHTML
 * Icon SVG content is rendered via Angular's `DomSanitizer.bypassSecurityTrustHtml()`.
 * This is intentional and safe because:
 *
 * 1. `svgContent` comes exclusively from developer-provided static imports —
 *    it is never derived from user input, API responses, or dynamic strings.
 * 2. Icons enter the registry via explicit `provideInteropIcons(PhCopy, ...)` calls
 *    written by the application developer. The registry has no dynamic write path.
 * 3. Even if a consumer somehow passed a crafted string, Angular's sanitizer
 *    strips `<script>`, event handlers, and `javascript:` URLs regardless.
 *
 * `bypassSecurityTrustHtml` is used (rather than `sanitize`) to preserve valid
 * SVG attributes that Angular's sanitizer may otherwise strip (e.g. `clip-path`,
 * `mask`, `filter`).
 *
 * @example Basic
 * ```html
 * <interop-icon name="ph-check" [size]="16" />
 * ```
 *
 * @example Non-decorative (accessible)
 * ```html
 * <interop-icon name="ph-warning" [decorative]="false" ariaLabel="Warning" />
 * ```
 *
 * @example Stroke weight override
 * ```html
 * <!-- Bolder Phosphor icon (default is 16 in 256-unit space) -->
 * <interop-icon name="ph-copy" [strokeWidth]="24" />
 * <!-- Lighter Tabler icon (default is 2 in 24-unit space) -->
 * <interop-icon name="tabler-copy" [strokeWidth]="1.5" />
 * ```
 */
@Component({
  selector: "interop-icon",
  standalone: true,
  imports: [],
  templateUrl: "./interop-icon.html",
  styleUrl: "./interop-icon.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InteropIcon {
  private readonly _registry = inject(InteropIconRegistry);
  // DomSanitizer injected by string token to avoid circular import issues.
  // Safe to cast — Angular always provides this in the browser runtime.
  private readonly _sanitizer = inject(DomSanitizer);
  private readonly _el = inject(ElementRef<HTMLElement>);

  // ── Inputs ─────────────────────────────────────────────────────────────────

  /**
   * Icon registry key. When provided, the icon is looked up in the registry
   * and rendered via the SVG path. When absent, projected content is rendered.
   */
  readonly name = input<string | undefined>(undefined);

  /** Icon size in pixels. Applied to both `width` and `height` of the SVG. */
  readonly size = input<number>(24);

  /**
   * Stroke width override in viewBox coordinate units.
   * When not provided, the icon's own `defaultStrokeWidth` is used.
   *
   * Units are viewBox-relative: Phosphor icons use a 256×256 space (default 16),
   * Tabler uses 24×24 (default 2). These values are not directly comparable.
   */
  readonly strokeWidth = input<number | undefined>(undefined);

  /** Colour override. Accepts any CSS colour value. Defaults to `currentColor`. */
  readonly color = input<string | undefined>(undefined);

  /**
   * Whether this icon is purely decorative (`true`) or conveys meaning (`false`).
   * Decorative icons are hidden from screen readers (`aria-hidden="true"`).
   * Non-decorative icons require `ariaLabel`.
   */
  readonly decorative = input<boolean>(true);

  /**
   * Accessible label for non-decorative icons.
   * Ignored when `decorative` is `true`.
   */
  readonly ariaLabel = input<string | undefined>(undefined);

  // ── Computed ───────────────────────────────────────────────────────────────

  /** Resolved icon definition, or undefined if not found / name not provided. */
  readonly icon = computed<InteropIconDefinition | undefined>(() => {
    const n = this.name();
    return n ? this._registry.get(n) : undefined;
  });

  /** Whether to render the registry SVG path (vs. projected content). */
  readonly useRegistry = computed(() => !!this.name());

  /** Pixel size string for width/height attributes. */
  readonly sizeInPx = computed(() => `${this.size()}px`);

  /**
   * Effective stroke-width: explicit override → icon default → null.
   * Applied to the outer `<svg>` so all child elements inherit it.
   */
  readonly effectiveStrokeWidth = computed<number | null>(() => {
    const override = this.strokeWidth();
    if (override !== undefined) return override;
    return this.icon()?.defaultStrokeWidth ?? null;
  });

  /**
   * Trusted SVG inner content for innerHTML binding.
   *
   * Security rationale: see class-level JSDoc.
   */
  readonly trustedSvgContent = computed<SafeHtml | null>(() => {
    const icon = this.icon();
    if (!icon) return null;
    // Safe: svgContent originates from static developer imports, never user input.
    return this._sanitizer.bypassSecurityTrustHtml(icon.svgContent);
  });

  constructor() {
    if (isDevMode()) {
      // Validate accessibility contract
      const el = this._el.nativeElement;
      setTimeout(() => {
        if (!this.decorative() && !this.ariaLabel()) {
          console.warn(
            `InteropIcon: Icon "${this.name() ?? "(projected)"}" is marked as non-decorative ` +
              "but has no [ariaLabel]. Provide an accessible label or set [decorative]=\"true\".",
          );
        }
        if (this.name() && !this.icon()) {
          console.warn(
            `InteropIcon: Icon "${this.name()}" was not found in the registry. ` +
              "Register it via provideInteropIcons() at the app, module, or component level.",
          );
        }
      });
    }
  }
}
