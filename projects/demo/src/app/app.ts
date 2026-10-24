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
const FOCUS_RING_KEY = "demo-focus-ring";

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

	/** A focus ring variation from focus-rings.css, as a list of flags; empty is the library's ring. */
	protected readonly focusRing = signal(
		localStorage.getItem(FOCUS_RING_KEY) ?? "",
	);
	protected readonly focusRings = [
		{ value: "", label: "current" },
		{ value: "previous", label: "previous" },
		{ value: "dim", label: "dimmer neutral" },
		{ value: "hug", label: "hugging" },
		{ value: "halo", label: "halo" },
		{ value: "still", label: "still" },
	];

	/**
	 * Every page with a title, for the Go to page search, and the patterns: a name people look for
	 * that is built from another component, shown as an example on that component's page.
	 */
	protected readonly pageLinks: {
		title: string;
		path: string;
		fragment?: string;
		pattern?: boolean;
	}[] = [
		...inject(Router)
			.config.filter((route) => typeof route.title === "string")
			.map((route) => ({
				path: route.path ?? "",
				title: route.title as string,
				pattern: route.data?.["pattern"] === true,
			})),
		{
			title: "Chips",
			path: "components/checkbox",
			fragment: "chips",
			pattern: true,
		},
		{
			title: "Command palette",
			path: "components/dialog",
			fragment: "command-palette",
			pattern: true,
		},
		{
			title: "Radio cards",
			path: "components/radio-group",
			fragment: "cards",
			pattern: true,
		},
		{
			title: "Split button",
			path: "components/button",
			fragment: "split-button",
			pattern: true,
		},
	].sort((a, b) => a.title.localeCompare(b.title));

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

		effect(() => {
			const ring = this.focusRing();
			if (ring) document.documentElement.dataset["focusRing"] = ring;
			else delete document.documentElement.dataset["focusRing"];
			localStorage.setItem(FOCUS_RING_KEY, ring);
		});
	}
}
