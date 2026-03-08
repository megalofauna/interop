import { Component, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
	NavigationEnd,
	Router,
	RouterLink,
	RouterLinkActive,
} from "@angular/router";
import { filter, map, startWith } from "rxjs";
import { InteropIcon } from "src/public-api";

@Component({
	selector: "[dtx-site-navigation]",
	imports: [RouterLink, RouterLinkActive, InteropIcon],
	templateUrl: "./site-navigation.html",
	styleUrl: "./site-navigation.scss",
})
export class SiteNavigation {
	private router = inject(Router);

	currentTitle = toSignal(
		this.router.events.pipe(
			filter((event): event is NavigationEnd => event instanceof NavigationEnd),
			map(() => this.getActiveTitle()),
			startWith(this.getActiveTitle()),
		),
		{ initialValue: "Interop" },
	);

	private getActiveTitle(): string {
		const snapshot = this.router.routerState.snapshot.root;
		let current = snapshot;
		while (current.firstChild) {
			current = current.firstChild;
		}
		return (current.title as string | undefined) ?? "Interop";
	}
}
