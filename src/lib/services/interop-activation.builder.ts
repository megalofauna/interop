import { InteropActivation } from "./interop-activation.service";
import {
  type ActivationHandler,
  type ActivationOptions,
} from "../utils/activation";

/**
 * Fluent builder overlay for `InteropActivation`.
 *
 * This optional helper lets consumers configure handlers with a chainable API
 * without changing the underlying service. It is intentionally lightweight and
 * tree-shakeable—import it only where you need fluent ergonomics.
 */
export class InteropActivationChain<TPayload = unknown> {
  private options: ActivationOptions;
  private handler?: ActivationHandler<TPayload>;
  private disposer?: () => void;

  constructor(
    private readonly interop: InteropActivation,
    private readonly id: string,
    initialOptions: ActivationOptions = {},
  ) {
    this.options = { ...initialOptions };
  }

  /**
   * Supply the activation handler function. Required before calling `register()`.
   */
  withHandler(handler: ActivationHandler<TPayload>): this {
    this.handler = handler;
    return this;
  }

  /**
   * Merge arbitrary activation options into the builder.
   */
  withOptions(options: ActivationOptions): this {
    this.options = { ...this.options, ...options };
    return this;
  }

  /**
   * Configure debounce duration (ms).
   */
  debounce(ms: number): this {
    this.options.debounceMs = ms;
    return this;
  }

  /**
   * Configure throttle duration (ms).
   */
  throttle(ms: number): this {
    this.options.throttleMs = ms;
    return this;
  }

  /**
   * Toggle one-time execution semantics.
   */
  once(enabled = true): this {
    this.options.once = enabled;
    return this;
  }

  /**
   * Toggle reentrancy (overlapping async executions).
   */
  reentrant(enabled = true): this {
    this.options.reentrant = enabled;
    return this;
  }

  /**
   * Convenience alias for `reentrant(false)`.
   */
  nonReentrant(): this {
    return this.reentrant(false);
  }

  /**
   * Attach lifecycle hooks (`onStart`, `onEnd`, `onError`) in one call.
   */
  hooks(hooks: Pick<ActivationOptions, "onStart" | "onEnd" | "onError">): this {
    this.options = { ...this.options, ...hooks };
    return this;
  }

  /**
   * Toggle debug logging for the managed activation.
   */
  debug(enabled = true): this {
    this.options.debug = enabled;
    return this;
  }

  /**
   * Finalize the builder by registering the handler with the underlying service.
   * Returns `this` so chaining can continue (e.g., `.register().enable()`).
   */
  register(): this {
    if (!this.handler) {
      throw new Error(
        "InteropActivationChain requires a handler before calling register().",
      );
    }
    this.dispose(); // ensure previous registration is cleaned up
    const effectiveOptions = { ...this.options };
    const { unregister } = this.interop.register(
      this.id,
      this.handler,
      effectiveOptions,
    );
    this.disposer = unregister;
    return this;
  }

  /**
   * Trigger the managed handler via the service.
   */
  trigger(payload: TPayload): this {
    this.interop.trigger(this.id, payload);
    return this;
  }

  /**
   * Forward enable/disable/cancel calls to the service.
   */
  enable(): this {
    this.interop.enable(this.id);
    return this;
  }

  disable(): this {
    this.interop.disable(this.id);
    return this;
  }

  cancel(): this {
    this.interop.cancel(this.id);
    return this;
  }

  /**
   * Unregister the handler if it was previously registered.
   */
  dispose(): this {
    if (this.disposer) {
      this.disposer();
      this.disposer = undefined;
    }
    return this;
  }

  /**
   * Inspect the current set of options (useful in tests).
   */
  snapshotOptions(): ActivationOptions {
    return { ...this.options };
  }
}

/**
 * Factory helper for creating a chain in a single call.
 *
 * @example
 * const saveChain = chainInteropActivation(interopActivation, "save")
 *   .withHandler(saveHandler)
 *   .debounce(200)
 *   .nonReentrant()
 *   .register();
 */
export function chainInteropActivation<TPayload = unknown>(
  interop: InteropActivation,
  id: string,
  initialOptions: ActivationOptions = {},
): InteropActivationChain<TPayload> {
  return new InteropActivationChain<TPayload>(interop, id, initialOptions);
}
