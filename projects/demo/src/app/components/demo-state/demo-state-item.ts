import { Component, ChangeDetectionStrategy, input } from "@angular/core";

@Component({
	selector: "demo-state-item",
	standalone: true,
	template: `
		<span class="demo-state-item__label">{{ label() }}</span>
		<span class="demo-state-item__value"><ng-content /></span>
	`,
	styleUrl: "./demo-state-item.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoStateItem {
	label = input.required<string>();
}
