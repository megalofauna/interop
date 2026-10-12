import { Component, signal } from "@angular/core";

@Component({
	selector: "demo-switch",
	templateUrl: "./switch-demo.html",
	styleUrl: "./switch-demo.css",
})
export class SwitchDemo {
	protected readonly wifi = signal(true);
}
