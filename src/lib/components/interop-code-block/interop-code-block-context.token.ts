import { InjectionToken, Signal } from "@angular/core";

/**
 * Minimal context interface exposed by InteropCodeBlock to descendant components.
 *
 * Using a token + interface instead of direct component injection avoids circular
 * dependencies and keeps the contract lean. Phase 2 consumers (e.g. InteropTabs
 * adapting inside a code block) inject this token to participate in language
 * synchronization without knowing about the full component class.
 */
export interface InteropCodeBlockContext {
  /**
   * Stable UID for this code block instance. Used to build ARIA IDs for
   * generated elements without parent coordination after construction.
   */
  readonly uid: string;

  /**
   * The sync key used for cross-block language synchronization via InteropActivation.
   * Null when cross-block sync is not configured.
   */
  readonly syncKey: Signal<string | null>;

  /**
   * The currently active language key. Used in Phase 2 by adapted InteropTabs
   * to stay in sync with the active panel selection.
   */
  readonly activeLanguage: Signal<string | null>;

  /**
   * Set the active language. Called by child components (e.g. adapted InteropTabs)
   * to propagate language selection up to the code block for cross-block sync.
   */
  setActiveLanguage(key: string): void;
}

export const INTEROP_CODE_BLOCK_CONTEXT =
  new InjectionToken<InteropCodeBlockContext>("INTEROP_CODE_BLOCK_CONTEXT");
