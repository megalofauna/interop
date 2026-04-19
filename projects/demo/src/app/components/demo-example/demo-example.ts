import {
	Component,
	ChangeDetectionStrategy,
	input,
	contentChild,
} from "@angular/core";
import { DemoState } from "../demo-state/demo-state";

@Component({
	selector: "demo-example",
	standalone: true,
	imports: [],
	template: `
		@if (label()) {
			<p class="demo-example__label">{{ label() }}</p>
		}
		<div class="demo-example__preview">
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
	readonly state = contentChild(DemoState);
}
