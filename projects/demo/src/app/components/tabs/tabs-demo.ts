import { Component, DestroyRef, ElementRef, afterNextRender, inject, signal, viewChildren } from "@angular/core";
import { bindTabs, type TabsChangeDetail } from "interop";
import { InteropBadge } from "interop/badge";
import { InteropIcon } from "interop/icon";

@Component({
	selector: "demo-tabs",
	imports: [InteropBadge, InteropIcon],
	templateUrl: "./tabs-demo.html",
	styleUrl: "./tabs-demo.css",
})
export class TabsDemo {
	protected readonly last = signal("nav");
	protected readonly months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	private readonly groups = viewChildren<ElementRef<HTMLElement>>("tabs");
	private readonly manual = viewChildren<ElementRef<HTMLElement>>("manual");

	constructor() {
		const destroyRef = inject(DestroyRef);
		afterNextRender(() => {
			for (const { nativeElement } of this.groups()) destroyRef.onDestroy(bindTabs(nativeElement));
			for (const { nativeElement } of this.manual()) destroyRef.onDestroy(bindTabs(nativeElement, { activation: "manual" }));
		});
	}

	protected changed(event: Event): void {
		this.last.set((event as CustomEvent<TabsChangeDetail>).detail.panel?.id ?? "");
	}
}
