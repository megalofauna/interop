import {
  Injectable,
  OnDestroy,
  afterNextRender,
  inject,
} from "@angular/core";
import { DOCUMENT } from "@angular/common";

/**
 * InteropAnnouncer — shared aria-live announcement service.
 *
 * Pre-seeds two aria-live regions into document.body at app init (before any
 * content is populated). This sidesteps VoiceOver's timing bug where a region
 * that is both inserted and populated in the same tick is silently ignored.
 *
 * Consumers call announce() to queue a polite or assertive announcement.
 * The clear-then-repopulate pattern on requestAnimationFrame forces re-announcement
 * even when the message is identical to the previous one.
 *
 * Intended consumers: interop-badge (count changes), interop-toast (future),
 * interop-progress (future), any component updating state without a focus move.
 *
 * SSR-safe: DOM operations are deferred to afterNextRender, which does not
 * run on the server.
 *
 * @example Basic usage
 * ```typescript
 * private announcer = inject(InteropAnnouncer);
 *
 * onCountChange(count: number): void {
 *   this.announcer.announce(`${count} unread notifications`);
 * }
 * ```
 *
 * @example Assertive announcement (interrupts current AT speech)
 * ```typescript
 * this.announcer.announce('Error: form submission failed', 'assertive');
 * ```
 */
@Injectable({ providedIn: "root" })
export class InteropAnnouncer implements OnDestroy {
  private readonly doc = inject(DOCUMENT);

  private politeEl: HTMLElement | null = null;
  private assertiveEl: HTMLElement | null = null;

  constructor() {
    afterNextRender(() => {
      this.politeEl = this.createRegion("polite");
      this.assertiveEl = this.createRegion("assertive");
      this.doc.body.appendChild(this.politeEl);
      this.doc.body.appendChild(this.assertiveEl);
    });
  }

  /**
   * Queue an announcement through the appropriate aria-live region.
   *
   * The region is cleared before repopulation so that identical successive
   * messages are still announced (some ATs suppress duplicate live region text).
   *
   * @param message - The text to announce.
   * @param politeness - 'polite' (default) waits for AT to finish speaking;
   *   'assertive' interrupts immediately. Prefer 'polite' for non-critical updates.
   */
  announce(
    message: string,
    politeness: "polite" | "assertive" = "polite",
  ): void {
    const el = politeness === "assertive" ? this.assertiveEl : this.politeEl;
    if (!el) return;

    // Clear first — forces re-announcement even for identical messages.
    el.textContent = "";
    requestAnimationFrame(() => {
      el!.textContent = message;
    });
  }

  /**
   * Clear both live regions immediately.
   * Useful when a component unmounts and its last announcement is no longer relevant.
   */
  clear(): void {
    if (this.politeEl) this.politeEl.textContent = "";
    if (this.assertiveEl) this.assertiveEl.textContent = "";
  }

  ngOnDestroy(): void {
    this.politeEl?.remove();
    this.assertiveEl?.remove();
  }

  private createRegion(politeness: "polite" | "assertive"): HTMLElement {
    const el = this.doc.createElement("div");
    el.setAttribute("aria-live", politeness);
    el.setAttribute("aria-atomic", "true");
    el.setAttribute("aria-relevant", "additions");
    // Visually hidden — present in DOM and accessible to AT, not visible to sighted users.
    el.style.cssText =
      "position:absolute;width:1px;height:1px;padding:0;margin:-1px;" +
      "overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0";
    return el;
  }
}
