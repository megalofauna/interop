import type {
  InteropPositionStrategy,
  PositionOptions,
  ResolvedPlacement,
} from './position-strategy';

/**
 * NativePositionStrategy — basic top/bottom positioner using getBoundingClientRect.
 *
 * This is the built-in fallback when @floating-ui/dom is not installed. It supports
 * only vertical placement (top/bottom) with horizontal centering and viewport
 * edge clamping. Left/right placement and variant suffixes (-start/-end) are not
 * supported — the resolved placement will always be 'top' or 'bottom'.
 *
 * No scroll/resize auto-update is provided by default — startAutoUpdate attaches
 * passive window listeners that re-run position() on scroll and resize.
 */
export class NativePositionStrategy implements InteropPositionStrategy {
  readonly name = 'native';

  private trigger: HTMLElement | null = null;
  private tooltip: HTMLElement | null = null;
  private listeners: Array<() => void> = [];

  connect(trigger: HTMLElement, tooltip: HTMLElement): void {
    this.trigger = trigger;
    this.tooltip = tooltip;
    tooltip.style.position = 'fixed';
  }

  async position(options: PositionOptions): Promise<ResolvedPlacement> {
    if (!this.trigger || !this.tooltip) return 'top';

    const trigRect = this.trigger.getBoundingClientRect();
    const tipRect = this.tooltip.getBoundingClientRect();
    const { offset } = options;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Resolve vertical axis: prefer configured side, fall back if no room.
    const preferTop = !options.placement.startsWith('bottom');
    const roomAbove = trigRect.top >= tipRect.height + offset + 8;
    const roomBelow = vh - trigRect.bottom >= tipRect.height + offset + 8;
    const useTop = preferTop ? (roomAbove || !roomBelow) : !roomBelow;

    const y = useTop
      ? trigRect.top - tipRect.height - offset
      : trigRect.bottom + offset;

    // Center horizontally on trigger, clamped to viewport with 8px margin.
    const x = Math.max(
      8,
      Math.min(
        trigRect.left + trigRect.width / 2 - tipRect.width / 2,
        vw - tipRect.width - 8,
      ),
    );

    Object.assign(this.tooltip.style, { top: `${y}px`, left: `${x}px` });

    return useTop ? 'top' : 'bottom';
  }

  startAutoUpdate(onUpdate: () => void): () => void {
    const handler = () => onUpdate();

    window.addEventListener('scroll', handler, { passive: true, capture: true });
    window.addEventListener('resize', handler, { passive: true });

    const cleanup = () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };

    this.listeners.push(cleanup);
    return cleanup;
  }

  disconnect(): void {
    this.listeners.forEach(fn => fn());
    this.listeners = [];

    if (this.tooltip) {
      Object.assign(this.tooltip.style, { top: '', left: '', position: '' });
    }
  }
}
