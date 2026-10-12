import { Component } from "@angular/core";

@Component({
	selector: "demo-popover",
	templateUrl: "./popover-demo.html",
	styleUrl: "./popover-demo.css",
})
export class PopoverDemo {
	protected readonly lines = Array.from({ length: 40 }, (_, i) => i + 1);
}
