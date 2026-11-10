/**
 * Shows every tooltip in the document from its markup: an element with `interop-tooltip`,
 * `popover="hint"` and an `id`, and a trigger that names it in `aria-labelledby` (a label tooltip,
 * `interop-tooltip="label"`) or `aria-describedby` (a describing tooltip).
 *
 *   <button interop-button type="button" aria-describedby="tip-save">Save</button>
 *   <span interop-tooltip id="tip-save" popover="hint" role="tooltip">Saves without publishing</span>
 *
 * - The pointer opens a tooltip after `--itx-tooltip-interest-delay-start` and closes it
 *   `--itx-tooltip-interest-delay-end` after leaving both the trigger and the tooltip.
 * - Keyboard focus opens it at once. Focus from a click does not.
 * - Escape, blur and pressing the trigger close it. Touch never opens it.
 * - A `<label>` stands for its control, so hovering a label opens its control's tooltip.
 * - A trigger with both a label and a describing tooltip shows the describing one.
 * - One tooltip is on screen at a time.
 *
 * It listens once on the document and reads the markup each time an event arrives, so triggers and
 * tooltips that a framework adds, replaces or re-renders need nothing more. It writes no attributes.
 * Calling it again adds no listeners; each call returns a function that removes it, and the last
 * one stops listening.
 */
export function bindTooltips(doc: Document = document): () => void {
	let install = installs.get(doc);
	if (!install) {
		install = { count: 0, listening: listen(doc) };
		installs.set(doc, install);
	}
	install.count++;
	let removed = false;
	return () => {
		if (removed) return;
		removed = true;
		if (--install!.count > 0) return;
		install!.listening.abort();
		installs.delete(doc);
		for (const tooltip of openTooltips(doc)) tooltip.hidePopover();
	};
}

const TOOLTIP = '[interop-tooltip]';
/** Describing first: a trigger with both kinds of tooltip shows the describing one. */
const RELATIONS = ['aria-describedby', 'aria-labelledby'] as const;

interface Install {
	count: number;
	listening: AbortController;
}
const installs = new WeakMap<Document, Install>();

/** What the markup cannot hold: a pending delay, and how the pointer and focus stand. */
interface State {
	timer?: ReturnType<typeof setTimeout>;
	hovered: boolean;
	focused: boolean;
	/** Set by pressing the trigger. The pointer has to leave before it can open the tooltip again. */
	pressed: boolean;
	/** The trigger the tooltip shows for, which it is anchored to. */
	trigger: HTMLElement | null;
}
const states = new WeakMap<HTMLElement, State>();
const stateOf = (tooltip: HTMLElement): State => {
	let state = states.get(tooltip);
	if (!state) states.set(tooltip, (state = { hovered: false, focused: false, pressed: false, trigger: null }));
	return state;
};

interface Pair {
	trigger: HTMLElement;
	tooltip: HTMLElement;
}

