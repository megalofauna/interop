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
import { InteropScrollArea, InteropIcon, provideInteropIcons } from "interop";
import { TablerMapPin2 } from "interop/lib/iconsets/tabler";

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
	imports: [InteropScrollArea, InteropIcon],
	templateUrl: "./page-nav.html",
	styleUrl: "./page-nav.css",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		"[class.itx-pn--sticky]": "sticky()",
		"[class.itx-pn--stuck]": "isStuck()",
		"[class.itx-pn--horizontal]": "orientation() === 'horizontal'",
		"[class.itx-pn--vertical]": "orientation() === 'vertical'",
	},
	providers: [provideInteropIcons(TablerMapPin2)],
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

			const root = scrollParent(this.el.nativeElement);

			const observer = new IntersectionObserver(
				([entry]) => this.isStuck.set(entry.intersectionRatio < 1),
				{ root, threshold: [1], rootMargin: "-1px 0px 0px 0px" },
			);

			observer.observe(this.el.nativeElement);
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
