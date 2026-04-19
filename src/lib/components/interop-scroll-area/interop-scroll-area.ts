import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  computed,
  inject,
  input,
  isDevMode,
  output,
  signal,
} from '@angular/core';
import {
  INTEROP_SCROLL_AREA_CONFIG,
  INTEROP_SCROLL_AREA_DEFAULTS,
} from './interop-scroll-area.config';

export interface ScrollStateEvent {
  scrollTop: number;
  scrollLeft: number;
  atTop: boolean;
  atBottom: boolean;
  atStart: boolean;
  atEnd: boolean;
  overflowing: boolean;
  direction: 'up' | 'down' | 'left' | 'right' | 'idle';
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), ' +
  'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

@Component({
  selector: 'interop-scroll-area',
  standalone: true,
  template: '<ng-content />',
  styleUrl: './interop-scroll-area.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.tabindex]': 'effectiveTabIndex()',
    '[attr.role]': 'effectiveRole()',
    '[attr.aria-label]': 'ariaLabel() || null',
    '[attr.data-overflowing]': 'overflowing() || null',
    '[attr.data-shadows]': 'effectiveShowShadows() || null',
    '[attr.data-orientation]': 'effectiveOrientation()',
  },
})
export class InteropScrollArea implements OnDestroy {
  private readonly hostEl = inject(ElementRef<HTMLElement>);
  private readonly globalConfig = inject(INTEROP_SCROLL_AREA_CONFIG);

  // ── Inputs ──────────────────────────────────────────────────────────────────

  orientation = input<'vertical' | 'horizontal' | 'both' | undefined>(undefined);
  ariaLabel = input<string>();
  tabIndex = input<number | null | undefined>(undefined);
  showShadows = input<boolean | undefined>(undefined);
  shadowThreshold = input<number | undefined>(undefined);

  // ── Outputs ─────────────────────────────────────────────────────────────────

  scrollState = output<ScrollStateEvent>();
  overflowChange = output<boolean>();

  // ── Public signals ──────────────────────────────────────────────────────────

  readonly atTop = signal(true);
  readonly atBottom = signal(false);
  readonly atStart = signal(true);
  readonly atEnd = signal(false);
  readonly overflowing = signal(false);
  readonly scrollDirection = signal<'up' | 'down' | 'left' | 'right' | 'idle'>('idle');

  // ── Private state ───────────────────────────────────────────────────────────

  private readonly hasFocusableChild = signal(false);
  private lastScrollTop = 0;
  private lastScrollLeft = 0;
  private rafId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private boundScrollHandler: (() => void) | null = null;

  // ── Resolved config ─────────────────────────────────────────────────────────

  protected readonly effectiveOrientation = computed<'vertical' | 'horizontal' | 'both'>(
    () => this.orientation() ?? this.globalConfig.orientation ?? INTEROP_SCROLL_AREA_DEFAULTS.orientation,
  );
  protected readonly effectiveShowShadows = computed<boolean>(
    () => this.showShadows() ?? this.globalConfig.showShadows ?? INTEROP_SCROLL_AREA_DEFAULTS.showShadows,
  );
  private readonly effectiveShadowThreshold = computed<number>(
    () => this.shadowThreshold() ?? this.globalConfig.shadowThreshold ?? INTEROP_SCROLL_AREA_DEFAULTS.shadowThreshold,
  );

  protected readonly effectiveTabIndex = computed<number | null>(() => {
    const explicit = this.tabIndex();
    if (explicit !== undefined) return explicit;
    return this.overflowing() && !this.hasFocusableChild() ? 0 : null;
  });

  protected readonly effectiveRole = computed<string | null>(() =>
    this.ariaLabel() ? 'region' : null,
  );

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  constructor() {
    afterNextRender(() => this.init());
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (this.boundScrollHandler) {
      this.hostEl.nativeElement.removeEventListener('scroll', this.boundScrollHandler);
    }
  }

  // ── Public methods ──────────────────────────────────────────────────────────

