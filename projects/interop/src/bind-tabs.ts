import { watchInteropInDevMode } from './audit';

let ids = 0;

export interface TabsOptions {
	/** `automatic` selects a tab as the arrow keys reach it. `manual` moves focus only; Enter or Space selects. */
	activation?: 'automatic' | 'manual';
	/** Select the tab whose panel matches the URL fragment, on bind and on `hashchange`. Never writes the URL. */
	hash?: boolean;
}

export interface TabsChangeDetail {
	tab: HTMLElement;
	panel: HTMLElement | null;
}

const FOCUSABLE =
	'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"]), [contenteditable]';

/**
 * Adds tab behavior to markup the consumer writes: a `[role=tablist]` of `[role=tab]` buttons in
 * `root`, each pointing at its `[role=tabpanel]` with `aria-controls`.
 *
 * - Exactly one tab is selected: the one marked `aria-selected="true"`, or the first enabled tab.
 *   It holds the tab list's only tab stop. Every other panel is `hidden="until-found"`, so
 *   find-in-page can still reach it, and a match there selects its tab.
 * - The arrow keys move between tabs, following `aria-orientation` and the writing direction, and
 *   wrap. Home and End go to the first and last. Disabled tabs are skipped, and keys held with a
 *   modifier are left alone.
 * - With automatic activation, the arrow keys select. With manual activation they move focus, and
 *   the button's own click on Enter or Space selects. Leaving the tab list returns its tab stop to
 *   the selected tab.
 * - A tab without an `id` gets one, and its panel gets `aria-labelledby` if it has none. The shown
 *   panel gets `tabindex="0"` when nothing in it is focusable, so the keyboard can reach its
 *   content. Hidden panels never do.
 * - Selecting a different tab fires `interop-tabs-change` on the tab list, with the tab and the
 *   panel as its detail. If the selected tab is removed, a neighbor is selected.
 *
 * Returns a function that removes the behavior.
 */
