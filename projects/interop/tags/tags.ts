import { Directive, ElementRef, afterRenderEffect, inject, input } from '@angular/core';
import { bindTagInput, bindTags } from 'interop';

/**
 * Calls `bindTags()` on the list, after it renders in the browser: focus stays in place as tags are
 * removed, and each removal is announced.
 *
 * ```html
 * <ul interop-tags role="list" aria-label="Tags" [fallback]="entry">
 *   @for (tag of tags(); track tag) {
 *     <li>{{ tag }} <button type="button" (click)="remove(tag)"><span itx-visually-hidden>Remove {{ tag }}</span>…</button></li>
 *   }
 * </ul>
 * <input #entry interop-tag-input [tags]="list" (interop-tags-add)="add($event)">
 * ```
 */
@Directive({
	selector: 'ul[interop-tags]',
	exportAs: 'interopTags',
})
export class InteropTags {
	readonly element = inject<ElementRef<HTMLUListElement>>(ElementRef).nativeElement;

	/** Where focus goes when the last tag is removed, e.g. the tag input. */
	readonly fallback = input<HTMLElement | null>(null);
	/** A visually hidden `role="status"` element, for browsers without `ariaNotify()`. */
	readonly status = input<HTMLElement | null>(null);
	/** The announcement for a removed tag. */
	readonly removed = input<((text: string) => string) | undefined>(undefined);

	constructor() {
		afterRenderEffect((onCleanup) => {
			onCleanup(bindTags(this.element, { fallback: this.fallback(), status: this.status(), removed: this.removed() }));
		});
	}
}

/**
 * Calls `bindTagInput()` on the input, after it renders in the browser. Listen for
 * `(interop-tags-add)` to add the tag. The list's own `InteropTags` handles focus and announcements,
 * so give it this input as its `fallback`. The inputs are not named `list` and `required`, which are
 * the input element's own attributes: `list` names its datalist.
 */
@Directive({
	selector: 'input[interop-tag-input]',
})
export class InteropTagInput {
	private readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;

	/** The tag list this input adds to. */
	readonly tags = input.required<HTMLElement>();
	/** With a message, the input is required and invalid while the list is empty. */
	readonly tagsRequired = input<string | undefined>(undefined);
	/** A visually hidden `role="status"` element, for browsers without `ariaNotify()`. */
	readonly status = input<HTMLElement | null>(null);
	/** The announcement for an added tag. */
	readonly added = input<((text: string) => string) | undefined>(undefined);
	/** The message for a rejected value, shown and spoken as the input's validation message. */
	readonly rejected = input<((value: string) => string) | undefined>(undefined);

	constructor() {
		afterRenderEffect((onCleanup) => {
			onCleanup(
				bindTagInput(this.element, {
					list: this.tags(),
					required: this.tagsRequired(),
					status: this.status(),
					added: this.added(),
					rejected: this.rejected(),
					tags: false,
				}),
			);
		});
	}
}
