export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';

export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type ToastDismissReason = 'timeout' | 'dismissed' | 'programmatic' | 'swipe' | 'action';

export type ToastCancelBehavior = 'unsubscribe' | 'detach' | 'prevent';

export type ToastSwipeDirection = 'left' | 'right' | 'up' | 'down';

/** Configuration for a toast action button. */
export interface ToastAction {
  /** Button label text. */
  label: string;
  /**
   * Unique identifier emitted through InteropToastHandle.onAction().
   * Defaults to the label if not provided.
   */
  id?: string;
  /**
   * Alt text describing an alternative way for screen reader users
   * to accomplish the same action (e.g., "Go to settings to undo").
   * Required for accessibility — devMode warns if missing.
   */
  altText?: string;
}

/** Per-toast configuration passed to service methods. */
export interface InteropToastOptions {
  /** Toast severity/type. Determines ARIA role and visual variant. */
  type?: ToastType;
  /** Optional longer description displayed below the message. */
  description?: string;
  /** Auto-dismiss duration in ms. 0 or Infinity = no auto-dismiss. Defaults to global config. */
  duration?: number;
  /** Action button(s) for the toast. */
  action?: ToastAction;
  /** Whether to show a close/dismiss button. 'auto' = smart default based on type and duration. */
  dismissible?: boolean | 'auto';
  /**
   * For observe()/promise() toasts: behavior when user dismisses a loading toast.
   * - 'detach': toast disappears but Observable/Promise continues (default, safe)
   * - 'unsubscribe': cancel the Observable subscription
   * - 'prevent': disable dismiss while loading
   */
  cancelBehavior?: ToastCancelBehavior;
  /** Arbitrary data attached to the toast, accessible via InteropToastHandle. */
  data?: unknown;
}

/** Messages configuration for observe() and promise() methods. */
export interface ToastAsyncMessages<T = unknown> {
  /** Message or factory shown while the async operation is pending. */
  loading: string;
  /** Message or factory shown on success. Receives the resolved value. */
  success: string | ((value: T) => string);
  /** Message or factory shown on error. Receives the error. */
  error: string | ((error: unknown) => string);
}

/** Internal state representation of a single toast. */
export interface ToastState {
  /** Unique identifier. */
  id: string;
  /** Primary message text. */
  message: string;
  /** Current toast type (may transition, e.g., loading -> success). */
  type: ToastType;
  /** Optional description below the message. */
  description?: string;
  /** Resolved duration in ms. 0 = no auto-dismiss. */
  duration: number;
  /** Action button config. */
  action?: ToastAction;
  /** Whether close button is shown. */
  dismissible: boolean;
  /** Cancel behavior for async toasts. */
  cancelBehavior: ToastCancelBehavior;
  /** Timestamp when the toast was created. */
  createdAt: number;
  /** Arbitrary consumer data. */
  data?: unknown;
  /** Internal: channel for future multi-viewport support. */
  channel?: string;
}
