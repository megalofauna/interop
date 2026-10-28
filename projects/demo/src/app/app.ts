import {
	Component,
	DestroyRef,
	ElementRef,
	inject,
	viewChild,
} from "@angular/core";
import {
	Router,
	RouterLink,
	RouterLinkActive,
	RouterOutlet,
} from "@angular/router";
import { InteropBadge } from "interop/badge";
import { InteropColorScheme } from "interop/color-scheme";
import { InteropFilter } from "interop/filter";
import { InteropIcon } from "interop/icon";
import { InteropDrawer } from "interop/popover";
import { InteropShortcut } from "interop/shortcut";
import { InteropToasts } from "interop/toast";

@Component({
	selector: "demo-root",
	imports: [
		RouterOutlet,
		RouterLink,
		RouterLinkActive,
		InteropBadge,
		InteropColorScheme,
		InteropDrawer,
		InteropFilter,
		InteropIcon,
		InteropShortcut,
		InteropToasts,
	],
	templateUrl: "./app.html",
	styleUrl: "./app.css",
})
export class App {
	/** Every page with a title, for the Go to page search. A pattern's route marks it with `data.pattern`, a lab's with `data.lab`. */
	protected readonly pageLinks = inject(Router)
		.config.filter((route) => typeof route.title === "string")
		.map((route) => ({
			path: route.path ?? "",
			title: route.title as string,
			pattern: route.data?.["pattern"] === true,
			lab: route.data?.["lab"] === true,
		}))
		.sort((a, b) => a.title.localeCompare(b.title));

	private readonly nav = viewChild.required<ElementRef<HTMLElement>>("nav");

	constructor() {
		// An open drawer stays in the top layer. Once the sidebar shows in the page, close it. The
		// shell's container query decides, and says so in --shell-nav (app.css).
		const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
		const resized = new ResizeObserver(() => {
			const shell = host.querySelector(".shell");
			const nav = this.nav().nativeElement;
			if (
				shell &&
				getComputedStyle(shell).getPropertyValue("--shell-nav").trim() ===
					"sidebar" &&
				nav.matches(":popover-open")
			)
				nav.hidePopover();
		});
		resized.observe(host);
		inject(DestroyRef).onDestroy(() => resized.disconnect());
	}
}
