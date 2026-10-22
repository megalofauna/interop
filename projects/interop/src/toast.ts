import { announce } from './announce';
import { focusables, isFocusable } from './focusable';
import { getIcon } from './icon-registry';

export type ToastColor = 'success' | 'info' | 'warning' | 'danger';

export interface ToastOptions {
	/** The status, shown by an icon and the edge color, and set as `itx-color`. Without it the toast is neutral. */
	color?: ToastColor;
	/** A second line, under the message. */
	description?: string;
	/**
	 * One button, e.g. Undo. Pressing it runs `run`, then dismisses the toast. A toast with an action
	 * never times out. Offer the same action somewhere in the page too: a toast is easy to miss.
	 */
	action?: { label: string; run: () => void };
	/**
	 * Milliseconds before the toast leaves by itself, at least 5000. Without it, the toast stays until
	 * it is dismissed. Ignored for a toast with an action and for `danger`.
	 */
	timeout?: number;
	/** The region to show it in. Default: the `[interop-toasts]` region in the open modal dialog, else the page's. */
	region?: HTMLElement;
	/** The dismiss button's name, so translations can replace it. Default: "Dismiss". */
	dismissLabel?: string;
	/** A visually hidden `role="status"` element, for browsers without `ariaNotify()`. See `announce()`. */
	status?: HTMLElement | null;
}

const REGION = '[interop-toasts]';
const TOAST = '[interop-toast]';
const MIN_TIMEOUT = 5000;

const ICONS: Record<ToastColor, string> = {
	success: 'tabler-circle-check',
	info: 'tabler-info-circle',
	warning: 'tabler-alert-triangle',
	danger: 'tabler-alert-circle',
};

let regions = 0;

/**
 * Shows a toast: a short message about something the user just did, which moves no focus.
 *
 *   toast('Message sent');
 *   toast('Crate jettisoned', { color: 'success', action: { label: 'Undo', run: restore } });
 *
 * The toast goes into the `[interop-toasts]` region, which bindToasts() looks after. The message is
 * announced with `announce()`, at high priority for `danger`. Returns the toast element; remove it
 * to dismiss the toast.
 *
 * A toast under an open modal dialog cannot be reached, so a dialog that raises toasts holds its own
 * region, and the toast goes there.
 */
export function toast(message: string, options: ToastOptions = {}): HTMLElement {
	const region = options.region ?? findRegion();
	if (!region) throw new Error('toast(): no [interop-toasts] region in the page.');
	region.id ||= `interop-toasts-${++regions}`;

	const item = element('div', { 'interop-toast': '' });
	if (options.color) {
		item.setAttribute('itx-color', options.color);
		const icon = drawIcon(ICONS[options.color]);
		if (icon) item.append(icon);
	}
	if (options.timeout !== undefined) item.dataset['timeout'] = String(Math.max(MIN_TIMEOUT, options.timeout));

	const text = element('div', {});
	text.append(element('p', {}, message));
	if (options.description) text.append(element('p', {}, options.description));
	item.append(text);

	const dismiss = { type: 'button', command: '--dismiss', commandfor: region.id };
	if (options.action) {
		const { run } = options.action;
		const action = element('button', { ...dismiss, 'interop-button': '', 'itx-size': 'sm' }, options.action.label);
		action.addEventListener('click', () => run());
		item.append(action);
	}
	const close = element('button', {
		...dismiss,
		'interop-button': 'icon',
		'itx-size': 'sm',
		'aria-label': options.dismissLabel ?? 'Dismiss',
	});
	const x = drawIcon('tabler-x');
	close.append(x ?? '×');
	item.append(close);

	region.togglePopover(true);
	region.append(item);
	announce(options.description ? `${message}. ${options.description}` : message, {
		from: item,
		priority: options.color === 'danger' ? 'high' : 'normal',
		status: options.status,
	});
	return item;
}

/**
 * Looks after a `[interop-toasts]` region, a `popover="manual"` that toast() fills:
 *
 * - A button with `command="--dismiss"` removes its toast, and so does Escape inside one.
 * - A toast with `data-timeout` leaves after that long, unless it has an action or is `danger`.
 *   The time stops while the pointer is over the region, while focus is in it, and while the page is
 *   hidden.
 * - When a toast that held focus goes, focus moves to the toast now in its place, else the one
 *   before it, else back to where it was before it entered the region.
 * - The region shows while it has toasts and hides when the last one goes. A region inside a
 *   dialog empties when the dialog closes.
 *
 * Removing a toast element by any means does the same. Returns a function that removes the behavior.
 */
