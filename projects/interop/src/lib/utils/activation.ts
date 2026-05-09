/**
 * Activation utilities for managing interactive callbacks with guardrails:
 * - Debounce: postpone execution until triggers stop for N ms
 * - Throttle: limit execution to at most once per N ms
 * - Reentrancy: prevent overlapping async executions (or allow explicitly)
 * - Once: auto-disable after the first successful activation
 *
 * These are pure utilities (no Angular DI). Components can opt-in when needed,
 * and a future service/registry can compose these for cross-component scenarios.
 */

export type ActivationOptions = {
  /**
   * Debounce window in milliseconds.
   * If set, the handler executes only after triggers stop for this duration.
   */
  debounceMs?: number;

  /**
   * Throttle window in milliseconds.
   * If set, the handler executes at most once per this duration.
   *
   * Notes:
   * - When both debounce and throttle are specified, debounce will schedule,
   *   and throttle will suppress executions too close together.
   */
  throttleMs?: number;

  /**
   * Whether to allow overlapping executions for async handlers.
   * Default false (prevent reentrancy): if a previous execution is still running,
   * subsequent triggers are ignored until it completes.
   */
  reentrant?: boolean;

  /**
   * Auto-disable after first successful execution.
   * Subsequent triggers are ignored unless re-enabled.
   */
  once?: boolean;

  /**
   * Lifecycle hooks for observability.
   * These are best-effort; errors in hooks are swallowed to avoid breaking the handler.
   */
  onStart?: () => void;
  onEnd?: (result: unknown) => void;
  onError?: (error: unknown) => void;

  /**
   * Enable simple debug logging for timing and lock state.
   */
  debug?: boolean;
};

export type ActivationHandler<TPayload = void> = (
  payload: TPayload,
) => Promise<unknown> | unknown;

/**
 * An augmented activation function with control methods to manage its runtime state.
 */
export type ManagedActivation<TPayload = void> = ActivationHandler<TPayload> & {
  /**
   * Cancel any scheduled (debounced) execution that hasn't run yet.
   * Does not affect running executions.
   */
  cancel(): void;

  /**
   * Disable the handler (no-op on future triggers).
   */
  disable(): void;

  /**
   * Enable the handler (if it was disabled or consumed by `once`).
   */
  enable(): void;

  /**
   * Returns whether the handler is currently enabled.
   */
  isEnabled(): boolean;
};

/**
 * Create a guarded activation handler with debounce/throttle/reentrancy/once semantics.
 *
 * @example Debounce only
 * const activate = createActivationHandler(saveItem, { debounceMs: 250 });
 * button.addEventListener('click', () => activate(item));
 *
 * @example Throttle and non-reentrant async
 * const activate = createActivationHandler(asyncSubmit, { throttleMs: 500, reentrant: false });
 *
 * @example Once
 * const activate = createActivationHandler(trackFirstOpen, { once: true });
 *
 * @example Lifecycle hooks
 * const activate = createActivationHandler(doThing, {
 *   onStart: () => console.log('start'),
 *   onEnd: (res) => console.log('done', res),
 *   onError: (err) => console.error('error', err),
 * });
 */
