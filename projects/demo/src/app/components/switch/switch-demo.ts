import { Component, signal } from "@angular/core";
import { InteropCodeBlock } from "interop/code-block";
import { DemoExample } from "../../example/example";
import { region } from "../../example/region";
import disabled from "./examples/disabled.html";
import form from "./examples/form.html";
import longLabel from "./examples/long-label.html";
import longTrackCss from "./examples/long-track.css";
import longTrack from "./examples/long-track.html";
import onOff from "./examples/on-off.html";
import rtl from "./examples/rtl.html";
import sizes from "./examples/sizes.html";
import template from "./switch-demo.html";

@Component({
	selector: "demo-switch",
	host: { "itx-flow": "" },
	imports: [DemoExample, InteropCodeBlock],
	templateUrl: "./switch-demo.html",
	styleUrl: "./switch-demo.css",
})
export class SwitchDemo {
	protected readonly examples = {
		onOff,
		longLabel,
		disabled,
		form,
		rtl,
		sizes,
		longTrack,
		longTrackCss,
	};
	protected readonly signalCode = region(template, "signal");
	protected readonly wifi = signal(true);
}
