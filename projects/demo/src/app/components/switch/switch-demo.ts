import { Component, signal } from "@angular/core";

@Component({
	selector: "demo-switch",
	host: { "itx-flow": "" },
	templateUrl: "./switch-demo.html",
	styleUrl: "./switch-demo.css",
})
export class SwitchDemo {
	protected readonly wifi = signal(true);
}
