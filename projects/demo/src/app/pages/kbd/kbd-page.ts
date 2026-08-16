import { Component, ChangeDetectionStrategy } from "@angular/core";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";

@Component({
	selector: "kbd-page",
	standalone: true,
	imports: [DemoSection, DemoExample, DemoMasthead],
	templateUrl: "./kbd-page.html",
	styleUrl: "./kbd-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KbdPage {
}
