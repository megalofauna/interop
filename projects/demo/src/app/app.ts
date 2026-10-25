import {
	Component,
	DestroyRef,
	ElementRef,
	effect,
	inject,
	signal,
	viewChild,
} from "@angular/core";
import {
	Router,
	RouterLink,
	RouterLinkActive,
	RouterOutlet,
} from "@angular/router";
import { InteropBadge } from "interop/badge";
import { InteropFilter } from "interop/filter";
import { InteropDrawer } from "interop/popover";
import { InteropShortcut } from "interop/shortcut";
import { InteropToasts } from "interop/toast";

const STORAGE_KEY = "demo-color-scheme";

@Component({
	selector: "demo-root",
	imports: [
		RouterOutlet,
		RouterLink,
		RouterLinkActive,
		InteropBadge,
		InteropDrawer,
		InteropFilter,
		InteropShortcut,
		InteropToasts,
	],
	templateUrl: "./app.html",
	styleUrl: "./app.css",
})
export class App {
	/** Starts from the last choice, then the system setting. */
	protected readonly dark = signal(
		(localStorage.getItem(STORAGE_KEY) ??
			(matchMedia("(prefers-color-scheme: dark)").matches
				? "dark"
				: "light")) === "dark",
	);

	/** Every page with a title, for the Go to page search. A pattern's route marks it with `data.pattern`. */
	protected readonly pageLinks = inject(Router)
		.config.filter((route) => typeof route.title === "string")
		.map((route) => ({
			path: route.path ?? "",
			title: route.title as string,
			pattern: route.data?.["pattern"] === true,
		}))
		.sort((a, b) => a.title.localeCompare(b.title));

	private readonly nav = viewChild.required<ElementRef<HTMLElement>>("nav");

	constructor() {
		// An open drawer stays in the top layer. Once the sidebar shows in the page, close it.
		const wide = matchMedia("(width >= 48rem)");
		const close = () =>
			wide.matches &&
			this.nav().nativeElement.matches(":popover-open") &&
			this.nav().nativeElement.hidePopover();
		wide.addEventListener("change", close);
		inject(DestroyRef).onDestroy(() =>
			wide.removeEventListener("change", close),
		);

		effect(() => {
			const scheme = this.dark() ? "dark" : "light";
			document.documentElement.style.colorScheme = scheme;
			localStorage.setItem(STORAGE_KEY, scheme);
		});
	}
}
