import { Component, effect, signal } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";

const STORAGE_KEY = "demo-color-scheme";

@Component({
	selector: "demo-root",
	imports: [RouterOutlet, RouterLink, RouterLinkActive],
	templateUrl: "./app.html",
	styleUrl: "./app.css",
})
export class App {
	/** Starts from the last choice, then the system setting. */
	protected readonly dark = signal(
		(localStorage.getItem(STORAGE_KEY) ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark",
	);

	constructor() {
		effect(() => {
			const scheme = this.dark() ? "dark" : "light";
			document.documentElement.style.colorScheme = scheme;
			localStorage.setItem(STORAGE_KEY, scheme);
		});
	}
}
