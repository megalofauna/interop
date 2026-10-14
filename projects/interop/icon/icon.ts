import {
	Component,
	DestroyRef,
	ElementRef,
	HostAttributeToken,
	computed,
	effect,
	inject,
	input,
	isDevMode,
	numberAttribute,
	signal,
} from '@angular/core';
import { getIcon } from 'interop';

const attribute = (name: string) => inject(new HostAttributeToken(name), { optional: true });

/**
 * Draws a registered icon into its `<svg>` host:
 *
 * ```html
 * <svg interop-icon name="tabler-check"></svg>
 * <svg interop-icon name="tabler-check" size="20" aria-label="Done"></svg>
 * ```
 *
 * Without `name`, the consumer's own SVG children render unchanged. An icon is hidden from
 * assistive technology unless the host has `aria-label` or `aria-labelledby`.
 */
@Component({
	selector: 'svg[interop-icon]',
	template: `
		@if (icon(); as icon) {
			<svg:g [attr.fill]="icon.fill" [attr.stroke]="icon.stroke" stroke-linecap="round" stroke-linejoin="round">
				@for (path of icon.paths; track $index) {
					<svg:path
						[attr.d]="path.d"
						[attr.fill]="path.fill ?? null"
						[attr.stroke]="path.stroke ?? null"
						[attr.opacity]="path.opacity ?? null"
					/>
				}
			</svg:g>
		} @else {
			<ng-content />
		}
	`,
	host: {
		'[attr.viewBox]': 'viewBox()',
		'[attr.role]': 'labelled() ? "img" : null',
		'[attr.aria-hidden]': 'labelled() ? null : "true"',
		'[style.--itx-icon-inline-size]': 'lockedSize()',
		'[style.--itx-icon-block-size]': 'lockedSize()',
	},
})
export class InteropIcon {
	/** A registered icon name, e.g. `tabler-check`. */
	readonly name = input<string>();
	/** Pixels. Fixes the icon at this size; without it the icon is 1em. */
	readonly size = input(undefined, { transform: numberAttribute });

	private readonly ownViewBox = attribute('viewBox');
	/** Starts from the template's attributes, so server-rendered HTML is right, then follows bound labels. */
	protected readonly labelled = signal(attribute('aria-label') !== null || attribute('aria-labelledby') !== null);

	protected readonly icon = computed(() => {
		const name = this.name();
		return name ? getIcon(name) : undefined;
	});
	protected readonly viewBox = computed(() => this.icon()?.viewBox ?? this.ownViewBox);
	protected readonly lockedSize = computed(() => {
		const size = this.size();
		return size === undefined || Number.isNaN(size) ? null : `${size}px`;
	});

	constructor() {
		const host = inject<ElementRef<SVGSVGElement>>(ElementRef).nativeElement;
		if (typeof MutationObserver !== 'undefined') {
			const label = () => this.labelled.set(host.hasAttribute('aria-label') || host.hasAttribute('aria-labelledby'));
			const observer = new MutationObserver(label);
			observer.observe(host, { attributes: true, attributeFilter: ['aria-label', 'aria-labelledby'] });
			inject(DestroyRef).onDestroy(() => observer.disconnect());
		}
		if (isDevMode()) {
			effect(() => {
				const name = this.name();
				if (name && !getIcon(name)) console.warn(`InteropIcon: "${name}" is not registered. Pass it to registerIcons().`);
			});
		}
	}
}
