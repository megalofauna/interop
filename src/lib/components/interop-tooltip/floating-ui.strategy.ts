import { NativePositionStrategy } from './native.strategy';
import type {
  InteropPositionStrategy,
  PositionOptions,
  ResolvedPlacement,
} from './position-strategy';

/**
 * FloatingUiPositionStrategy — full-featured positioner via @floating-ui/dom.
 *
 * @floating-ui/dom is an optional peer dependency. If it is not installed,
 * this strategy logs a console.error on the first position() call and falls
 * back to NativePositionStrategy automatically. The tooltip remains functional
 * with degraded placement support (top/bottom only, no flip/shift variants).
 *
 * @see https://floating-ui.com/docs/getting-started
 *
 * ## CSS Anchor Positioning migration
 * When CSS anchor positioning reaches Newly Available baseline, replace this
 * strategy with CssAnchorPositionStrategy. The component code is unchanged —
 * swap the useFactory provider in InteropTooltip.providers.
 */
export class FloatingUiPositionStrategy implements InteropPositionStrategy {
  readonly name = 'floating-ui';

  private trigger: HTMLElement | null = null;
  private tooltip: HTMLElement | null = null;

  // Lazy-loaded module reference; null until first position() call.
  private module: typeof import('@floating-ui/dom') | null = null;
  private loadFailed = false;
  private hasLoggedError = false;

  // Fallback used when @floating-ui/dom is unavailable.
  private fallback: NativePositionStrategy | null = null;

  // Cleanup returned by autoUpdate(); called by stopAutoUpdate returned from startAutoUpdate().
  private cleanupAutoUpdate: (() => void) | null = null;

  // Resolved import promise, shared across all position() calls on this instance.
  private importPromise: Promise<void> | null = null;

  connect(trigger: HTMLElement, tooltip: HTMLElement): void {
    this.trigger = trigger;
    this.tooltip = tooltip;
    tooltip.style.position = 'fixed';

    // Eagerly warm the import so the first position() call doesn't pay the cost.
    this.importPromise = this.loadModule();
  }

  private async loadModule(): Promise<void> {
    if (this.module || this.loadFailed) return;
    try {
      this.module = await import('@floating-ui/dom');
    } catch {
      this.loadFailed = true;
      if (!this.hasLoggedError) {
        this.hasLoggedError = true;
        console.error(
          '[interop-tooltip] @floating-ui/dom is not installed.\n' +
            'Run: npm install @floating-ui/dom\n' +
            'Falling back to native top/bottom positioner — ' +
            'placement variants, flip, and shift are not supported.',
        );
      }
    }
  }

  async position(options: PositionOptions): Promise<ResolvedPlacement> {
    if (!this.trigger || !this.tooltip) return 'top';

    // Wait for the import that was kicked off in connect().
    await this.importPromise;

    if (this.loadFailed && !this.fallback) {
      this.fallback = new NativePositionStrategy();
      this.fallback.connect(this.trigger, this.tooltip);
    }

    if (this.fallback) {
      return this.fallback.position(options);
    }

    const { computePosition, offset, flip, shift } = this.module!;
    const { x, y, placement } = await computePosition(this.trigger, this.tooltip, {
      placement: options.placement,
      strategy: 'fixed',
      middleware: [offset(options.offset), flip(), shift({ padding: 8 })],
    });

    Object.assign(this.tooltip.style, { top: `${y}px`, left: `${x}px` });

    return placement.split('-')[0] as ResolvedPlacement;
  }

  startAutoUpdate(onUpdate: () => void): () => void {
    if (this.fallback) {
      return this.fallback.startAutoUpdate(onUpdate);
    }

    // Called after await position(), so module is loaded at this point.
    if (!this.module || !this.trigger || !this.tooltip) {
      return () => {};
    }

    this.cleanupAutoUpdate?.();
    this.cleanupAutoUpdate = this.module.autoUpdate(this.trigger, this.tooltip, onUpdate);

    return () => {
      this.cleanupAutoUpdate?.();
      this.cleanupAutoUpdate = null;
    };
  }

  disconnect(): void {
    this.cleanupAutoUpdate?.();
    this.cleanupAutoUpdate = null;
    this.fallback?.disconnect();

    if (this.tooltip) {
      Object.assign(this.tooltip.style, { top: '', left: '', position: '' });
    }
  }
}
