import { Component, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { bindTabs, type TabsChangeDetail } from "interop";
import { each } from "../../example/bind-each";
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

	protected readonly bind = each("[interop-tabs]", (root) => bindTabs(root));
	protected readonly bindManual = each("[interop-tabs]", (root) =>
		bindTabs(root, { activation: "manual" }),
	);
	protected readonly bindMain = (root: HTMLElement) => {
		const unbind = this.bind(root);
		const changed = (event: Event) =>
			this.last.set(
				(event as CustomEvent<TabsChangeDetail>).detail.panel?.id ?? "",
			);
		root.addEventListener("interop-tabs-change", changed);
		return () => {
			unbind();
			root.removeEventListener("interop-tabs-change", changed);
		};
	};

	protected readonly mainTs = `import { bindTabs } from "interop";

const tabs = document.querySelector("[interop-tabs]");
// Returns a function that removes the behavior.
bindTabs(tabs);
// Fires on the tab list when a different tab is selected.
tabs.addEventListener("interop-tabs-change", (event) => console.log(event.detail.panel.id));
`;
	protected readonly manualTs = `bindTabs(document.querySelector("#reports"), { activation: "manual" });
`;
}
