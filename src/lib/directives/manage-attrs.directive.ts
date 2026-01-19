import {
  Directive,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  ElementRef,
  Renderer2,
  SimpleChanges,
  inject,
} from "@angular/core";
import {
  InteropAttrs,
  SetAttrsConfig,
} from "../services/interop-attrs.service";

/**
 * ManageAttributesDirective
 *
 * A policy-aware, mutation-aware directive for applying HTML attributes to a host
 * element and its subtree via CSS selectors. Backed by InteropAttrs for
 * presets, composition, and performance hints.
 *
 * Design goals:
 * - Prefer native semantics: configs/presets should be used to rescue non-standard markup.
 * - Minimal and opt-in: authors provide configs or presets explicitly.
 * - Immediate children by default: use shallow selectors unless deep targeting is intended.
 * - Opt-out: honor selectors that avoid nodes with data-interop-managed="false".
 * - No override by default: do not clobber author attributes unless requested.
 *
 * Selector:
 * - `[manageAttrs]` primary input for new usage.
 *
 * Inputs:
 * - `manageAttrs`: SetAttrsConfig | null
 * - `override`: boolean (default false) — when true, existing attributes may be replaced
 * - `observeSubtree`: boolean | null — if null, auto-derived via service; otherwise enforced
 * - `debounceMs`: number (default 16) — debounce mutations to batch updates
 */
@Directive({
  selector: "[manageAttrs]",
  standalone: true,
})
export class ManageAttributesDirective implements OnInit, OnChanges, OnDestroy {
  private elementRef = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);
  private attrsManager = inject(InteropAttrs);

  /**
   * Primary config input (new)
   */
  @Input() manageAttrs: SetAttrsConfig | null = null;

  /**
   * When true, existing author-set attributes may be replaced.
   * Default: false (no override)
   */
  @Input() override: boolean = false;

  /**
   * If provided, enforces subtree observation. When null, the directive derives
   * optimal observer options from the provided config.
   */
  @Input() observeSubtree: boolean | null = null;

  /**
   * Debounce for mutation observer; batches updates.
   */
  @Input() debounceMs: number = 16;

  /**
   * Internal mutation observer and timer id
   */
  private mutationObserver?: MutationObserver;
  private debounceTimer: any = null;

  /**
   * Cached last-applied config snapshot to avoid repeated work
   */
  private lastAppliedConfigKey: string | null = null;

  ngOnInit(): void {
    this.applyAttributes();
    this.setupMutationObserver();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes["manageAttrs"] ||
      changes["override"] ||
      changes["observeSubtree"]
    ) {
      this.applyAttributes();
      this.resetMutationObserver();
    }
    if (changes["debounceMs"]) {
      // Only affects observer debouncing; keep current observer
    }
  }

  ngOnDestroy(): void {
    this.mutationObserver?.disconnect();
    this.mutationObserver = undefined;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Resolve the effective config.
   */
  private getEffectiveConfig(): SetAttrsConfig | null {
    return this.manageAttrs ?? null;
  }

  /**
   * Apply attributes using the manager service with current policy flags.
   * Avoid redundant work by caching a config fingerprint.
   */
  private applyAttributes(): void {
    const config = this.getEffectiveConfig();
    const host = this.elementRef.nativeElement;
    const fingerprint = this.fingerprintConfig(config);

    if (fingerprint === this.lastAppliedConfigKey) {
      // No change detected; skip
      return;
    }

    this.attrsManager.applyConfig(this.renderer, host, config, {
      override: this.override,
    });

    this.lastAppliedConfigKey = fingerprint;
  }

  /**
   * Setup MutationObserver with derived or enforced options.
   */
  private setupMutationObserver(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = undefined;
    }

    const config = this.getEffectiveConfig();
    if (!config) return;

    const derived = this.attrsManager.deriveObserverOptions(config);
    const subtree =
      typeof this.observeSubtree === "boolean"
        ? this.observeSubtree
        : derived.subtree;

    // Only observe if there is potential for DOM changes to affect selector matches
    this.mutationObserver = new MutationObserver(() => {
      this.scheduleReapply();
    });

    this.mutationObserver.observe(this.elementRef.nativeElement, {
      childList: true,
      subtree,
    });
  }

  /**
   * Reset observer when inputs affecting observation change.
   */
  private resetMutationObserver(): void {
    this.setupMutationObserver();
  }

  /**
   * Debounce reapplication to batch DOM changes.
   */
  private scheduleReapply(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.debounceTimer = setTimeout(
      () => {
        this.applyAttributes();
      },
      Math.max(0, this.debounceMs | 0),
    );
  }

  /**
   * Compute a simple fingerprint for the current config and override flag.
   * This is not a deep content hash; it balances speed and practicality.
   */
  private fingerprintConfig(config: SetAttrsConfig | null): string {
    if (!config) return `null|override:${this.override ? 1 : 0}`;

    // Build a deterministic string from the config keys and values
    const parts: string[] = [];
    const selectors = Object.keys(config).sort();
    for (const sel of selectors) {
      const attrs = config[sel];
      if (!attrs) {
        parts.push(`${sel}::null`);
        continue;
      }
      const keys = Object.keys(attrs).sort();
      const kv = keys.map((k) => `${k}=${String(attrs[k])}`).join("&");
      parts.push(`${sel}::${kv}`);
    }
    parts.push(`override:${this.override ? 1 : 0}`);
    return parts.join("|");
  }
}
