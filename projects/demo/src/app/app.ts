import { Component, computed, inject, signal } from "@angular/core";
import {
	Router,
	RouterLink,
	RouterLinkActive,
	RouterOutlet,
} from "@angular/router";
import { DemoNav } from "./components/demo-nav/demo-nav";
import {
	InteropIcon,
	InteropKbd,
	InteropCommandPalette,
	InteropHotkey,
	provideInteropIcons,
	type CommandItem,
} from "interop";
import { DemoThemeToggle } from "./components/demo-theme-toggle/demo-theme-toggle";
import { DemoPageMeta } from "./services/page-meta";
import { TablerLayoutSidebarLeftExpand } from "interop/lib/iconsets/tabler";

@Component({
	selector: "app-root",
	standalone: true,
	imports: [
		RouterOutlet,
		RouterLink,
		RouterLinkActive,
		DemoNav,
		DemoThemeToggle,
		InteropIcon,
		InteropKbd,
		InteropCommandPalette,
		InteropHotkey,
	],
	templateUrl: "./app.html",
	styleUrl: "./app.scss",
	providers: [provideInteropIcons(TablerLayoutSidebarLeftExpand)],
})
export class App {
	private readonly router = inject(Router);

	/** Active page identity (category + title), published by <demo-masthead>.
	 * Surfaced as a breadcrumb in the header once the page's <h1> scrolls away. */
	protected readonly meta = inject(DemoPageMeta).meta;

	// ── Command palette (⌘K nav) ────────────────────────────────────────────
	protected readonly paletteOpen = signal(false);
	protected readonly query = signal("");

	/** Every routed page as a command, derived straight from the router config. */
	private readonly allCommands: CommandItem[] = this.router.config
		.filter((r) => !!r.path && r.path !== "**" && !r.redirectTo)
		.map((r) => ({
			id: r.path as string,
			label: (typeof r.title === "string"
				? r.title
				: (r.path as string)
			).replace(/ — Interop$/, ""),
		}));

	/** Controlled filtering — the palette never filters; the consumer does. */
	protected readonly filteredCommands = computed<CommandItem[]>(() => {
		const q = this.query().trim().toLowerCase();
		return q
			? this.allCommands.filter((c) => c.label.toLowerCase().includes(q))
			: this.allCommands;
	});

	protected openPalette(): void {
		this.paletteOpen.set(true);
	}

	protected runCommand(item: CommandItem): void {
		this.paletteOpen.set(false);
		void this.router.navigateByUrl("/" + item.id);
	}
}
