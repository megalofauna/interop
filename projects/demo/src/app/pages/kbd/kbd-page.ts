import { Component, ChangeDetectionStrategy } from "@angular/core";
import { InteropKbd } from 'interop';
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoNotes, type DemoNote } from "../../components/demo-notes/demo-notes";

@Component({
	selector: "kbd-page",
	standalone: true,
	imports: [InteropKbd, DemoSection, DemoExample, DemoNotes],
	templateUrl: "./kbd-page.html",
	styleUrl: "./kbd-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KbdPage {
	notes: DemoNote[] = [
		{
			type: 'release',
			label: 'v0.1.0',
			title: 'Kbd component added to manifest',
			body: 'InteropKbd renders semantic keyboard key-cap indicators. No inputs — just wrap any text content inside a <kbd> element with the interop-kbd attribute.',
		},
		{
			type: 'note',
			label: 'Styling',
			body: 'All visual properties (font, padding, border, radius) are driven by --itx-* design tokens. Override at any ancestor to restyle for a specific context.',
		},
	];
}
