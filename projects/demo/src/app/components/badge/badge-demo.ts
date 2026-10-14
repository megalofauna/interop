import { Component, signal } from "@angular/core";
import { InteropBadge, type BadgeLabel } from "interop/badge";

@Component({
	selector: "demo-badge",
	imports: [InteropBadge],
	templateUrl: "./badge-demo.html",
	styleUrl: "./badge-demo.css",
})
export class BadgeDemo {
	protected readonly unread = signal(3);
	protected readonly messages: BadgeLabel = {
		one: "unread message",
		other: "unread messages",
	};
}
