import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { DemoExample } from "../../example/example";
import checkbox from "./examples/checkbox.html";
import radioCss from "./examples/radio.css";
import radio from "./examples/radio.html";

@Component({
	selector: "demo-cards",
	host: { "itx-flow": "" },
	imports: [DemoExample, RouterLink],
	templateUrl: "./cards-demo.html",
})
export class CardsDemo {
	protected readonly examples = { radio, radioCss, checkbox };
}
