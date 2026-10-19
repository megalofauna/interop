import { Component } from "@angular/core";
import { InteropIcon } from "interop/icon";

@Component({
	selector: "demo-focus-ring",
	host: { "itx-flow": "" },
	imports: [InteropIcon],
	templateUrl: "./focus-ring-demo.html",
	styleUrl: "./focus-ring-demo.css",
})
export class FocusRingDemo {
	protected readonly candidates = [
		{
			value: "",
			name: "Current: blue, settling in",
			note: "2px, 2px out, blue: 5.0:1 light, 7.1:1 dark. Arrives 4px out and settles in over 150ms; reduced motion turns that off.",
		},
		{
			value: "previous",
			name: "Previous: neutral, still",
			note: "The ring it replaced. Neutral-950 light (19.8:1), neutral-300 dark (11.7:1).",
		},
		{
			value: "dim",
			name: "Dimmer neutral",
			note: "Neutral-700 light (10.4:1), neutral-400 dark (6.7:1), settling in.",
		},
		{
			value: "hug",
			name: "Hugging",
			note: "Blue, 1px out, so the ring reads as the control's edge.",
		},
		{
			value: "halo",
			name: "Halo",
			note: "A 1px blue ring with a soft 3px glow. Forced colors keep the ring, without the glow.",
		},
		{
			value: "still",
			name: "Still",
			note: "Blue, without settling in.",
		},
	];
}
