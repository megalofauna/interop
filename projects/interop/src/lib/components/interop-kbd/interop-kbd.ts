import {
	Component,
	ChangeDetectionStrategy,
} from '@angular/core';

/**
 * InteropKbd — keyboard key-cap indicator.
 *
 * Renders an inline styled `<kbd>` element for displaying keyboard shortcuts.
 * All visual properties are driven by `--itx-*` design tokens.
 *
 * @example
 * ```html
 * Press <kbd interop-kbd>Ctrl</kbd> + <kbd interop-kbd>S</kbd> to save.
 * ```
 */
@Component({
	selector: 'kbd[interop-kbd]',
	standalone: true,
	template: '<ng-content />',
	styleUrl: './interop-kbd.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InteropKbd {}
