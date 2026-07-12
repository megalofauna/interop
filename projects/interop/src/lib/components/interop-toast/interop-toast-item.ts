import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  effect,
  inject,
  ElementRef,
  OnDestroy,
  afterNextRender,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

import type { ToastState, ToastType } from './interop-toast.types';
import { INTEROP_TOAST_CONFIG, INTEROP_TOAST_DEFAULTS } from './interop-toast.config';
import { InteropIcon } from '../interop-icon/interop-icon';
import { provideInteropIcons } from '../../iconsets/core';
import { TablerX } from '../../iconsets/tabler';

/**
 * InteropToastItem — renders a single toast notification.
 * Internal component, not exported in the public API.
 */
@Component({
  selector: 'interop-toast-item',
  standalone: true,
  imports: [InteropIcon],
  providers: [provideInteropIcons(TablerX)],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'role': 'status',
    '[attr.role]': 'ariaRole()',
    '[attr.aria-live]': 'ariaLive()',
    '[attr.aria-atomic]': '"true"',
    '[attr.data-type]': 'toast().type',
    '[attr.data-state]': 'state()',
    '[attr.data-swipe]': 'swipeState()',
    '[attr.data-dismissible]': 'toast().dismissible || null',
    '[style.--_index]': 'index()',
    '[style.--_total]': 'total()',
    'tabindex': '0',
    '(keydown.escape)': 'onEscape()',
  },
  template: `
    <div class="interop-toast-item__content">
      <div class="interop-toast-item__message">{{ toast().message }}</div>
      @if (toast().description) {
        <div class="interop-toast-item__description">{{ toast().description }}</div>
      }
    </div>

    <div class="interop-toast-item__actions">
      @if (toast().action) {
        <button
          class="interop-toast-item__action-btn"
          type="button"
          (click)="action.emit()">
          {{ toast().action!.label }}
        </button>
      }
      @if (toast().dismissible) {
        <button
          class="interop-toast-item__close-btn"
          type="button"
          aria-label="Close notification"
          (click)="dismissed.emit()">
          <interop-icon name="tabler-x" [size]="16" />
        </button>
      }
    </div>
  `,
})
export class InteropToastItem implements OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly doc = inject(DOCUMENT);
  private readonly globalConfig = inject(INTEROP_TOAST_CONFIG);

  // ── Inputs ────────────────────────────────────────────────────────────

  toast = input.required<ToastState>();
  index = input.required<number>();
  total = input.required<number>();
  expanded = input<boolean>(false);
  paused = input<boolean>(false);

  // ── Outputs ───────────────────────────────────────────────────────────

  dismissed = output<void>();
  action = output<void>();
  swipeDismiss = output<void>();
  timeout = output<void>();

  // ── Internal state ────────────────────────────────────────────────────

  protected readonly state = signal<'entering' | 'visible' | 'exiting'>('entering');
  protected readonly swipeState = signal<'idle' | 'swiping' | null>(null);
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private timeRemaining = 0;
  private timerStartedAt = 0;

  // Swipe tracking
  private pointerStartX = 0;
  private pointerStartY = 0;
  private pointerStartTime = 0;
  private swipeCleanup: (() => void) | null = null;

  // ── Computed ARIA ─────────────────────────────────────────────────────

  protected readonly ariaRole = computed(() => {
    const type = this.toast().type;
    return type === 'error' ? 'alert' : 'status';
  });

  protected readonly ariaLive = computed(() => {
    const type = this.toast().type;
    return type === 'error' ? 'assertive' : 'polite';
  });

  constructor() {
    // Start auto-dismiss timer reactively
    effect(() => {
      const toast = this.toast();
      const isPaused = this.paused();

      // Clear any existing timer
      this.clearTimer();

      if (isPaused || toast.duration <= 0 || !isFinite(toast.duration)) {
        // If we were timing and just paused, save remaining time
        if (isPaused && this.timerStartedAt > 0) {
          const elapsed = Date.now() - this.timerStartedAt;
          this.timeRemaining = Math.max(0, (this.timeRemaining || toast.duration) - elapsed);
        }
        return;
      }

      // Resume or start timer
      const duration = this.timeRemaining > 0 ? this.timeRemaining : toast.duration;
      this.timerStartedAt = Date.now();

      this.timerId = setTimeout(() => {
        this.timeRemaining = 0;
        this.timerStartedAt = 0;
        this.timeout.emit();
      }, duration);
    });

    // Mark as visible after first render
    afterNextRender(() => {
      this.state.set('visible');
      this.setupSwipe();
    });
  }

  ngOnDestroy(): void {
    this.clearTimer();
    this.swipeCleanup?.();
  }

  /**
   * Dismissal *capability* — distinct from the × *chrome* (toast().dismissible).
   * Every toast can be dismissed by Esc or swipe; the only lock is a loading
   * toast explicitly held open with cancelBehavior: 'prevent'. Hiding the ×
   * (e.g. ephemeral success toasts) never removes this keyboard/gesture floor.
   */
  protected readonly canDismiss = computed(() => {
    const t = this.toast();
    return !(t.type === 'loading' && t.cancelBehavior === 'prevent');
  });

  protected onEscape(): void {
    if (this.canDismiss()) {
      this.dismissed.emit();
    }
  }

  // ── Auto-dismiss timer ────────────────────────────────────────────────

  private clearTimer(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  // ── Swipe gesture ─────────────────────────────────────────────────────

  private setupSwipe(): void {
    const swipeDismiss = this.globalConfig.swipeDismiss ?? INTEROP_TOAST_DEFAULTS.swipeDismiss;
    if (!swipeDismiss) return;

    const el = this.el.nativeElement;
    const threshold = this.globalConfig.swipeThreshold ?? INTEROP_TOAST_DEFAULTS.swipeThreshold;

    const onPointerDown = (start: PointerEvent) => {
      if (start.button !== 0) return; // left click only

      this.pointerStartX = start.clientX;
      this.pointerStartY = start.clientY;
      this.pointerStartTime = Date.now();
      this.swipeState.set('swiping');

      const onPointerMove = (e: PointerEvent) => {
        const dx = e.clientX - this.pointerStartX;
        const dy = e.clientY - this.pointerStartY;
        el.style.setProperty('--_swipe-x', `${dx}px`);
        el.style.setProperty('--_swipe-y', `${dy}px`);
      };

      const onPointerUp = (e: PointerEvent) => {
        this.doc.removeEventListener('pointermove', onPointerMove);
        this.doc.removeEventListener('pointerup', onPointerUp);

        const dx = e.clientX - this.pointerStartX;
        const dy = e.clientY - this.pointerStartY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const elapsed = Date.now() - this.pointerStartTime;
        const velocity = distance / Math.max(elapsed, 1);

        // Dismiss if distance exceeds threshold OR velocity is high enough —
        // unless the toast is capability-locked (loading + 'prevent').
        const passedThreshold = distance >= threshold || velocity > 0.11;
        if (passedThreshold && this.canDismiss()) {
          this.swipeState.set(null);
          this.swipeDismiss.emit();
        } else {
          // Below threshold, or locked — snap back.
          el.style.removeProperty('--_swipe-x');
          el.style.removeProperty('--_swipe-y');
          this.swipeState.set(null);
        }
      };

      this.doc.addEventListener('pointermove', onPointerMove);
      this.doc.addEventListener('pointerup', onPointerUp, { once: true });
    };

    el.addEventListener('pointerdown', onPointerDown);
    this.swipeCleanup = () => el.removeEventListener('pointerdown', onPointerDown);
  }
}
