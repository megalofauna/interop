import { watchInteropInDevMode } from './audit';

let ids = 0;
/** The tooltip on screen. Showing one hides it, as a `hint` popover does where it is supported. */
let shown: (() => void) | null = null;

/**
 * Shows `tooltip` while the pointer rests on `trigger` or the trigger has keyboard focus.
 *
 * The tooltip names the trigger when it is `interop-tooltip="label"`, and describes it otherwise.
 * It becomes a `popover="hint"` with `role="tooltip"` and an ID, unless it already has them.
 * Browsers without `hint` treat it as `manual`.
 *
 * - The pointer opens it after `--itx-tooltip-interest-delay-start` and closes it
 *   `--itx-tooltip-interest-delay-end` after leaving both the trigger and the tooltip, so the
 *   pointer can move onto it.
 * - Keyboard focus opens it at once. Focus from a click does not.
 * - Escape, blur and pressing the trigger close it. Touch never opens it.
 *
 * Returns a function that removes the behavior and the trigger's reference to the tooltip.
 */
export function bindTooltip(trigger: HTMLElement, tooltip: HTMLElement): () => void {
	if (!tooltip.hasAttribute('popover')) tooltip.setAttribute('popover', 'hint');
	if (!tooltip.hasAttribute('role')) tooltip.setAttribute('role', 'tooltip');
	tooltip.id ||= `itx-tooltip-${++ids}`;
	const relation = tooltip.getAttribute('interop-tooltip') === 'label' ? 'aria-labelledby' : 'aria-describedby';
	const references = (trigger.getAttribute(relation) ?? '').split(/\s+/).filter(Boolean);
	const added = !references.includes(tooltip.id);
	if (added) trigger.setAttribute(relation, [...references, tooltip.id].join(' '));

	let hovered = false;
	let focused = false;
	/** Set by pressing the trigger. The pointer has to leave before it can open the tooltip again. */
	let pressed = false;
	let open = false;
	let timer: ReturnType<typeof setTimeout> | undefined;

	const delay = (edge: 'start' | 'end') => {
		const value = getComputedStyle(tooltip).getPropertyValue(`--itx-tooltip-interest-delay-${edge}`).trim();
		const amount = parseFloat(value);
		if (Number.isNaN(amount)) return 0;
		return value.endsWith('ms') ? amount : amount * 1000;
	};

	const show = () => {
		clearTimeout(timer);
		if (open || !tooltip.isConnected) return;
		if (shown !== hide) shown?.();
		(tooltip as unknown as SourcedPopover).showPopover({ source: trigger });
		open = true;
		shown = hide;
	};
	function hide() {
		clearTimeout(timer);
		if (!open) return;
		tooltip.hidePopover();
		open = false;
		if (shown === hide) shown = null;
	}
	const update = () => {
		clearTimeout(timer);
		if (focused) show();
		else if (hovered && !pressed) timer = setTimeout(show, open ? 0 : delay('start'));
		else if (open) timer = setTimeout(hide, delay('end'));
	};

	// The browser closes a hint popover on its own, e.g. on a click elsewhere.
	const onToggle = (event: Event) => {
		if ((event as ToggleEvent).newState === 'open') return;
		open = hovered = focused = false;
		if (shown === hide) shown = null;
	};
	const onPointerEnter = (event: PointerEvent) => {
		if (event.pointerType === 'touch') return;
		hovered = true;
		update();
	};
	const onPointerLeave = (event: PointerEvent) => {
		if (event.pointerType === 'touch') return;
		const to = event.relatedTarget as Node | null;
		if (to && (trigger.contains(to) || tooltip.contains(to))) return;
		hovered = pressed = false;
		update();
	};
	const onFocusIn = () => {
		focused = trigger.matches(':focus-visible');
		update();
	};
	const onFocusOut = (event: FocusEvent) => {
		if (trigger.contains(event.relatedTarget as Node | null)) return;
		focused = false;
		hide();
	};
	const onPointerDown = () => {
		pressed = true;
		focused = false;
		hide();
	};
	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key !== 'Escape' || !open) return;
		// The tooltip takes this Escape, so a dialog or menu around it stays open.
		event.preventDefault();
		event.stopPropagation();
		hovered = focused = false;
		hide();
	};

	const document = trigger.ownerDocument;
	tooltip.addEventListener('toggle', onToggle);
	for (const element of [trigger, tooltip]) {
		element.addEventListener('pointerenter', onPointerEnter);
		element.addEventListener('pointerleave', onPointerLeave);
	}
	trigger.addEventListener('focusin', onFocusIn);
	trigger.addEventListener('focusout', onFocusOut);
	trigger.addEventListener('pointerdown', onPointerDown);
	document.addEventListener('keydown', onKeyDown, { capture: true });
	watchInteropInDevMode();

	return () => {
		hide();
		tooltip.removeEventListener('toggle', onToggle);
		for (const element of [trigger, tooltip]) {
			element.removeEventListener('pointerenter', onPointerEnter);
			element.removeEventListener('pointerleave', onPointerLeave);
		}
		trigger.removeEventListener('focusin', onFocusIn);
		trigger.removeEventListener('focusout', onFocusOut);
		trigger.removeEventListener('pointerdown', onPointerDown);
		document.removeEventListener('keydown', onKeyDown, { capture: true });
		if (added) {
			const rest = (trigger.getAttribute(relation) ?? '').split(/\s+/).filter((id) => id && id !== tooltip.id);
			if (rest.length) trigger.setAttribute(relation, rest.join(' '));
			else trigger.removeAttribute(relation);
		}
	};
}

/** TypeScript's DOM types do not include the `source` option yet. */
interface SourcedPopover {
	showPopover(options: { source: HTMLElement }): void;
}