export function bindTabs(root: HTMLElement, options: TabsOptions = {}): () => void {
	const { activation = 'automatic', hash = false } = options;
	const document = root.ownerDocument;
	/** Panels given a tabindex here, as opposed to by the consumer. */
	const reachable = new Set<HTMLElement>();
	/** The selected tab as of the last change, which may since have been removed. */
	let current: HTMLElement | null = null;
	let lastIndex = 0;

	const tablist = () => root.querySelector<HTMLElement>('[role="tablist"]');
	const tabs = () => {
		const list = tablist();
		if (!list) return [];
		return Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]')).filter((tab) => tab.closest('[role="tablist"]') === list);
	};
	const enabled = () => tabs().filter((tab) => !(tab as HTMLButtonElement).disabled);
	const panelOf = (tab: HTMLElement) => {
		const id = tab.getAttribute('aria-controls');
		return id ? document.getElementById(id) : null;
	};
	const selected = () => tabs().find((tab) => tab.getAttribute('aria-selected') === 'true');

	/**
	 * Only the shown panel can be a tab stop. A hidden="until-found" panel keeps its box, so it stays
	 * focusable, and a tabindex on it would be a stop with nothing visible.
	 */
	const setReachable = (panel: HTMLElement, shown: boolean) => {
		if (panel.hasAttribute('tabindex') && !reachable.has(panel)) return;
		if (shown && !panel.querySelector(FOCUSABLE)) {
			panel.tabIndex = 0;
			reachable.add(panel);
		} else {
			panel.removeAttribute('tabindex');
			reachable.delete(panel);
		}
	};

	const select = (target: HTMLElement, focus: boolean, announce = true) => {
		const previous = current;
		const all = tabs();
		// State first, focus second, so the tab is announced as selected when it takes focus.
		for (const tab of all) {
			const isTarget = tab === target;
			tab.setAttribute('aria-selected', String(isTarget));
			tab.tabIndex = isTarget ? 0 : -1;
			const panel = panelOf(tab);
			if (!panel) continue;
			if (isTarget) panel.removeAttribute('hidden');
			else panel.setAttribute('hidden', 'until-found');
			setReachable(panel, isTarget);
		}
		lastIndex = all.indexOf(target);
		current = target;
		if (focus) target.focus();
		if (announce && previous && previous !== target) {
			const detail: TabsChangeDetail = { tab: target, panel: panelOf(target) };
			tablist()?.dispatchEvent(new CustomEvent('interop-tabs-change', { bubbles: true, detail }));
		}
	};

	const fromHash = () => {
		const id = decodeURIComponent(document.defaultView?.location.hash.slice(1) ?? '');
		return id ? enabled().find((tab) => tab.getAttribute('aria-controls') === id) : undefined;
	};

	/** Wires every tab and panel, and keeps exactly one tab selected. */
	const reconcile = () => {
		for (const tab of tabs()) {
			tab.id ||= `itx-tab-${++ids}`;
			const panel = panelOf(tab);
			if (panel && !panel.hasAttribute('aria-labelledby')) panel.setAttribute('aria-labelledby', tab.id);
		}
		const candidates = enabled();
		const marked = selected();
		const target = marked && !(marked as HTMLButtonElement).disabled ? marked : candidates[Math.min(lastIndex, candidates.length - 1)];
		if (target) select(target, false);
	};

	const isRtl = (list: HTMLElement) => {
		try {
			return list.matches(':dir(rtl)');
		} catch {
			return list.closest('[dir]')?.getAttribute('dir') === 'rtl';
		}
	};

	const onKeydown = (event: KeyboardEvent) => {
		const list = tablist();
		const current = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('[role="tab"]') : null;
		if (!list || !current || current.closest('[role="tablist"]') !== list) return;
		if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
		const candidates = enabled();
		const index = candidates.indexOf(current);
		if (index < 0) return;
		const vertical = list.getAttribute('aria-orientation') === 'vertical';
		const rtl = !vertical && isRtl(list);
		const forward = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
		const back = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
		const count = candidates.length;
		const next =
			event.key === forward ? (index + 1) % count
			: event.key === back ? (index - 1 + count) % count
			: event.key === 'Home' ? 0
			: event.key === 'End' ? count - 1
			: -1;
		if (next < 0) return;
		event.preventDefault();
		const target = candidates[next];
		if (activation === 'automatic') {
			select(target, true);
			return;
		}
		for (const tab of tabs()) tab.tabIndex = tab === target ? 0 : -1;
		target.focus();
	};

	const onClick = (event: MouseEvent) => {
		const tab = event.target instanceof Element ? event.target.closest<HTMLElement>('[role="tab"]') : null;
		if (!tab || !tabs().includes(tab) || (tab as HTMLButtonElement).disabled) return;
		select(tab, false);
	};

	// Manual activation moves the tab stop with focus. Leaving the list gives it back to the selected tab.
	const onFocusout = (event: FocusEvent) => {
		const list = tablist();
		if (!list || list.contains(event.relatedTarget as Node | null)) return;
		const marked = selected();
		for (const tab of tabs()) tab.tabIndex = tab === marked ? 0 : -1;
	};

	// Find-in-page fires beforematch on a hidden="until-found" panel before revealing it.
	const onBeforematch = (event: Event) => {
		const tab = tabs().find((candidate) => panelOf(candidate) === event.target);
		if (tab) select(tab, false);
	};

	const onHashchange = () => {
		const tab = fromHash();
		if (tab) select(tab, false);
	};

	const observer = new MutationObserver(reconcile);
	observer.observe(root, { childList: true, subtree: true });
	root.addEventListener('keydown', onKeydown);
	root.addEventListener('click', onClick);
	root.addEventListener('focusout', onFocusout);
	root.addEventListener('beforematch', onBeforematch);
	if (hash) document.defaultView?.addEventListener('hashchange', onHashchange);

	reconcile();
	const initial = hash ? fromHash() : undefined;
	if (initial) select(initial, false, false);
	observer.takeRecords();
	watchInteropInDevMode();

	return () => {
		observer.disconnect();
		root.removeEventListener('keydown', onKeydown);
		root.removeEventListener('click', onClick);
		root.removeEventListener('focusout', onFocusout);
		root.removeEventListener('beforematch', onBeforematch);
		if (hash) document.defaultView?.removeEventListener('hashchange', onHashchange);
	};
}
