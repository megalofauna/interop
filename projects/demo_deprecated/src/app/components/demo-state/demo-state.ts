import { Component, ChangeDetectionStrategy, input } from "@angular/core";

@Component({
	selector: "demo-state",
	standalone: true,
	host: {
		class: "demo-example__state",
	},
	template: `
		@if (label()) {
			<p class="demo-state__title">{{ label() }}</p>
		}
		<ng-content />
	`,
	styleUrl: "./demo-state.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoState {
	label = input<string | null>(null);
}
