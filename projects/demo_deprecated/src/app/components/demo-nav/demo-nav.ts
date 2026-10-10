import {
	Component,
	ChangeDetectionStrategy,
	DestroyRef,
	ElementRef,
	inject,
	signal,
	viewChild,
} from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { RouterLink, RouterLinkActive } from "@angular/router";
import {
	InteropButton,
	InteropChipBadge,
	InteropIcon,
	provideInteropIcons,
} from "interop";
import { TablerLayoutSidebarRightExpand } from "interop/lib/iconsets/tabler/outline/tabler-layout-sidebar-right-expand";
import { DEMO_CATALOG, type CatalogGroup } from "./demo-nav.catalog";

@Component({
	selector: "demo-nav",
	standalone: true,
	imports: [
		RouterLink,
		RouterLinkActive,
		InteropButton,
		InteropIcon,
		InteropChipBadge,
	],
	templateUrl: "./demo-nav.html",
	styleUrl: "./demo-nav.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [provideInteropIcons(TablerLayoutSidebarRightExpand)],
})
export class DemoNav {
	private readonly panel = viewChild<ElementRef<HTMLElement>>("panel");

	// Drawer mode on small viewports: the nav panel becomes an `auto` popover
	// (see demo-nav.html → [attr.popover]). On desktop it stays a normal in-grid
	// sidebar. It's toggled declaratively by the shell hamburger via
	// command="toggle-popover" — no open/close state lives here anymore; the
	// platform owns it (light-dismiss, Esc, aria-expanded).
	private readonly mql = inject(DOCUMENT).defaultView!.matchMedia(
		"(max-width: 59.999em)",
	);
	protected readonly drawer = signal(this.mql.matches);

	constructor() {
		const onChange = () => this.drawer.set(this.mql.matches);
		this.mql.addEventListener("change", onChange);
		inject(DestroyRef).onDestroy(() =>
			this.mql.removeEventListener("change", onChange),
		);
	}

	/** Close the drawer after navigating — but only when it's actually an open
	 * popover (a no-op on desktop, where the panel isn't a popover). */
	protected closeDrawer(): void {
		const el = this.panel()?.nativeElement;
		if (el?.matches(":popover-open")) el.hidePopover();
	}

	/**
	 * The catalog, verbatim. Shared with the components directory page via
	 * `demo-nav.catalog.ts` — a plain data module with no Angular imports, so
	 * that page can read the list without pulling this component and its icon
	 * provider into its own lazy chunk.
	 */
	readonly groups: readonly CatalogGroup[] = DEMO_CATALOG;
}
