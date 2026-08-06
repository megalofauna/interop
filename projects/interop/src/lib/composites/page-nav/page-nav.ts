import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	ElementRef,
	afterNextRender,
	afterRenderEffect,
	inject,
	input,
	signal,
} from "@angular/core";
import { InteropScrollArea } from "../../components/public-api";

export interface PageNavLink {
	label: string;
	href: string;
	children?: PageNavLink[];
}

function scrollParent(el: HTMLElement): HTMLElement | null {
	let node = el.parentElement;
	while (node) {
		const { overflowY } = getComputedStyle(node);
		if (overflowY === "auto" || overflowY === "scroll") return node;
		node = node.parentElement;
	}
	return null;
}

/**
 * Nearest scrolling ancestor of `el`, searched no further than `root`.
 *
 * Bounded on purpose. Revealing the current link must never move the document
 * (or a consumer's scroller) out from under the reader — which is exactly what
 * `scrollIntoView({ block: "nearest" })` would do, since it walks every
 * ancestor. If the nav has no scrollport of its own, there is nothing to
 * reveal and we do nothing.
 */
function navScrollport(el: HTMLElement, root: HTMLElement): HTMLElement | null {
	const scrollable = /auto|scroll/;
	let node: HTMLElement | null = el;
	while (node) {
		const { overflowX, overflowY } = getComputedStyle(node);
		if (
			(scrollable.test(overflowX) && node.scrollWidth > node.clientWidth + 1) ||
			(scrollable.test(overflowY) && node.scrollHeight > node.clientHeight + 1)
		) {
			return node;
		}
		if (node === root) return null;
		node = node.parentElement;
	}
	return null;
}

/**
 * Smallest scroll delta that brings `el` fully inside `port` — `scrollIntoView`'s
 * `nearest` semantics, honouring the port's `scroll-padding` so a consumer can
 * keep the active link clear of the scroll-area's edge shadows.
 */
function nearestDelta(
	el: HTMLElement,
	port: HTMLElement,
): { left: number; top: number } {
	const e = el.getBoundingClientRect();
	const p = port.getBoundingClientRect();
	const style = getComputedStyle(port);
	// scroll-padding is `auto` by default, which parses to NaN.
	const pad = (v: string) => parseFloat(v) || 0;

	const top = p.top + pad(style.scrollPaddingTop);
	const bottom = p.bottom - pad(style.scrollPaddingBottom);
	const left = p.left + pad(style.scrollPaddingLeft);
	const right = p.right - pad(style.scrollPaddingRight);

	return {
		left: e.left < left ? e.left - left : e.right > right ? e.right - right : 0,
		top: e.top < top ? e.top - top : e.bottom > bottom ? e.bottom - bottom : 0,
	};
}

@Component({
	selector: "itx-page-nav",
	standalone: true,
	imports: [InteropScrollArea],
	templateUrl: "./page-nav.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		"[class.itx-pn--sticky]": "sticky()",
		"[class.itx-pn--stuck]": "isStuck()",
		"[class.itx-pn--horizontal]": "orientation() === 'horizontal'",
		"[class.itx-pn--vertical]": "orientation() === 'vertical'",
	},
})
export class PageNav {
	private readonly el = inject(ElementRef<HTMLElement>);
	private readonly destroyRef = inject(DestroyRef);

	readonly links = input<PageNavLink[]>([]);
	readonly label = input<string>("On this page");
	readonly activeHref = input<string | null>(null);
	readonly orientation = input<"horizontal" | "vertical">("horizontal");
	readonly sticky = input<boolean>(false);
	readonly smooth = input<boolean>(true);
	readonly fade = input<boolean>(false);

	readonly isStuck = signal(false);

	constructor() {
		afterNextRender(() => {
			if (!this.sticky()) return;

			const el = this.el.nativeElement;
			const root = scrollParent(el);

			// Fire "stuck" at the nav's actual pinned offset. Plain top:0 → -1px;
			// when a consumer sets --itx-pn-sticky-top (e.g. to stack beneath a
			// header) the sentinel margin must match that offset, or intersection
			// ratio never drops below 1 and the reveal never triggers.
			const stickyTop = parseFloat(getComputedStyle(el).top) || 0;

			const observer = new IntersectionObserver(
				([entry]) => this.isStuck.set(entry.intersectionRatio < 1),
				{
					root,
					threshold: [1],
					rootMargin: `-${stickyTop + 1}px 0px 0px 0px`,
				},
			);

			observer.observe(el);
			this.destroyRef.onDestroy(() => observer.disconnect());
		});

		// Keep the current link inside the nav's own scrollport as the reader
		// scrolls the page. Runs after render so the list is laid out; matches on
		// the raw `href` rather than the freshly-written `[aria-current]` so it
		// carries no dependency on binding order.
		afterRenderEffect(() => {
			const href = this.activeHref();
			if (!href) return;

			const root = this.el.nativeElement as HTMLElement;
			const link = Array.from(
				root.querySelectorAll<HTMLAnchorElement>("a"),
			).find((a) => a.getAttribute("href") === href);
			if (!link) return;

			const port = navScrollport(link, root);
			if (!port) return;

			const { left, top } = nearestDelta(link, port);
			// No `behavior` — that defers to the scrollport's `scroll-behavior`, so
			// CSS owns the motion (smooth by default, off under reduced motion).
			if (left || top) port.scrollBy({ left, top });
		});
	}

	handleLinkClick(event: MouseEvent, href: string): void {
		event.preventDefault();
		this.scrollToSection(href);
	}

	private scrollToSection(href: string): void {
		const el = document.querySelector(href);
		if (!el) return;

		const scroll = () =>
			el.scrollIntoView({
				behavior: this.fade()
					? "instant"
					: this.smooth()
						? "smooth"
						: "instant",
				block: "start",
			});

		if (this.fade() && "startViewTransition" in document) {
			(
				document as Document & { startViewTransition(cb: () => void): void }
			).startViewTransition(scroll);
		} else {
			scroll();
		}
	}
}
