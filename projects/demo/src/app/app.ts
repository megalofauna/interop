import { Component, inject } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { DemoNav } from "./components/demo-nav/demo-nav";
import { InteropIcon, provideInteropIcons } from "interop";
import { DemoThemeToggle } from "./components/demo-theme-toggle/demo-theme-toggle";
import { DemoPageMeta } from "./services/page-meta";
import { TablerLayoutSidebarLeftExpand } from "interop/lib/iconsets/tabler";

@Component({
	selector: "app-root",
	standalone: true,
	imports: [RouterOutlet, RouterLink, RouterLinkActive, DemoNav, DemoThemeToggle, InteropIcon],
	templateUrl: "./app.html",
	styleUrl: "./app.scss",
	providers: [provideInteropIcons(TablerLayoutSidebarLeftExpand)]
})
export class App {
	/** Active page identity (category + title), published by <demo-masthead>.
	 * Surfaced as a breadcrumb in the header once the page's <h1> scrolls away. */
	protected readonly meta = inject(DemoPageMeta).meta;
}
