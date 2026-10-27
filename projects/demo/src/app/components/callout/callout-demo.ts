import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { InteropIcon } from "interop/icon";
import { DemoExample } from "../../example/example";
import basic from "./examples/basic.html";
import hidden from "./examples/hidden.html";
import plain from "./examples/plain.html";
import statuses from "./examples/statuses.html";
import title from "./examples/title.html";

@Component({
	selector: "demo-callout",
	host: { "itx-flow": "" },
	imports: [DemoExample, InteropIcon, RouterLink],
	templateUrl: "./callout-demo.html",
	styleUrl: "./callout-demo.css",
})
export class CalloutDemo {
	protected readonly examples = { basic, statuses, hidden, title, plain };
}
