import { CUSTOM_ELEMENTS_SCHEMA, Component, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import type { TabsChangeDetail } from "interop";
import "interop/tabs";
import { DemoExample } from "../../example/example";
import counts from "./examples/counts.html";
import disabled from "./examples/disabled.html";
import manual from "./examples/manual.html";
import many from "./examples/many.html";
import rtl from "./examples/rtl.html";
import segmentedIcons from "./examples/segmented-icons.html";
import segmented from "./examples/segmented.html";
import sizes from "./examples/sizes.html";
import tabs from "./examples/tabs.html";
import vertical from "./examples/vertical.html";

@Component({
	selector: "demo-tabs",
	host: { "itx-flow": "" },
	imports: [DemoExample, RouterLink],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: "./tabs-demo.html",
})
export class TabsDemo {
	protected readonly examples = {
		tabs,
		sizes,
		segmented,
		segmentedIcons,
		counts,
		disabled,
		manual,
		many,
		vertical,
		rtl,
	};
	protected readonly last = signal("nav");

	/** Tabs rendered by Angular's own template, to show the element in a framework's control flow. */
	/**
	 * The panel shown at first. Its value never changes, so Angular writes each panel's `hidden` once,
	 * for the first render, and the element owns it after that.
	 */
	protected readonly shownFirst = "log-1";
	protected readonly logs = signal([
		{ id: "log-1", name: "Log 1", text: "Docking clamps released." },
		{ id: "log-2", name: "Log 2", text: "Course corrected by 0.4 degrees." },
	]);
	private nextLog = 3;
	protected addLog(): void {
		const n = this.nextLog++;
		this.logs.update((logs) => [
			...logs,
			{ id: `log-${n}`, name: `Log ${n}`, text: `Entry ${n} recorded.` },
		]);
	}
	protected removeSelected(root: HTMLElement): void {
		const tab = root.querySelector('[role="tab"][aria-selected="true"]');
		const id = tab?.getAttribute("aria-controls");
		this.logs.update((logs) => logs.filter((log) => log.id !== id));
	}

	/** Follows the selection of the first example; the element binds itself. */
	protected readonly follow = (root: HTMLElement) => {
		const changed = (event: Event) =>
			this.last.set(
				(event as CustomEvent<TabsChangeDetail>).detail.panel?.id ?? "",
			);
		root.addEventListener("interop-tabs-change", changed);
		return () => root.removeEventListener("interop-tabs-change", changed);
	};

	protected readonly mainTs = `// Once, anywhere: defines <interop-tabs>.
import "interop/tabs";

// Fires on the tab list when a different tab is selected.
document.addEventListener("interop-tabs-change", (event) => console.log(event.detail.panel.id));
`;
}
