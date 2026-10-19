import { Component, signal } from "@angular/core";
import { type TabsChangeDetail } from "interop";
import { InteropBadge } from "interop/badge";
import { InteropIcon } from "interop/icon";
import { InteropTabs } from "interop/tabs";

@Component({
	selector: "demo-tabs",
	host: { "itx-flow": "" },
	imports: [InteropBadge, InteropIcon, InteropTabs],
	templateUrl: "./tabs-demo.html",
	styleUrl: "./tabs-demo.css",
})
export class TabsDemo {
	protected readonly last = signal("nav");
	protected readonly months = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];

	protected changed(event: Event): void {
		this.last.set(
			(event as CustomEvent<TabsChangeDetail>).detail.panel?.id ?? "",
		);
	}
}
