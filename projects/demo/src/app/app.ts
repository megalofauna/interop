import { Component, signal } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { DemoNav } from "./components/demo-nav/demo-nav";
import { DemoThemeToggle } from "./components/demo-theme-toggle/demo-theme-toggle";

@Component({
	selector: "app-root",
	standalone: true,
	imports: [RouterOutlet, DemoNav, DemoThemeToggle],
	templateUrl: "./app.html",
	styleUrl: "./app.scss",
})
export class App {
	navOpen = signal(false);

	toggleNav() {
		this.navOpen.update((v) => !v);
	}
}
