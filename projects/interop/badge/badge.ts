import {
	Component,
	HostAttributeToken,
	LOCALE_ID,
	booleanAttribute,
	computed,
	inject,
	input,
	numberAttribute,
} from '@angular/core';
import { watchInteropInDevMode } from 'interop';

/** What a count counts, by plural form: `{ one: 'unread message', other: 'unread messages' }`. */
export type BadgeLabel = string | Partial<Record<Intl.LDMLPluralRule, string>>;

const ROLES = new Set(['danger', 'warning', 'success', 'info']);

/**
 * A badge. Variants are values of the attribute: `interop-badge="dot"` draws a dot whose content
 * is spoken but not shown. With no `count` it shows its own content. With a `count` it shows the number and
 * speaks it with its label, e.g. "120 unread messages" behind a visible "99+". A count of zero
 * shows nothing. `announce` speaks each change as it happens.
 *
 * ```html
 * <span interop-badge>Beta</span>
 * <span interop-badge itx-badge-position="top-end" [count]="unread()" [label]="unreadLabel"></span>
 * ```
 */
@Component({
	selector: '[interop-badge]',
	template: `
		@if (counting()) {
			@if (count()! > 0) {
				@if (!dot) {
					<span aria-hidden="true">{{ shown() }}</span>
				}
				<span itx-visually-hidden>{{ spoken() }}</span>
			}
			@if (announce()) {
				<!-- A live region's text is left out of the surrounding control's name, so the count is said once. -->
				<span itx-visually-hidden role="status">{{ count()! > 0 ? spoken() : '' }}</span>
			}
		} @else {
			<span [attr.itx-visually-hidden]="dot ? '' : null"><ng-content /></span>
		}
	`,
	host: {
		// With announce, a zero count is visually hidden rather than hidden, so its live region exists
		// before the count changes: a region that appears with its text already in it is often not read.
		'[attr.hidden]': 'counting() && count()! <= 0 && !announce() ? "" : ownHidden',
		'[attr.itx-visually-hidden]': 'counting() && count()! <= 0 && announce() ? "" : null',
		'[style.--itx-badge-background-color]': 'customColor()',
	},
})
export class InteropBadge {
	readonly count = input(undefined, { transform: numberAttribute });
	/** The largest number shown; above it the badge shows `max+`. The spoken count is never capped. */
	readonly max = input(99, { transform: numberAttribute });
	readonly label = input<BadgeLabel>();
	/** Announces count changes as they happen. Off by default. */
	readonly announce = input(false, { transform: booleanAttribute });
	/** A role, `danger` `warning` `success` `info`, or any CSS color. */
	readonly color = input<string>(undefined, { alias: 'itx-color' });

	private readonly locale = inject(LOCALE_ID);
	protected readonly ownHidden = inject(new HostAttributeToken('hidden'), { optional: true });
	/** Variants are static, so the attribute as written in the template is enough. */
	protected readonly dot = (inject(new HostAttributeToken('interop-badge'), { optional: true }) ?? '')
		.split(/\s+/)
		.includes('dot');

	protected readonly counting = computed(() => {
		const count = this.count();
		return count !== undefined && !Number.isNaN(count);
	});

	protected readonly shown = computed(() => {
		const format = new Intl.NumberFormat(this.locale);
		const count = this.count()!;
		return count > this.max() ? `${format.format(this.max())}+` : format.format(count);
	});

	protected readonly spoken = computed(() => {
		const count = this.count()!;
		const label = this.label();
		const form =
			typeof label === 'string'
				? label
				: label && (label[new Intl.PluralRules(this.locale).select(count)] ?? label.other);
		return [new Intl.NumberFormat(this.locale).format(count), form].filter(Boolean).join(' ');
	});

	protected readonly customColor = computed(() => {
		const color = this.color();
		return color && !ROLES.has(color) ? color : null;
	});

	constructor() {
		watchInteropInDevMode();
	}
}
