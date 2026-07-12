import { Component, ChangeDetectionStrategy, input } from "@angular/core";

type DemoSectionChips = [
	{
		label: string;
		size: string;
	},
];

@Component({
	selector: "section[demo-section], demo-section",
	standalone: true,
	template: `
		<h2 [id]="id()" class="demo-section__heading">
			<a [href]="'#' + id()" class="demo-section__anchor">#</a>
			{{ heading() }}
		</h2>

		<ng-content />
	`,
	styleUrl: "./demo-section.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoSection {
	id = input.required<string>();
	heading = input.required<string>();
	chips = input<DemoSectionChips>([
		{
			label: "css only",
			size: "sm",
		},
	]);
}
