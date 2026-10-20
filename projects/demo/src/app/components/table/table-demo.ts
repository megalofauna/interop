import { Component } from "@angular/core";
import { InteropCodeBlock } from "interop/code-block";
import { InteropScrollArea } from "interop/scroll-area";
import { examples } from "./table-examples";

@Component({
	selector: "demo-table",
	host: { "itx-flow": "" },
	imports: [InteropCodeBlock, InteropScrollArea],
	templateUrl: "./table-demo.html",
	styleUrls: ["./table-demo.css", "./table-stacked.css"],
})
export class TableDemo {
	protected readonly examples = examples;
	protected readonly crew = [
		{ name: "Ada Okafor", role: "Pilot", station: "Bridge", hours: "1,204" },
		{
			name: "Bo Lindqvist",
			role: "Engineer",
			station: "Engine room",
			hours: "986",
		},
		{ name: "Chen Wei", role: "Medic", station: "Med bay", hours: "1,532" },
	];
	protected readonly cargo = [
		{
			item: "Water",
			category: "Life support",
			deck: "C",
			mass: "12,000",
			volume: "12.0",
			value: "3,600",
		},
		{
			item: "Oxygen canisters",
			category: "Life support",
			deck: "C",
			mass: "2,450",
			volume: "8.4",
			value: "18,900",
		},
		{
			item: "Hull plating",
			category: "Spares",
			deck: "D",
			mass: "6,780",
			volume: "4.1",
			value: "54,200",
		},
		{
			item: "Seed vault",
			category: "Science",
			deck: "B",
			mass: "310",
			volume: "1.2",
			value: "220,000",
		},
	];
}
