import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	ElementRef,
	afterNextRender,
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
