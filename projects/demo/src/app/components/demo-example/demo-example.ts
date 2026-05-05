import {
	Component,
	ChangeDetectionStrategy,
	input,
	contentChild,
} from "@angular/core";
import { DemoState } from "../demo-state/demo-state";
import { InteropContent, type Div } from "src/public-api";

@Component({
	selector: "demo-example",
	standalone: true,
	imports: [InteropContent],
	template: `
		<div class="demo-example__preview">
			@if (label()) {
				<p class="demo-example__label">{{ label() }}</p>
			}
			@if (lede(); as ledeNode) {
				<div class="demo-example__lede">
					<interop-content [node]="ledeNode" />
				</div>
			}
			<div class="demo-example__canvas" [class.has-state]="!!state()">
				<div class="demo-example__ui">
					<ng-content />
				</div>
				<ng-content select="demo-state" />
			</div>
			<div class="demo-example__code">
				<ng-content select="itx-code-block" />
			</div>
		</div>
	`,
	styleUrl: "./demo-example.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoExample {
	label = input<string | null>(null);
	lede = input<Div | null>(null);
	readonly state = contentChild(DemoState);
}