export function createActivationHandler<TPayload = void>(
  handler: ActivationHandler<TPayload>,
  options: ActivationOptions = {},
): ManagedActivation<TPayload> {
  const {
    debounceMs = 0,
    throttleMs = 0,
    reentrant = false,
    once = false,
    onStart,
    onEnd,
    onError,
    debug = false,
  } = options;

  let enabled = true;
  let running = false;
  let lastExecTs = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let consumedOnce = false;

  const log = (...args: any[]) => {
    if (debug) {
      console.debug("[Activation]", ...args);
    }
  };

  const clearDebounce = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
      log("Debounce timer cleared");
    }
  };

  const canExecuteNow = (): boolean => {
    if (!enabled) {
      log("Blocked: not enabled");
      return false;
    }
    if (once && consumedOnce) {
      log("Blocked: once consumed");
      return false;
    }
    if (!reentrant && running) {
      log("Blocked: running (reentrancy prevention)");
      return false;
    }
    const now = Date.now();
    if (throttleMs > 0 && now - lastExecTs < throttleMs) {
      log("Blocked: throttle window", {
        sinceLastMs: now - lastExecTs,
        throttleMs,
      });
      return false;
    }
    return true;
  };

  const tryExecute = async (payload: TPayload) => {
    if (!canExecuteNow()) return;

    clearDebounce();

    const now = Date.now();
    lastExecTs = now;

    try {
      onStartSafe(onStart, log);
      running = true;
      const result = handler(payload);
      const finalResult = isPromiseLike(result) ? await result : result;
      running = false;
      onEndSafe(onEnd, finalResult, log);
      if (once) {
        consumedOnce = true;
        enabled = false;
        log("Disabled after once execution");
      }
    } catch (err) {
      running = false;
      onErrorSafe(onError, err, log);
    }
  };

  const wrapped: ManagedActivation<TPayload> = Object.assign(
    (payload: TPayload) => {
      if (!enabled || (once && consumedOnce)) {
        log("Trigger ignored: disabled or consumed once");
        return;
      }

      // Debounce scheduling
      if (debounceMs > 0) {
        clearDebounce();
        debounceTimer = setTimeout(() => {
          debounceTimer = null;
          tryExecute(payload);
        }, debounceMs);
        log("Debounced trigger scheduled", { debounceMs });
        return;
      }

      // Immediate attempt
      void tryExecute(payload);
    },
    {
      cancel() {
        clearDebounce();
      },
      disable() {
        enabled = false;
        clearDebounce();
        log("Handler disabled");
      },
      enable() {
        enabled = true;
        consumedOnce = false;
        log("Handler enabled");
      },
      isEnabled() {
        return enabled && !(once && consumedOnce);
      },
    },
  );

  return wrapped;
}

/**
 * Compose multiple activation handlers into one, executing them sequentially.
 *
 * Behavior:
 * - Each handler runs in order; payload is passed unchanged.
 * - If a handler returns `false`, composition short-circuits (subsequent handlers are skipped).
 * - If a handler throws, composition stops and the error is propagated (rejected).
 * - Async handlers are awaited in sequence.
 *
 * @example
 * const composed = composeActivation(
 *   createActivationHandler(save, { throttleMs: 500 }),
 *   (payload) => { toast('Saved'); },
 *   (payload) => analytics('save', payload),
 * );
 *
 * await composed(item);
 */
export function composeActivation<TPayload = void>(
  ...handlers: ActivationHandler<TPayload>[]
): ActivationHandler<TPayload> {
  return async (payload: TPayload) => {
    for (const fn of handlers) {
      const result = await Promise.resolve(fn(payload));
      if (result === false) {
        return false;
      }
    }
    return true;
  };
}

/**
 * Safe lifecycle hook invocations to avoid breaking the handler when hooks throw.
 */
function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    !!value &&
    (typeof value === "object" || typeof value === "function") &&
    "then" in value &&
    typeof (value as PromiseLike<unknown>).then === "function"
  );
}

function onStartSafe(
  hook: ActivationOptions["onStart"],
  log: (...args: any[]) => void,
) {
  if (!hook) return;
  try {
    hook();
  } catch (e) {
    log("onStart hook error suppressed", e);
  }
}

function onEndSafe(
  hook: ActivationOptions["onEnd"],
  result: unknown,
  log: (...args: any[]) => void,
) {
  if (!hook) return;
  try {
    hook(result);
  } catch (e) {
    log("onEnd hook error suppressed", e);
  }
}

function onErrorSafe(
  hook: ActivationOptions["onError"],
  error: unknown,
  log: (...args: any[]) => void,
) {
  if (!hook) return;
  try {
    hook(error);
  } catch (e) {
    log("onError hook error suppressed", e);
  }
}
