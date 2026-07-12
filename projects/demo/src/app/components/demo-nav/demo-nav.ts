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
import { InteropButton, InteropIcon, provideInteropIcons } from "interop";
import { TablerLayoutSidebarRightExpand } from "interop/lib/iconsets/tabler";

interface NavGroup {
	label: string;
	disabled?: boolean;
	items: NavItem[];
}

interface NavItem {
	label: string;
	route?: string;
}

@Component({
	selector: "demo-nav",
	standalone: true,
	imports: [RouterLink, RouterLinkActive, InteropButton, InteropIcon],
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

	groups: NavGroup[] = [
		{
			label: "Foundations",
			items: [{ label: "Typography", route: "/foundation/typography" }],
		},
		{
			label: "Components",
			items: [
				{ label: "Badge", route: "/components/badge" },
				{ label: "Button", route: "/components/button" },
				{ label: "Callout", route: "/components/callout" },
				{ label: "Checkbox", route: "/components/checkbox" },
				{ label: "Chip", route: "/components/chip" },
				{ label: "Code Block" },
				{ label: "Dialog", route: "/components/dialog" },
				{ label: "Expansion Panel", route: "/components/expansion-panel" },
				{ label: "Field", route: "/components/field" },
				{ label: "Icon", route: "/components/icon" },
				{ label: "Kbd", route: "/components/kbd" },
				{ label: "List", route: "/components/list" },
				{ label: "Listbox", route: "/components/listbox" },
				{ label: "Popover", route: "/components/popover" },
				{ label: "Progress", route: "/components/progress" },
				{ label: "Radio", route: "/components/radio" },
				{ label: "Resizable", route: "/components/resizable" },
				{ label: "Scroll Area", route: "/components/scroll-area" },
				{ label: "Segmented Control", route: "/components/segmented-control" },
				{ label: "Slider", route: "/components/slider" },
				{ label: "Stepper", route: "/components/stepper" },
				{ label: "Table", route: "/components/table" },
				{ label: "Tabs", route: "/components/tabs" },
				{ label: "Toggle", route: "/components/toggle" },
				{ label: "Toast", route: "/components/toast" },
				{ label: "Tooltip", route: "/components/tooltip" },
				{ label: "Visimorph", route: "/components/visimorph" },
			],
		},
		{
			label: "Directives",
			items: [{ label: "Auto Render", route: "/components/auto-render" }],
		},
		{
			label: "Primitives",
			items: [{ label: "Code Renderer", route: "/components/code-renderer" }],
		},
		{ label: "Rigs", disabled: true, items: [] },
		{ label: "Services", disabled: true, items: [] },
		{ label: "Composites", disabled: true, items: [] },
	];
}
