import {
	Component,
	ChangeDetectionStrategy,
	input,
} from '@angular/core';

export type CalloutType = 'info' | 'warning' | 'success' | 'danger';

/**
 * InteropCallout — semantic status callout/admonition.
 *
 * Uses status color tokens for automatic theming including dark mode.
 *
 * @example
 * ```html
 * <interop-callout type="info">
 *   This is an informational note.
 * </interop-callout>
 *
 * <interop-callout type="warning" heading="Caution">
 *   Be careful with this operation.
 * </interop-callout>
 * ```
 */
@Component({
	selector: 'interop-callout',
	standalone: true,
	template: `
		@if (heading()) {
			<strong class="interop-callout__heading">{{ heading() }}</strong>
		}
		<div class="interop-callout__body">
			<ng-content />
		</div>
	`,
	styleUrl: './interop-callout.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'role': 'note',
		'[attr.data-type]': 'type()',
	},
})
export class InteropCallout {
	/** Visual variant — determines status color scheme. */
	type = input<CalloutType>('info');

	/** Optional heading text displayed above the body. */
	heading = input<string | null>(null);
}
