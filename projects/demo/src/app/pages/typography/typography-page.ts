import { Component, ChangeDetectionStrategy } from "@angular/core";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";

@Component({
	selector: "typography-page",
	standalone: true,
	imports: [DemoSection, DemoMasthead],
	templateUrl: "./typography-page.html",
	styleUrl: "./typography-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypographyPage {}
