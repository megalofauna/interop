import { Subject, Observable } from 'rxjs';
import type { ToastDismissReason, ToastState, ToastType, ToastAction } from './interop-toast.types';

/**
 * A handle to an active toast notification.
 *
 * Returned by all `InteropToastService` creation methods. Provides
 * programmatic control over the toast after creation and observable
 * streams for lifecycle events.
 *
 * @example
 * ```typescript
 * const ref = this.toast.success('Item saved');
 * ref.afterDismissed().subscribe(reason => console.log('Dismissed:', reason));
 * ```
 *
 * @example With action handling
 * ```typescript
 * const ref = this.toast.show('Item deleted', {
 *   action: { label: 'Undo', id: 'undo', altText: 'Go to trash to restore item' },
 * });
 * ref.onAction().subscribe(actionId => {
 *   if (actionId === 'undo') this.undoDelete();
 * });
 * ```
 */
export class InteropToastHandle {
  private readonly _afterDismissed = new Subject<ToastDismissReason>();
  private readonly _afterOpened = new Subject<void>();
  private readonly _onAction = new Subject<string>();

  /** The unique identifier for this toast. */
  readonly id: string;

  /** @internal — called by the service, not by consumers. */
  readonly _dismiss: (reason: ToastDismissReason) => void;

  /** @internal — called by the service to update internal toast state. */
  readonly _update: (patch: Partial<Pick<ToastState, 'message' | 'description' | 'type' | 'action' | 'duration' | 'dismissible'>>) => void;

  constructor(
    id: string,
    dismissFn: (reason: ToastDismissReason) => void,
    updateFn: (patch: Partial<Pick<ToastState, 'message' | 'description' | 'type' | 'action' | 'duration' | 'dismissible'>>) => void,
  ) {
    this.id = id;
    this._dismiss = dismissFn;
    this._update = updateFn;
  }

  /** Dismiss this toast programmatically. */
  dismiss(): void {
    this._dismiss('programmatic');
  }

  /**
   * Update the toast's content after creation.
   * Useful for progress updates or transitioning async toast states.
   */
  update(patch: {
    message?: string;
    description?: string;
    type?: ToastType;
    action?: ToastAction;
    duration?: number;
    dismissible?: boolean;
  }): void {
    this._update(patch);
  }

  /** Observable that emits the dismiss reason when this toast is dismissed, then completes. */
  afterDismissed(): Observable<ToastDismissReason> {
    return this._afterDismissed.asObservable();
  }

  /** Observable that emits once when the toast has entered the viewport, then completes. */
  afterOpened(): Observable<void> {
    return this._afterOpened.asObservable();
  }

  /** Observable that emits the action ID when the user clicks an action button. */
  onAction(): Observable<string> {
    return this._onAction.asObservable();
  }

  /** @internal */
  _emitDismissed(reason: ToastDismissReason): void {
    this._afterDismissed.next(reason);
    this._afterDismissed.complete();
    this._onAction.complete();
  }

  /** @internal */
  _emitOpened(): void {
    this._afterOpened.next();
    this._afterOpened.complete();
  }

  /** @internal */
  _emitAction(actionId: string): void {
    this._onAction.next(actionId);
  }
}
