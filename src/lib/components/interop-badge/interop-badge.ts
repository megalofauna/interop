import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  isDevMode,
} from "@angular/core";
import { InteropAnnouncer } from "../../services/interop-announcer.service";

export type BadgePosition = "top-right" | "top-left" | "bottom-right" | "bottom-left";
export type BadgeAccessibleLabel = string | ((count: number) => string);

// NOTE: [href] / linked badge variant — should interop-badge support an href input that
// causes the host to behave as an interactive element (e.g. render an <a> internally,
// or accept a routerLink)? Deferred. Revisit before finalizing the API.
// See: prompts/interop-badge-open-questions.md

let nextInstanceId = 0;

/**
 * InteropBadge — overlay notification counter.
 *
 * Wraps a decorated element (button, link, avatar, icon) in a positioning
 * context it owns, then renders an absolutely-positioned indicator over it.
 * Because the component controls the container, overflow:visible is guaranteed
 * regardless of the surrounding layout — the structural clipping problem that
 * affects directive-based badge implementations cannot occur here.
 *
 * Accessibility model:
 * - The indicator span is aria-hidden="true" — the number in isolation is meaningless.
 * - A visually-hidden sibling carries the computed accessible text.
 * - afterNextRender wires that sibling to the first interactive element inside
 *   the projected content via aria-describedby.
 * - Opt-in live announcement ([announce]="true") queues count changes through
 *   InteropAnnouncer, which pre-seeds its aria-live regions at app init to avoid
 *   VoiceOver's create-then-populate timing bug.
 *
 * @example Basic notification counter
 * ```html
 * <interop-badge
 *   [count]="unreadCount()"
 *   [accessibleLabel]="(n) => n > 99 ? 'More than 99 notifications' : n + ' notifications'"
 *   [announce]="true">
 *   <button type="button">
 *     <interop-icon name="bell" />
 *   </button>
 * </interop-badge>
 * ```
 *
 * @example Dot indicator (no count text)
 * ```html
 * <interop-badge
 *   [dot]="true"
 *   [accessibleLabel]="'New activity'">
 *   <img [src]="avatarUrl" alt="Chris" />
 * </interop-badge>
 * ```
 *
 * @example Conditionally hidden
 * ```html
 * <interop-badge
 *   [count]="count()"
 *   [hidden]="count() === 0"
 *   [accessibleLabel]="count() + ' items in cart'">
 *   <button type="button">Cart</button>
 * </interop-badge>
 * ```
 */
@Component({
  selector: "interop-badge",
  standalone: true,
  template: `
    <ng-content />
    @if (!hidden()) {
      <span
        class="interop-badge__indicator"
        aria-hidden="true"
        [style.position-anchor]="anchorName"
        [attr.data-position]="position()"
        [attr.data-dot]="dot() ? '' : null">
        @if (!dot()) {
          {{ displayCount() }}
        }
      </span>
    }
    <span class="interop-sr-only" [id]="descId">{{ computedAccessibleText() }}</span>
  `,
  styleUrl: "./interop-badge.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "[attr.data-hidden]": "hidden() ? '' : null",
    "[style.anchor-name]": "anchorName",
  },
})
export class InteropBadge implements OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly announcer = inject(InteropAnnouncer);

  /** The numeric count to display. null hides the badge entirely. */
  count = input<number | null>(null);

  /** Display cap. When count exceeds this, the indicator shows "${max}+". */
  max = input<number>(99);

  /** Render the indicator as a dot with no count text. */
  dot = input<boolean>(false);

  /** Hide the indicator visually and remove it from the accessibility tree. */
  hidden = input<boolean>(false);

  /** Position of the indicator relative to the decorated element. */
  position = input<BadgePosition>("top-right");

  /**
   * Accessible label for the badge context.
   *
   * Provide a function when the count can exceed [max] — the function receives
   * the actual count (not the display string), letting you produce correct text:
   *
   * ```typescript
   * (n) => n > 99 ? 'More than 99 notifications' : `${n} notifications`
   * ```
   *
   * A plain string is appropriate for dot badges or fixed-label contexts.
   */
  accessibleLabel = input<BadgeAccessibleLabel | null>(null);

  /**
   * Opt-in live announcement. When true, count changes are announced through
   * InteropAnnouncer after the initial render (page load does not trigger speech).
   */
  announce = input<boolean>(false);

  private readonly instanceId = nextInstanceId++;
  readonly descId = `interop-badge-desc-${this.instanceId}`;
  readonly anchorName = `--itx-badge-${this.instanceId}`;

  /** The string rendered inside the indicator — respects the [max] cap. */
  protected displayCount = computed(() => {
    const count = this.count();
    const max = this.max();
    if (count === null) return "";
    return count > max ? `${max}+` : `${count}`;
  });

  /** The accessible text written to the visually-hidden sibling. */
  protected computedAccessibleText = computed(() => {
    const label = this.accessibleLabel();
    const count = this.count();
    if (!label) return "";
    return typeof label === "function" ? label(count ?? 0) : label;
  });

  private interactiveChild: HTMLElement | null = null;
  private hasInitialized = false;

  constructor() {
    if (isDevMode()) {
      afterNextRender(() => {
        if (!this.accessibleLabel() && !this.hidden()) {
          console.warn(
            "interop-badge: no [accessibleLabel] provided. " +
              "Screen reader users will have no context for the badge count. " +
              "Provide a string or (count: number) => string.",
          );
        }
      });
    }

    // Wire aria-describedby to the first interactive child after the DOM is ready.
    afterNextRender(() => {
      this.interactiveChild = this.el.nativeElement.querySelector(
        "button, a[href], input, select, textarea, [tabindex]",
      ) as HTMLElement | null;
      if (this.interactiveChild) {
        this.interactiveChild.setAttribute("aria-describedby", this.descId);
      }
      // NOTE: Interactive child discovery fallback — what to do when no interactive
      // child is found (non-interactive host like an avatar image). Deferred.
      // See: prompts/interop-badge-open-questions.md
    });

    // Announce count changes after initial render.
    effect(() => {
      this.count(); // track
      const text = this.computedAccessibleText();
      const shouldAnnounce = this.announce();

      if (!this.hasInitialized) {
        this.hasInitialized = true;
        return;
      }

      if (shouldAnnounce && text) {
        this.announcer.announce(text);
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up aria-describedby we placed on the child.
    if (this.interactiveChild) {
      const existing = this.interactiveChild.getAttribute("aria-describedby");
      if (existing === this.descId) {
        this.interactiveChild.removeAttribute("aria-describedby");
      }
    }
  }
}