export function bindToasts(region: HTMLElement): () => void {
	const timers = new Map<Element, { left: number; started: number; id: number | undefined }>();
	/** Where focus was before it entered the region. */
	let returnTo: HTMLElement | null = null;
	let focusedToast: Element | null = null;
	let focusedIndex = -1;

	const toasts = () => Array.from(region.children).filter((child) => child.matches(TOAST));
	const paused = () => document.hidden || region.matches(':hover') || region.contains(document.activeElement);

	const sync = () => {
		const stop = paused();
		for (const [item, timer] of timers) {
			if (stop && timer.id !== undefined) {
				clearTimeout(timer.id);
				timer.left -= Date.now() - timer.started;
				timer.id = undefined;
			} else if (!stop && timer.id === undefined) {
				timer.started = Date.now();
				timer.id = window.setTimeout(() => item.remove(), timer.left);
			}
		}
	};
	// Focus and pointer events fire before focus and :hover settle on their new target.
	const syncSoon = () => setTimeout(sync);

	const start = (item: Element) => {
		const timeout = Number((item as HTMLElement).dataset['timeout']);
		if (!timeout || item.matches('[itx-color="danger"]') || item.querySelectorAll('button').length > 1) return;
		timers.set(item, { left: timeout, started: 0, id: undefined });
	};

	const onFocusin = (event: FocusEvent) => {
		const from = event.relatedTarget;
		if (from instanceof HTMLElement && !region.contains(from)) returnTo = from;
		const item = (event.target as Element).closest(TOAST);
		focusedToast = item?.parentElement === region ? item : null;
		focusedIndex = focusedToast ? toasts().indexOf(focusedToast) : -1;
		syncSoon();
	};

	const onFocusout = (event: FocusEvent) => {
		// Focus left for somewhere real; a removal moves it to nowhere and fires no focusout.
		if (event.relatedTarget) focusedToast = null;
		if (event.relatedTarget && !region.contains(event.relatedTarget as Node)) returnTo = null;
		syncSoon();
	};

	const onCommand = (event: Event) => {
		const { command, source } = event as Event & { command: string; source: Element | null };
		if (command !== '--dismiss') return;
		const item = source?.closest(TOAST);
		if (item?.parentElement === region) item.remove();
	};

	const onKeydown = (event: KeyboardEvent) => {
		if (event.key !== 'Escape') return;
		const item = (event.target as Element).closest(TOAST);
		if (item?.parentElement !== region) return;
		// One Escape closes one layer: not the dialog the region is in as well.
		event.preventDefault();
		event.stopPropagation();
		item.remove();
	};

	const observer = new MutationObserver((records) => {
		for (const node of records.flatMap((record) => Array.from(record.addedNodes)))
			if (node instanceof Element && node.matches(TOAST)) start(node);
		const gone = records.flatMap((record) => Array.from(record.removedNodes)).filter((node): node is Element => node instanceof Element);
		for (const item of gone) {
			clearTimeout(timers.get(item)?.id);
			timers.delete(item);
		}

		const remaining = toasts();
		if (focusedToast && gone.includes(focusedToast)) {
			const next = remaining[Math.min(focusedIndex, remaining.length - 1)];
			const target = (next && focusables(next)[0]) ?? (returnTo?.isConnected && isFocusable(returnTo) ? returnTo : null);
			focusedToast = null;
			target?.focus();
		}
		if (!remaining.length) region.togglePopover(false);
		sync();
	});

	const listening = new AbortController();
	const { signal } = listening;
	region.addEventListener('command', onCommand, { signal });
	region.addEventListener('keydown', onKeydown, { signal });
	region.addEventListener('focusin', onFocusin, { signal });
	region.addEventListener('focusout', onFocusout, { signal });
	region.addEventListener('pointerenter', syncSoon, { signal });
	region.addEventListener('pointerleave', syncSoon, { signal });
	document.addEventListener('visibilitychange', sync, { signal });
	// A dialog's toasts are about its work, and would show again the next time it opens.
	region.closest('dialog')?.addEventListener('close', () => region.replaceChildren(), { signal });
	observer.observe(region, { childList: true });
	for (const item of toasts()) start(item);
	sync();

	return () => {
		observer.disconnect();
		listening.abort();
		for (const timer of timers.values()) clearTimeout(timer.id);
		timers.clear();
	};
}

/** The region in the open modal dialog that holds focus, else the page's own. */
function findRegion(): HTMLElement | null {
	const modal = document.activeElement?.closest('dialog');
	if (modal?.matches(':modal')) return modal.querySelector<HTMLElement>(REGION);
	return document.querySelector<HTMLElement>(`${REGION}:not(dialog ${REGION})`);
}

function element<K extends keyof HTMLElementTagNameMap>(
	tag: K,
	attributes: Record<string, string>,
	text?: string,
): HTMLElementTagNameMap[K] {
	const node = document.createElement(tag);
	for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
	if (text !== undefined) node.textContent = text;
	return node;
}

/** A registered icon as `svg[interop-icon]`, hidden from assistive technology; null when it is not registered. */
function drawIcon(name: string): SVGSVGElement | null {
	const icon = getIcon(name);
	if (!icon) return null;
	const ns = 'http://www.w3.org/2000/svg';
	const svg = document.createElementNS(ns, 'svg');
	svg.setAttribute('interop-icon', '');
	svg.setAttribute('viewBox', icon.viewBox);
	svg.setAttribute('aria-hidden', 'true');
	const group = document.createElementNS(ns, 'g');
	group.setAttribute('fill', icon.fill);
	group.setAttribute('stroke', icon.stroke);
	group.setAttribute('stroke-linecap', 'round');
	group.setAttribute('stroke-linejoin', 'round');
	for (const path of icon.paths) {
		const shape = document.createElementNS(ns, 'path');
		shape.setAttribute('d', path.d);
		for (const name of ['fill', 'stroke', 'opacity'] as const) if (path[name]) shape.setAttribute(name, path[name]!);
		group.append(shape);
	}
	svg.append(group);
	return svg;
}
