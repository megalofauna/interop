import {
  Injectable,
  inject,
  signal,
  isDevMode,
  computed,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Observable, Subscription } from 'rxjs';

import type {
  ToastType,
  ToastDismissReason,
  ToastState,
  InteropToastOptions,
  ToastAsyncMessages,
} from './interop-toast.types';
import { INTEROP_TOAST_CONFIG, INTEROP_TOAST_DEFAULTS } from './interop-toast.config';
import { InteropToastHandle } from './interop-toast-handle';

let nextId = 0;

/**
 * InteropToastService — imperative toast notification manager.
 *
 * Manages an internal signal-based array of toast state. The companion
 * `InteropToastViewport` component reads this state to render toasts.
 *
 * @example Basic usage
 * ```typescript
 * private toast = inject(InteropToastService);
 *
 * onSave(): void {
 *   this.toast.success('Document saved');
 * }
 * ```
 *
 * @example Observable-native async toast
 * ```typescript
 * this.toast.observe(this.http.post('/api/save', data), {
 *   loading: 'Saving...',
 *   success: (res) => 'Saved: ' + res.name,
 *   error: (err) => 'Failed: ' + err.message,
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class InteropToastService {
  private readonly doc = inject(DOCUMENT);
  private readonly globalConfig = inject(INTEROP_TOAST_CONFIG);

  /** @internal — the source of truth for all active toasts. */
  readonly _toasts = signal<ToastState[]>([]);

  /** @internal — registry of active toast refs keyed by id. */
  private readonly refs = new Map<string, InteropToastHandle>();

  /** @internal — registry of Observable subscriptions for async toasts. */
  private readonly asyncSubs = new Map<string, Subscription>();

  /** @internal — the most recently nuked batch, held for a single undo. */
  private lastCleared: ToastState[] = [];

  /** @internal — whether a viewport component is registered. */
  _viewportRegistered = signal(false);

  /** Read-only computed of current toast count. */
  readonly count = computed(() => this._toasts().length);

  // ── Public API: typed convenience methods ─────────────────────────────

  /** Show a toast with the default type. */
  show(message: string, options?: InteropToastOptions): InteropToastHandle {
    return this.create(message, { ...options, type: options?.type ?? 'default' });
  }

  /** Show a success toast. */
  success(message: string, options?: Omit<InteropToastOptions, 'type'>): InteropToastHandle {
    return this.create(message, { ...options, type: 'success' });
  }

  /** Show an error toast. Duration defaults to 0 (no auto-dismiss). */
  error(message: string, options?: Omit<InteropToastOptions, 'type'>): InteropToastHandle {
    return this.create(message, { ...options, type: 'error' });
  }

  /** Show a warning toast. Duration defaults to 0 (no auto-dismiss). */
  warning(message: string, options?: Omit<InteropToastOptions, 'type'>): InteropToastHandle {
    return this.create(message, { ...options, type: 'warning' });
  }

  /** Show an info toast. */
  info(message: string, options?: Omit<InteropToastOptions, 'type'>): InteropToastHandle {
    return this.create(message, { ...options, type: 'info' });
  }

  /** Show a loading toast. Duration defaults to 0 (no auto-dismiss). */
  loading(message: string, options?: Omit<InteropToastOptions, 'type'>): InteropToastHandle {
    return this.create(message, { ...options, type: 'loading' });
  }

  /**
   * Show a toast that tracks an Observable lifecycle.
   * Starts as 'loading', transitions to 'success' or 'error' based on the Observable.
   */
  observe<T>(
    source$: Observable<T>,
    messages: ToastAsyncMessages<T>,
    options?: Omit<InteropToastOptions, 'type'>,
  ): InteropToastHandle {
    const ref = this.create(messages.loading, {
      ...options,
      type: 'loading',
      cancelBehavior: options?.cancelBehavior ?? 'detach',
    });

    const sub = source$.subscribe({
      next: (value) => {
        const successMsg = typeof messages.success === 'function'
          ? messages.success(value)
          : messages.success;
        ref.update({
          message: successMsg,
          type: 'success',
          duration: this.resolveDuration('success', options?.duration),
          dismissible: true,
        });
        this.asyncSubs.delete(ref.id);
      },
      error: (err) => {
        const errorMsg = typeof messages.error === 'function'
          ? messages.error(err)
          : messages.error;
        ref.update({
          message: errorMsg,
          type: 'error',
          duration: 0,
          dismissible: true,
        });
        this.asyncSubs.delete(ref.id);
      },
    });

    this.asyncSubs.set(ref.id, sub);
    return ref;
  }

  /**
   * Show a toast that tracks a Promise lifecycle.
   * Starts as 'loading', transitions to 'success' or 'error'.
   */
  promise<T>(
    promise: Promise<T>,
    messages: ToastAsyncMessages<T>,
    options?: Omit<InteropToastOptions, 'type'>,
  ): InteropToastHandle {
    const ref = this.create(messages.loading, {
      ...options,
      type: 'loading',
      cancelBehavior: options?.cancelBehavior ?? 'detach',
    });

    promise.then(
      (value) => {
        const successMsg = typeof messages.success === 'function'
          ? messages.success(value)
          : messages.success;
        ref.update({
          message: successMsg,
          type: 'success',
          duration: this.resolveDuration('success', options?.duration),
          dismissible: true,
        });
      },
      (err) => {
        const errorMsg = typeof messages.error === 'function'
          ? messages.error(err)
          : messages.error;
        ref.update({
          message: errorMsg,
          type: 'error',
          duration: 0,
          dismissible: true,
        });
      },
    );

    return ref;
  }

  /** Dismiss a specific toast by ID. */
  dismiss(id: string): void {
    this.removeToast(id, 'programmatic');
  }

  /**
   * Nuclear bulk clear: dismiss every toast (visible *and* queued), skipping
   * only capability-locked toasts — a loading toast held open with
   * cancelBehavior: 'prevent'. The cleared *static* toasts are snapshotted and
   * offered back through a single "Cleared N · Undo" toast; Undo re-shows them
   * as fresh toasts. Loading/async toasts can't be honestly restored (their
   * source has moved on), so they are cleared but excluded from the snapshot.
   */
  dismissAll(): void {
    const isLocked = (t: ToastState) =>
      t.type === 'loading' && t.cancelBehavior === 'prevent';
    const isRestorable = (t: ToastState) =>
      t.type !== 'loading' && !this.asyncSubs.has(t.id);

    const toClear = this._toasts().filter(t => !isLocked(t));
    if (toClear.length === 0) return;

    // Snapshot the honestly-restorable ones before tearing the tray down.
    this.lastCleared = toClear.filter(isRestorable);

    for (const t of toClear) {
      this.removeToast(t.id, 'programmatic');
    }

    // Nothing worth undoing (e.g. everything cleared was a loading toast).
    if (this.lastCleared.length === 0) return;

    const n = toClear.length;
    const undoRef = this.create(
      `Cleared ${n} notification${n === 1 ? '' : 's'}`,
      {
        type: 'default',
        action: {
          label: 'Undo',
          id: 'undo',
          altText: 'Restore the notifications that were just cleared',
        },
      },
    );
    undoRef.onAction().subscribe(actionId => {
      if (actionId !== 'undo') return;
      undoRef.dismiss();
      this.restoreCleared();
    });
  }

  /**
   * Re-show the most recently cleared batch as *fresh* toasts — same content
   * and type, timers reset. This is "re-show", not "rewind": elapsed timers and
   * async sources are deliberately not reconstructed.
   */
  private restoreCleared(): void {
    const batch = this.lastCleared;
    this.lastCleared = [];
    for (const t of batch) {
      this.create(t.message, {
        type: t.type,
        description: t.description,
        duration: t.duration,
        action: t.action,
        dismissible: t.dismissible,
        cancelBehavior: t.cancelBehavior,
        data: t.data,
      });
    }
  }

  // ── Internal methods (used by viewport component) ─────────────────────

  /** @internal */
  _handleAction(id: string): void {
    const toast = this._toasts().find(t => t.id === id);
    const ref = this.refs.get(id);
    if (!toast || !ref) return;

    const actionId = toast.action?.id ?? toast.action?.label ?? '';
    ref._emitAction(actionId);
    this.removeToast(id, 'action');
  }

  /** @internal */
  _handleSwipeDismiss(id: string): void {
    this.removeToast(id, 'swipe');
  }

  /** @internal */
  _handleTimeout(id: string): void {
    this.removeToast(id, 'timeout');
  }

  /** @internal */
  _handleDismiss(id: string): void {
    this.removeToast(id, 'dismissed');
  }

  /** @internal */
  _registerViewport(): void {
    this._viewportRegistered.set(true);
  }

  /** @internal */
  _unregisterViewport(): void {
    this._viewportRegistered.set(false);
  }

  // ── Private helpers ───────────────────────────────────────────────────

  private create(message: string, options: InteropToastOptions = {}): InteropToastHandle {
    const id = `itx-toast-${nextId++}`;
    const type = options.type ?? 'default';
    const duration = this.resolveDuration(type, options.duration);
    const dismissible = this.resolveDismissible(type, duration, options);

    if (isDevMode()) {
      if (!this._viewportRegistered()) {
        console.warn(
          'InteropToastService: no <interop-toast-viewport> found in the DOM. ' +
          'Add one to your root layout to display toast notifications.\n' +
          'Example: <interop-toast-viewport />'
        );
      }
      if (type === 'error' && options.duration && options.duration > 0 && isFinite(options.duration)) {
        console.warn(
          `InteropToastService: toast "${id}" has type 'error' with auto-dismiss duration ${options.duration}ms. ` +
          'Error toasts should persist until explicitly dismissed. Consider removing the duration.'
        );
      }
      if (options.action && !options.action.altText) {
        console.warn(
          `InteropToastService: toast "${id}" has an action button ("${options.action.label}") without altText. ` +
          'Provide altText to describe an alternative way for screen reader users to accomplish the action. ' +
          'Example: { label: "Undo", altText: "Go to trash to restore the deleted item" }'
        );
      }
    }

    const state: ToastState = {
      id,
      message,
      type,
      description: options.description,
      duration,
      action: options.action,
      dismissible,
      cancelBehavior: options.cancelBehavior ?? 'detach',
      createdAt: Date.now(),
      data: options.data,
    };

    const ref = new InteropToastHandle(
      id,
      (reason) => this.removeToast(id, reason),
      (patch) => this.updateToast(id, patch),
    );

    this.refs.set(id, ref);
    this._toasts.update(toasts => [...toasts, state]);

    return ref;
  }

  private removeToast(id: string, reason: ToastDismissReason): void {
    const toast = this._toasts().find(t => t.id === id);
    if (!toast) return;

    if (toast.cancelBehavior === 'prevent' && toast.type === 'loading' && reason !== 'programmatic') {
      return;
    }

    const sub = this.asyncSubs.get(id);
    if (sub) {
      if (toast.cancelBehavior === 'unsubscribe') {
        sub.unsubscribe();
      }
      this.asyncSubs.delete(id);
    }

    this._toasts.update(toasts => toasts.filter(t => t.id !== id));

    const ref = this.refs.get(id);
    if (ref) {
      ref._emitDismissed(reason);
      this.refs.delete(id);
    }
  }

  private updateToast(
    id: string,
    patch: Partial<Pick<ToastState, 'message' | 'description' | 'type' | 'action' | 'duration' | 'dismissible'>>,
  ): void {
    this._toasts.update(toasts =>
      toasts.map(t => (t.id === id ? { ...t, ...patch } : t)),
    );
  }

  /*
   * Dismissal defaults scale deliberateness with stakes (see the toast
   * behaviour verdict). Two independent axes:
   *
   *   auto-dismiss (resolveDuration)      how long before it self-clears
   *   × chrome     (resolveDismissible)   whether a close button is rendered
   *
   * A third axis — the *capability* to dismiss via Esc/swipe — is universal and
   * lives on the item (canDismiss); it is NOT gated by the × chrome. Hiding the
   * button on an ephemeral success toast never strands the user.
   *
   *   type       auto-dismiss   × button
   *   success    timed          no (swipe/Esc floor)
   *   info       timed          no (swipe/Esc floor)
   *   default    timed          no (swipe/Esc floor)
   *   warning    never (0)      yes
   *   error      never (0)      yes  (errors must not vanish; see create())
   *   loading    never (0)      yes, unless cancelBehavior: 'prevent'
   */

  private resolveDuration(type: ToastType, explicit?: number): number {
    if (explicit !== undefined) return explicit;
    // Higher-stakes types persist until acted on rather than racing a timer.
    if (type === 'error' || type === 'warning' || type === 'loading') return 0;
    return this.globalConfig.duration ?? INTEROP_TOAST_DEFAULTS.duration;
  }

  /** Resolves whether the × close button is shown (chrome), not the capability
   *  to dismiss — Esc/swipe always work unless the item is capability-locked. */
  private resolveDismissible(
    type: ToastType,
    duration: number,
    options: InteropToastOptions,
  ): boolean {
    const explicit = options.dismissible;
    if (explicit !== undefined && explicit !== 'auto') return explicit;
    if (type === 'error' || type === 'warning') return true;
    if (type === 'loading') return options.cancelBehavior !== 'prevent';
    // Any other persistent toast (no auto-dismiss) earns a button too.
    if (duration === 0 || !isFinite(duration)) return true;
    // Ephemeral success/info/default: no button; swipe + Esc remain.
    return false;
  }
}
