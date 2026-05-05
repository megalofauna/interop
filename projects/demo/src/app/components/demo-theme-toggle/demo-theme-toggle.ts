import {
	Component,
	ChangeDetectionStrategy,
	ElementRef,
	OnDestroy,
	computed,
	signal,
	viewChild,
} from "@angular/core";
import {
	InteropButton,
	InteropIcon,
	InteropListbox,
	InteropOption,
	provideInteropIcons,
} from "src/public-api";
import { TablerSun } from "src/lib/iconsets/tabler/outline/tabler-sun";
import { TablerMoon } from "src/lib/iconsets/tabler/outline/tabler-moon";
import { TablerDeviceDesktop } from "src/lib/iconsets/tabler/outline/tabler-device-desktop";
import {
	autoUpdate,
	computePosition,
	flip,
	offset,
	shift,
} from "@floating-ui/dom";

export type ThemeMode = "light" | "dark" | "system";

let nextId = 0;

@Component({
	selector: "demo-theme-toggle",
	standalone: true,
	imports: [InteropIcon, InteropListbox, InteropOption, InteropButton],
	providers: [provideInteropIcons(TablerSun, TablerMoon, TablerDeviceDesktop)],
	templateUrl: "./demo-theme-toggle.html",
	styleUrl: "./demo-theme-toggle.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoThemeToggle implements OnDestroy {
	private readonly triggerEl = viewChild("triggerEl", { read: ElementRef<HTMLElement> });
	private readonly popoverEl = viewChild<ElementRef<HTMLElement>>("popoverEl");
	private cleanupAutoUpdate: (() => void) | null = null;

	readonly popoverId = `theme-toggle-popover-${nextId++}`;

	mode = signal<ThemeMode>(this.readInitialMode());
	isOpen = signal(false);

	readonly currentIcon = computed(() => {
		switch (this.mode()) {
			case "light":
				return "tabler-sun";
			case "dark":
				return "tabler-moon";
			case "system":
				return "tabler-device-desktop";
		}
	});

	constructor() {
		this.applyTheme(this.mode());
	}

	ngOnDestroy(): void {
		this.stopPositioning();
	}

	onSelect(value: unknown): void {
		const mode = value as ThemeMode;
		this.mode.set(mode);
		this.applyTheme(mode);
		this.popoverEl()?.nativeElement.hidePopover();
	}

	onToggle(event: Event): void {
		const opened = (event as ToggleEvent).newState === "open";
		this.isOpen.set(opened);
		opened ? this.startPositioning() : this.stopPositioning();
	}

	private startPositioning(): void {
		const trigger = this.triggerEl()?.nativeElement;
		const popover = this.popoverEl()?.nativeElement;
		if (!trigger || !popover) return;

		const update = () =>
			computePosition(trigger, popover, {
				placement: "bottom-end",
				strategy: "fixed",
				middleware: [offset(4), flip(), shift({ padding: 8 })],
			}).then(({ x, y }) => {
				Object.assign(popover.style, { left: `${x}px`, top: `${y}px` });
			});

		this.cleanupAutoUpdate = autoUpdate(trigger, popover, update);
	}

	private stopPositioning(): void {
		this.cleanupAutoUpdate?.();
		this.cleanupAutoUpdate = null;
	}

	private readInitialMode(): ThemeMode {
		const stored = localStorage.getItem("itx-theme");
		if (stored === "light" || stored === "dark" || stored === "system")
			return stored;
		return "system";
	}

	private applyTheme(mode: ThemeMode): void {
		const root = document.querySelector<HTMLElement>("[interop-root]");
		if (!root) return;
		if (mode === "system") {
			root.removeAttribute("data-theme");
			localStorage.removeItem("itx-theme");
		} else {
			root.setAttribute("data-theme", mode);
			localStorage.setItem("itx-theme", mode);
		}
	}
}
