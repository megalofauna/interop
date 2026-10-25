import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { InteropBadge } from "interop/badge";
import { InteropCodeBlock } from "interop/code-block";
import { examples } from "./cards-examples";

@Component({
	selector: "demo-cards",
	host: { "itx-flow": "" },
	imports: [InteropBadge, InteropCodeBlock, RouterLink],
	templateUrl: "./cards-demo.html",
	styleUrls: ["../patterns.css", "./cards-demo.css"],
})
export class CardsDemo {
	protected readonly examples = examples;
	protected readonly plans = [
		{
			id: "free",
			name: "Free",
			price: "$0",
			summary: "Three projects, community support.",
			popular: false,
		},
		{
			id: "pro",
			name: "Pro",
			price: "$29 a month",
			summary: "Unlimited projects, priority support.",
			popular: true,
		},
		{
			id: "team",
			name: "Team",
			price: "$99 a month",
			summary: "Everything in Pro, with roles and audit logs.",
			popular: false,
		},
	];
}
