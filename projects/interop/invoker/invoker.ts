import { Directive, ElementRef, effect, inject, input } from '@angular/core';
import { bindPendingAction, watchInteropInDevMode } from 'interop';

type Target = HTMLElement | string | null;

/** TypeScript's DOM types do not include invoker commands yet. */
interface InvokerButton extends HTMLButtonElement {
	commandForElement: Element | null;
}

/**
 * Sets a button's command and popover targets from an element or an ID, and binds a pending
 * action. Angular templates cannot bind `commandForElement` or `popoverTargetElement` directly.
 *
 * ```html
 * <dialog #confirm>…</dialog>
 * <button command="show-modal" [commandFor]="confirm">Delete…</button>
 * <button [pendingAction]="save">Save</button>
 * ```
 */
@Directive({
	selector: 'button[commandFor], button[popoverTarget], button[pendingAction]',
})
export class InteropInvoker {
	private readonly button = inject<ElementRef<InvokerButton>>(ElementRef).nativeElement;

	/** The element a `command` acts on, or its ID. */
	readonly commandFor = input<Target>(null);
	/** The popover this button toggles, or its ID. */
	readonly popoverTarget = input<Target>(null);
	/** Runs on click; the button is busy until the promise settles. */
	readonly pendingAction = input<((event: MouseEvent) => Promise<unknown>) | null>(null);

	constructor() {
		watchInteropInDevMode();
		effect(() => target(this.button, 'commandForElement', 'commandfor', this.commandFor()));
		effect(() => target(this.button, 'popoverTargetElement', 'popovertarget', this.popoverTarget()));
		effect((onCleanup) => {
			const action = this.pendingAction();
			if (action) onCleanup(bindPendingAction(this.button, action));
		});
	}
}

/** An element sets the reference property; a string sets the ID attribute, as in plain HTML. */
function target(
	button: InvokerButton,
	property: 'commandForElement' | 'popoverTargetElement',
	attribute: string,
	value: Target,
): void {
	if (typeof value === 'string') {
		button[property] = null;
		button.setAttribute(attribute, value);
	} else {
		button.removeAttribute(attribute);
		button[property] = value;
	}
}
