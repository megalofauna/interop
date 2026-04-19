import { Component, ChangeDetectionStrategy, input } from "@angular/core";

@Component({
	selector: "demo-state",
	standalone: true,
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