  scrollTo(options: ScrollToOptions): Promise<void> {
    const el = this.hostEl.nativeElement;
    const targetTop = options.top ?? el.scrollTop;
    const targetLeft = options.left ?? el.scrollLeft;

    if (Math.abs(el.scrollTop - targetTop) < 1 && Math.abs(el.scrollLeft - targetLeft) < 1) {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      let resolved = false;
      const done = () => {
        if (resolved) return;
        resolved = true;
        resolve();
      };
      el.addEventListener('scrollend', done, { once: true });
      setTimeout(done, 1000); // Fallback if scrollend doesn't fire
      el.scrollTo(options);
    });
  }

  scrollToTop(behavior: ScrollBehavior = 'smooth'): Promise<void> {
    return this.scrollTo({ top: 0, behavior });
  }

  scrollToBottom(behavior: ScrollBehavior = 'smooth'): Promise<void> {
    return this.scrollTo({ top: this.hostEl.nativeElement.scrollHeight, behavior });
  }

  // ── Init ────────────────────────────────────────────────────────────────────

  private init(): void {
    const el = this.hostEl.nativeElement;

    if (isDevMode()) this.runDevChecks();

    // Scroll listener — RAF-throttled for shadow updates
    this.boundScrollHandler = () => {
      if (this.rafId !== null) return;
      this.rafId = requestAnimationFrame(() => {
        this.rafId = null;
        this.updateScrollState();
      });
    };
    el.addEventListener('scroll', this.boundScrollHandler, { passive: true });

    // ResizeObserver: detect overflow changes when container or children resize
    this.resizeObserver = new ResizeObserver(() => {
      this.checkOverflow();
      this.updateScrollState();
    });
    this.resizeObserver.observe(el);
    for (const child of Array.from<Element>(el.children)) {
      this.resizeObserver.observe(child);
    }

    // MutationObserver: detect focusable-child changes and observe new children
    this.mutationObserver = new MutationObserver((mutations) => {
      this.checkFocusableChildren();
      this.checkOverflow();
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLElement) {
            this.resizeObserver?.observe(node);
          }
        }
      }
    });
    this.mutationObserver.observe(el, { childList: true, subtree: true });

    // Initial state
    this.checkOverflow();
    this.checkFocusableChildren();
    this.updateScrollState();
  }

  // ── Overflow detection ──────────────────────────────────────────────────────

  private checkOverflow(): void {
    const el = this.hostEl.nativeElement;
    const orientation = this.effectiveOrientation();

    const overflowsY = orientation !== 'horizontal' && el.scrollHeight > el.clientHeight + 1;
    const overflowsX = orientation !== 'vertical' && el.scrollWidth > el.clientWidth + 1;
    const overflows = overflowsY || overflowsX;

    if (this.overflowing() !== overflows) {
      this.overflowing.set(overflows);
      this.overflowChange.emit(overflows);
    }
  }

  private checkFocusableChildren(): void {
    this.hasFocusableChild.set(
      !!this.hostEl.nativeElement.querySelector(FOCUSABLE_SELECTOR),
    );
  }

  // ── Scroll state ────────────────────────────────────────────────────────────

  private updateScrollState(): void {
    const el = this.hostEl.nativeElement;
    const { scrollTop, scrollLeft, scrollHeight, scrollWidth, clientHeight, clientWidth } = el;

    const atTop = scrollTop <= 1;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
    const atStart = scrollLeft <= 1;
    const atEnd = scrollLeft + clientWidth >= scrollWidth - 1;

    this.atTop.set(atTop);
    this.atBottom.set(atBottom);
    this.atStart.set(atStart);
    this.atEnd.set(atEnd);

    // Direction
    const dy = scrollTop - this.lastScrollTop;
    const dx = scrollLeft - this.lastScrollLeft;
    if (Math.abs(dy) > Math.abs(dx)) {
      this.scrollDirection.set(dy > 0 ? 'down' : dy < 0 ? 'up' : 'idle');
    } else if (dx !== 0) {
      this.scrollDirection.set(dx > 0 ? 'right' : 'left');
    }
    this.lastScrollTop = scrollTop;
    this.lastScrollLeft = scrollLeft;

    // Shadow CSS custom properties (0–1 intensity, proportional within threshold)
    if (this.effectiveShowShadows()) {
      const threshold = this.effectiveShadowThreshold();
      el.style.setProperty('--_shadow-top', String(Math.min(scrollTop / threshold, 1)));
      el.style.setProperty('--_shadow-bottom', String(Math.min(Math.max(scrollHeight - scrollTop - clientHeight, 0) / threshold, 1)));
      el.style.setProperty('--_shadow-start', String(Math.min(scrollLeft / threshold, 1)));
      el.style.setProperty('--_shadow-end', String(Math.min(Math.max(scrollWidth - scrollLeft - clientWidth, 0) / threshold, 1)));
    }

    this.scrollState.emit({
      scrollTop,
      scrollLeft,
      atTop,
      atBottom,
      atStart,
      atEnd,
      overflowing: this.overflowing(),
      direction: this.scrollDirection(),
    });
  }

  // ── Dev mode ────────────────────────────────────────────────────────────────

  private runDevChecks(): void {
    if (this.ariaLabel() === '') {
      console.warn(
        'interop-scroll-area: [ariaLabel] is an empty string. ' +
          'A region landmark with no accessible name is worse than no landmark. ' +
          'Provide a meaningful label or omit [ariaLabel].',
      );
    }
  }
}
