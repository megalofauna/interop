import { Component } from "@angular/core";
import { InteropScrollArea } from "interop/scroll-area";

@Component({
	selector: "demo-scroll-area",
	host: { "itx-flow": "" },
	imports: [InteropScrollArea],
	templateUrl: "./scroll-area-demo.html",
	styleUrl: "./scroll-area-demo.css",
})
export class ScrollAreaDemo {
	protected readonly lines = Array.from({ length: 30 }, (_, i) => i + 1);
	protected readonly columns = Array.from({ length: 12 }, (_, i) => i + 1);
}
