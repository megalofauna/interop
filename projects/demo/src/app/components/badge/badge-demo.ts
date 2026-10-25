import { Component, signal } from "@angular/core";
import { InteropBadge, type BadgeLabel } from "interop/badge";
import { InteropCodeBlock } from "interop/code-block";
import { DemoExample } from "../../example/example";
import { region } from "../../example/region";
import template from "./badge-demo.html";
import sizes from "./examples/sizes.html";
import text from "./examples/text.html";

@Component({
	selector: "demo-badge",
	host: { "itx-flow": "" },
	imports: [DemoExample, InteropBadge, InteropCodeBlock],
	templateUrl: "./badge-demo.html",
	styleUrl: "./badge-demo.css",
})
export class BadgeDemo {
	protected readonly examples = { text, sizes };
	protected readonly countCode = region(template, "count");
	protected readonly dotCode = region(template, "dot");
	protected readonly positionsCode = region(template, "positions");

	protected readonly unread = signal(3);
	protected readonly messages: BadgeLabel = {
		one: "unread message",
		other: "unread messages",
	};
}
