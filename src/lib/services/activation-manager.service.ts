/**
 * ActivationManagerService
 *
 * Minimal, opt-in Angular service that registers, triggers, and manages
 * activation handlers by ID. It composes the pure activation utilities
 * (debounce, throttle, reentrancy, once) to provide a reusable registry
 * for cross-component scenarios, while remaining lightweight.
 *
 * Notes:
 * - This service is purely a coordination layer; it does not enforce
 *   accessibility patterns, ARIA roles, or keyboard behaviors. Keep those
 *   responsibilities within components or separate utilities/services.
 * - The underlying activation semantics are implemented by the shared
 *   utilities from `src/lib/utils/activation.ts`.
 *
 * Typical usage:
 * ```ts
 * // In a component or feature module
 * constructor(private activationManager: ActivationManagerService) {}
 *
 * ngOnInit() {
 *   const dispose = this.activationManager.register('save', async (payload) => {
 *     await this.save(payload);
 *     this.toast('Saved successfully');
 *   }, { debounceMs: 200, reentrant: false });
 *
 *   // Keep the returned disposer to unregister when appropriate
 *   this._dispose = dispose;
 * }
 *
 * onClickSave(item: Item) {
 *   this.activationManager.trigger('save', item);
 * }
 *
 * ngOnDestroy() {
 *   this._dispose?.();
 * }
 * ```
 */

import { Injectable } from "@angular/core";
import {
  type ActivationHandler,
  type ActivationOptions,
  type ManagedActivation,
  createActivationHandler,
} from "../utils/activation";

/**
 * Registration handle containing utilities to manage a registered handler.
 */
export interface ActivationRegistration<TPayload = unknown> {
  /**
   * Unregister the handler from the manager.
   */
  unregister(): void;

  /**
   * Direct access to the managed activation wrapper instance.
   * Use with care; prefer `trigger(id, payload)` for most cases.
   */
  instance: ManagedActivation<TPayload>;
}

/**
 * Service that registers activation handlers by ID and triggers them safely.
 */
@Injectable({ providedIn: "root" })
export class ActivationManagerService {
  /**
   * Internal registry of activation handlers keyed by ID.
   */
  private readonly registry = new Map<string, ManagedActivation<any>>();

  /**
   * Register a new activation handler under a given ID with guardrails and return a disposer.
   * Prefer this over ad-hoc callbacks to get consistent debounce/throttle/reentrancy/once behavior.
   * Minimal usage:
   * - Call `register(id, handler, options)` in initialization.
   * - Use `trigger(id, payload)` to invoke it.
   * - Call `unregister()` in teardown.
   *
   * Returns a registration handle with an `unregister()` function.
   * If a handler already exists for this ID, it will be replaced.
   *
   * @param id Unique identifier for the handler
   * @param handler The activation callback (sync or async)
   * @param options Guardrails such as debounce/throttle/reentrancy/once
   *
   * @example Register a throttled non-reentrant handler
   * ```ts
   * activationManager.register('submit', submitOrder, { throttleMs: 500, reentrant: false });
   * ```
   */
  register<TPayload = unknown>(
    id: string,
    handler: ActivationHandler<TPayload>,
    options: ActivationOptions = {},
  ): ActivationRegistration<TPayload> {
    const managed = createActivationHandler(handler, options);
    this.registry.set(id, managed as ManagedActivation<any>);

    const unregister = () => {
      const current = this.registry.get(id);
      if (current && current === managed) {
        // Cancel any pending debounced call before removal
        current.cancel();
        this.registry.delete(id);
      }
    };

    return {
      unregister,
      instance: managed,
    };
  }

  /**
   * Unregister a handler by ID (no-op if not present).
   * Use when the handler is no longer needed or on teardown.
   * Any pending debounced execution is cancelled automatically.
   *
   * @param id Identifier to remove
   */
  unregister(id: string): void {
    const inst = this.registry.get(id);
    if (inst) {
      inst.cancel();
      this.registry.delete(id);
    }
  }

  /**
   * Trigger a registered activation handler by ID with an optional payload.
   * Safe to call multiple times; guardrails are applied by the registered handler instance.
   * If the ID is not registered or disabled, this is a no-op.
   * If the ID is not registered, this is a no-op.
   *
   * Guardrails (debounce/throttle/reentrancy/once) are applied by the
   * registered handler instance, not this method.
   *
   * @param id Identifier of the registered handler
   * @param payload Data passed to the handler
   *
   * @example
   * ```ts
   * activationManager.trigger('save', item);
   * activationManager.trigger('toast', { message: 'Saved!' });
   * ```
   */
  trigger<TPayload = unknown>(id: string, payload: TPayload): void {
    const inst = this.registry.get(id) as
      | ManagedActivation<TPayload>
      | undefined;
    if (inst && inst.isEnabled()) {
      inst(payload);
    }
  }

  /**
   * Check whether a handler is registered for the given ID.
   */
  has(id: string): boolean {
    return this.registry.has(id);
  }

  /**
   * Enable a handler by ID if present.
   */
  enable(id: string): void {
    const inst = this.registry.get(id);
    inst?.enable();
  }

  /**
   * Disable a handler by ID if present (future triggers will be ignored).
   * Any scheduled debounced execution is cancelled.
   */
  disable(id: string): void {
    const inst = this.registry.get(id);
    if (inst) {
      inst.disable();
      inst.cancel();
    }
  }

  /**
   * Cancel any scheduled (debounced) execution for the handler with the given ID.
   * Does not affect a currently running handler.
   */
  cancel(id: string): void {
    const inst = this.registry.get(id);
    inst?.cancel();
  }

  /**
   * Get a list of all registered IDs. Useful for diagnostics.
   */
  listIds(): string[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Clear all registered handlers, cancelling any scheduled executions.
   * Use with care; typically called in teardown or when resetting application state.
   */
  clear(): void {
    for (const [id, inst] of this.registry) {
      inst.cancel();
      this.registry.delete(id);
    }
  }
}
