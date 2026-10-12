import { Component, DestroyRef, ElementRef, effect, inject, signal, viewChild } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { InteropDrawer } from "interop/popover";

const STORAGE_KEY = "demo-color-scheme";

@Component({
	selector: "demo-root",
	imports: [RouterOutlet, RouterLink, RouterLinkActive, InteropDrawer],
	templateUrl: "./app.html",
	styleUrl: "./app.css",
})
export class App {
	/** Starts from the last choice, then the system setting. */
	protected readonly dark = signal(
		(localStorage.getItem(STORAGE_KEY) ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark",
	);

	private readonly nav = viewChild.required<ElementRef<HTMLElement>>("nav");

	constructor() {
		// An open drawer stays in the top layer. Once the sidebar shows in the page, close it.
		const wide = matchMedia("(width >= 48rem)");
		const close = () => wide.matches && this.nav().nativeElement.matches(":popover-open") && this.nav().nativeElement.hidePopover();
		wide.addEventListener("change", close);
		inject(DestroyRef).onDestroy(() => wide.removeEventListener("change", close));

		effect(() => {
			const scheme = this.dark() ? "dark" : "light";
			document.documentElement.style.colorScheme = scheme;
			localStorage.setItem(STORAGE_KEY, scheme);
		});
	}
}
