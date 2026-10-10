import { Component, ChangeDetectionStrategy } from "@angular/core";
import {
	InteropAutoRender,
	InteropScrollArea,
	InteropTable,
	InteropCellDef,
	type TableColumn,
} from "interop";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";

interface ApiEntry {
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
}

@Component({
	selector: "auto-render-page",
	standalone: true,
	imports: [
		InteropAutoRender,
		InteropScrollArea,
		InteropTable,
		InteropCellDef,
		DemoSection,
		DemoExample,
		DemoMasthead,
	],
	templateUrl: "./auto-render-page.html",
	styleUrl: "./auto-render-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoRenderPage {
	readonly cargoItems = Array.from({ length: 200 }, (_, i) => ({
		id: `CARGO-${String(i + 1).padStart(4, "0")}`,
		name: [
			"Deuterium Cell",
			"Plasma Conduit",
			"Hull Plating (Grade A)",
			"Navigation Array",
			"Antimatter Pod",
			"Flux Capacitor Assembly",
			"Graviton Emitter",
			"Sensor Cluster",
		][i % 8],
		qty: (i % 12) + 1,
	}));

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{
			name: "interopAutoRender",
			type: "string",
			default: "'48px'",
			description:
				"Estimated item height for the contain-intrinsic-size placeholder. Any valid CSS length. Pass a value starting with 'auto' for full contain-intrinsic-size control.",
		},
	];
}
