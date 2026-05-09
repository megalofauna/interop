import { InjectionToken, Signal } from "@angular/core";

/**
 * Minimal context interface exposed by InteropTabs to its descendant panels.
 * Using a token + interface instead of direct component injection avoids the
 * circular dependency that would arise from InteropTabPanel importing InteropTabs
 * (which imports InteropTabPanel).
 */
export interface InteropTabsContext {
  /**
   * Unique ID prefix for this tabs instance. Used by panels to build stable
   * ARIA IDs without requiring parent coordination after construction.
   */
  readonly uid: string;

  /**
   * The resolved active panel key. Accounts for default (first panel),
   * controlled (parent-provided), and dynamic panel membership changes.
   */
  readonly resolvedActive: Signal<string | null>;

  /**
   * Select a panel by key. Called by panels or keyboard handlers.
   */
  selectPanel(key: string): void;
}

export const INTEROP_TABS_CONTEXT = new InjectionToken<InteropTabsContext>(
  "INTEROP_TABS_CONTEXT",
);
