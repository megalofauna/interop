import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { InteropBadge } from "interop/badge";
import { DemoExample } from "../../example/example";
import checkbox from "./examples/checkbox.html";
import radioCss from "./examples/radio.css";
import radio from "./examples/radio.html";

@Component({
	selector: "demo-cards",
	host: { "itx-flow": "" },
	imports: [DemoExample, InteropBadge, RouterLink],
	templateUrl: "./cards-demo.html",
	styleUrl: "../patterns.css",
})
export class CardsDemo {
	protected readonly examples = { radio, radioCss, checkbox };
}