function listen(doc: Document): AbortController {
	const listening = new AbortController();
	const { signal } = listening;
	const options = { signal, capture: true };
	const live = () => !signal.aborted;

	const update = (tooltip: HTMLElement) => {
		const state = stateOf(tooltip);
		clearTimeout(state.timer);
		if (state.focused) show(tooltip);
		else if (state.hovered && !state.pressed)
			state.timer = setTimeout(() => live() && show(tooltip), isOpen(tooltip) ? 0 : delay(tooltip, 'start'));
		else if (isOpen(tooltip)) state.timer = setTimeout(() => live() && hide(tooltip), delay(tooltip, 'end'));
	};

	const show = (tooltip: HTMLElement) => {
		const state = stateOf(tooltip);
		clearTimeout(state.timer);
		const trigger = state.trigger;
		if (!trigger?.isConnected || !tooltip.isConnected) return;
		for (const other of openTooltips(doc)) if (other !== tooltip) hide(other);
		if (isOpen(tooltip)) return;
		(tooltip as unknown as SourcedPopover).showPopover({ source: trigger });
	};

	const hide = (tooltip: HTMLElement) => {
		clearTimeout(stateOf(tooltip).timer);
		if (isOpen(tooltip)) tooltip.hidePopover();
	};

	/** The tooltip an element is part of, or the trigger and tooltip an element stands for. */
	const pairOf = (target: EventTarget | null): Pair | null => {
		const tooltip = target instanceof Element ? target.closest<HTMLElement>(TOOLTIP) : null;
		if (tooltip) {
			const { trigger } = stateOf(tooltip);
			return trigger ? { trigger, tooltip } : null;
		}
		return triggerOf(target);
	};

	doc.addEventListener(
		'pointerover',
		(event) => {
			if (event.pointerType === 'touch') return;
			const pair = pairOf(event.target);
			if (!pair) return;
			const state = stateOf(pair.tooltip);
			if (!(event.target as Element).closest(TOOLTIP)) state.trigger = pair.trigger;
			state.hovered = true;
			update(pair.tooltip);
		},
		options,
	);

	doc.addEventListener(
		'pointerout',
		(event) => {
			if (event.pointerType === 'touch') return;
			const pair = pairOf(event.target);
			// Moving within the trigger, or between it and its tooltip, is not leaving.
			if (!pair || pairOf(event.relatedTarget)?.tooltip === pair.tooltip) return;
			const state = stateOf(pair.tooltip);
			state.hovered = state.pressed = false;
			update(pair.tooltip);
		},
		options,
	);

	doc.addEventListener(
		'focusin',
		(event) => {
			const pair = triggerOf(event.target);
			if (!pair) return;
			const state = stateOf(pair.tooltip);
			state.trigger = pair.trigger;
			state.focused = matches(event.target as Element, ':focus-visible');
			update(pair.tooltip);
		},
		options,
	);

	doc.addEventListener(
		'focusout',
		(event) => {
			const pair = triggerOf(event.target);
			if (!pair || triggerOf(event.relatedTarget)?.trigger === pair.trigger) return;
			stateOf(pair.tooltip).focused = false;
			hide(pair.tooltip);
		},
		options,
	);

	doc.addEventListener(
		'pointerdown',
		(event) => {
			const pair = triggerOf(event.target);
			if (!pair) return;
			const state = stateOf(pair.tooltip);
			state.pressed = true;
			state.focused = false;
			hide(pair.tooltip);
		},
		options,
	);

	// The browser closes a hint popover on its own, such as on a click elsewhere or on Escape.
	doc.addEventListener(
		'toggle',
		(event) => {
			const tooltip = event.target;
			if ((event as ToggleEvent).newState !== 'closed' || !(tooltip instanceof HTMLElement) || !tooltip.matches(TOOLTIP)) return;
			const state = stateOf(tooltip);
			clearTimeout(state.timer);
			state.hovered = state.focused = false;
		},
		options,
	);

	// Where `hint` is supported, the browser closes the tooltip on Escape, one layer per press, and
	// the key still reaches the page. A popover the browser treats as `manual` gets neither.
	doc.addEventListener(
		'keydown',
		(event) => {
			if (event.key !== 'Escape') return;
			const tooltip = openTooltips(doc).find((open) => open.popover !== 'hint');
			if (!tooltip) return;
			// One Escape closes one layer, so a dialog around the tooltip stays open.
			event.preventDefault();
			const state = stateOf(tooltip);
			state.hovered = state.focused = false;
			hide(tooltip);
		},
		options,
	);

	return listening;
}

/**
 * The trigger an element stands for, and its tooltip: the nearest element, starting with this one,
 * whose `aria-describedby` or `aria-labelledby` names an `[interop-tooltip]`. A `<label>` stands for
 * its control. A trigger with `interestfor` is left to the browser where it supports it.
 */
function triggerOf(target: EventTarget | null): Pair | null {
	for (let element = target instanceof Element ? target : null; element; element = element.parentElement) {
		if (element.matches(TOOLTIP)) return null;
		const candidate = element instanceof HTMLLabelElement && element.control ? element.control : element;
		const tooltip = tooltipOf(candidate);
		if (!tooltip) continue;
		if (candidate.hasAttribute('interestfor') && interestInvokers()) return null;
		return { trigger: candidate as HTMLElement, tooltip };
	}
	return null;
}

function tooltipOf(element: Element): HTMLElement | null {
	for (const relation of RELATIONS) {
		for (const id of (element.getAttribute(relation) ?? '').split(/\s+/)) {
			const target = id ? element.ownerDocument.getElementById(id) : null;
			if (target?.matches(TOOLTIP)) return target;
		}
	}
	return null;
}

function openTooltips(doc: Document): HTMLElement[] {
	return Array.from(doc.querySelectorAll<HTMLElement>(TOOLTIP)).filter(isOpen);
}

/** Open, read from the element: a tooltip removed while open is closed by the browser, without a toggle event. */
function isOpen(tooltip: HTMLElement): boolean {
	return matches(tooltip, ':popover-open');
}

/** Whether an element matches a selector this browser may not support, such as :popover-open in jsdom. */
function matches(element: Element, selector: string): boolean {
	try {
		return element.matches(selector);
	} catch {
		return false;
	}
}

function delay(tooltip: HTMLElement, edge: 'start' | 'end'): number {
	const value = getComputedStyle(tooltip).getPropertyValue(`--itx-tooltip-interest-delay-${edge}`).trim();
	const amount = parseFloat(value);
	if (Number.isNaN(amount)) return 0;
	return value.endsWith('ms') ? amount : amount * 1000;
}

/** Interest invokers (`interestfor`), Chrome and Edge 142+. */
function interestInvokers(): boolean {
	return typeof HTMLButtonElement !== 'undefined' && 'interestForElement' in HTMLButtonElement.prototype;
}

/** TypeScript's DOM types do not include the `source` option yet. */
interface SourcedPopover {
	showPopover(options: { source: HTMLElement }): void;
}
