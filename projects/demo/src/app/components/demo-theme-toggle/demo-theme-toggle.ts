import { Component, ChangeDetectionStrategy, signal, ElementRef, inject } from "@angular/core";

type ThemeMode = "light" | "dark" | "auto";

@Component({
	selector: "demo-theme-toggle",
	standalone: true,
	template: `
		<button
			class="theme-toggle"
			(click)="cycle()"
			[attr.aria-label]="'Theme: ' + mode()"
			[attr.title]="'Theme: ' + mode()"
		>
			@switch (mode()) {
				@case ("light") { ☀️ }
				@case ("dark") { 🌙 }
				@case ("auto") { 💻 }
			}
		</button>
	`,
	styleUrl: "./demo-theme-toggle.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoThemeToggle {
	private el = inject(ElementRef);
	mode = signal<ThemeMode>(this.readInitialMode());

	constructor() {
		this.applyTheme(this.mode());
	}

	cycle() {
		const order: ThemeMode[] = ["light", "dark", "auto"];
		const next = order[(order.indexOf(this.mode()) + 1) % order.length];
		this.mode.set(next);
		this.applyTheme(next);
	}

	private readInitialMode(): ThemeMode {
		const stored = localStorage.getItem("itx-theme");
		if (stored === "light" || stored === "dark") return stored;
		return "auto";
	}

	private applyTheme(mode: ThemeMode) {
		const root = this.findRoot();
		if (!root) return;
		if (mode === "auto") {
			root.removeAttribute("data-theme");
			localStorage.removeItem("itx-theme");
		} else {
			root.setAttribute("data-theme", mode);
			localStorage.setItem("itx-theme", mode);
		}
	}

	private findRoot(): HTMLElement | null {
		return document.querySelector<HTMLElement>("[interop-root]");
	}
}
