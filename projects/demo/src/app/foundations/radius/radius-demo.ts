import { Component, signal } from "@angular/core";
import { InteropIcon } from "interop/icon";

@Component({
	selector: "demo-radius",
	imports: [InteropIcon],
	templateUrl: "./radius-demo.html",
	styleUrl: "./radius-demo.css",
})
export class RadiusDemo {
	protected readonly candidates = [0, 2, 4, 6, 8, 12];
	protected readonly shape = signal<"squircle" | "round">("squircle");
}
