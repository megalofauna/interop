import { isRtl } from './direction';
import { hasFocusable } from './focusable';

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

/** Marks a panel whose tabindex the helper set, as opposed to the consumer. */
const REACHABLE = 'data-tabs-reachable';
/** Holds a consumer's tabindex while its panel is hidden, so a hidden panel is never a tab stop. */
const PARKED = 'data-tabs-tabindex';
/** What makes a change to the DOM a change to the tabs, as opposed to a panel's content. */
const PARTS = '[role="tablist"], [role="tab"], [role="tabpanel"]';

/**
 * Whether the dev audit is running. Only then does the helper note, once per element, whether the
 * markup it first saw left more than one panel showing. Production pays nothing for it.
 */
let recording = false;
const examined = new WeakSet<Element>();
const showedPanels = new WeakSet<Element>();

/** Called by the dev audit as it starts, so tabs that bind afterwards note their markup for it. */
export function recordTabsForAudit(): void {
	recording = true;
}

/** Whether `root`'s markup, when its tabs first appeared, left more than one panel without `hidden`. */
export function tabsShowedPanels(root: Element): boolean {
	return showedPanels.has(root);
}

/** A binding: call it to remove the behavior; `select` chooses a tab from code. */
export interface TabsBinding {
	(): void;
	select(tab: HTMLElement): void;
}

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
export function bindTabs(root: HTMLElement, options: TabsOptions = {}): TabsBinding {
	const { activation = 'automatic', hash = false } = options;
	const document = root.ownerDocument;
	/**
	 * The helper's state. Every output attribute is derived from it: `aria-selected` and the tabs'
	 * `tabindex`, and each panel's `hidden` and `tabindex`. `current` is the selected tab, which may
	 * since have been removed; `stop` is the tab holding the tab list's one tab stop, which under
	 * manual activation follows focus.
	 */
	let current: HTMLElement | null = null;
	let stop: HTMLElement | null = null;
	let lastIndex = 0;

	const tablist = () => root.querySelector<HTMLElement>(':scope > [role="tablist"]');
	const tabs = () => {
		const list = tablist();
		if (!list) return [];
		return Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]')).filter((tab) => tab.closest('[role="tablist"]') === list);
	};
	const enabled = () => tabs().filter((tab) => !(tab as HTMLButtonElement).disabled);
	/** By id, in the document or shadow root that holds the tabs, so tabs work inside a shadow root too. */
	const byId = (id: string): HTMLElement | null => {
		const scope = root.getRootNode() as ParentNode & Partial<NonElementParentNode>;
		if (typeof scope.getElementById === 'function') return scope.getElementById(id) as HTMLElement | null;
		return Array.from(scope.querySelectorAll<HTMLElement>('[id]')).find((element) => element.id === id) ?? null;
	};
	const panelOf = (tab: HTMLElement) => {
		const id = tab.getAttribute('aria-controls');
		return id ? byId(id) : null;
	};
	/** The tab the markup marked selected. Read only before the helper has a selection of its own. */
	const marked = () => tabs().find((tab) => tab.getAttribute('aria-selected') === 'true');

	/**
	 * Only the shown panel can be a tab stop. A hidden="until-found" panel keeps its box, so it stays
	 * focusable, and a tabindex on it would be a stop with nothing visible.
	 */
	const setReachable = (panel: HTMLElement, shown: boolean) => {
		// A tabindex the helper writes is marked, so a later binding tells it from the consumer's. A
		// consumer's tabindex waits in PARKED while its panel is hidden, and comes back when it shows;
		// one written onto a hidden panel later is parked too, replacing the old value.
		const own = panel.hasAttribute(REACHABLE) && panel.getAttribute('tabindex') === '0';
		if (!shown) {
			if (panel.hasAttribute('tabindex') && !own) panel.setAttribute(PARKED, panel.getAttribute('tabindex')!);
			panel.removeAttribute('tabindex');
			panel.removeAttribute(REACHABLE);
			return;
		}
		const parked = panel.getAttribute(PARKED);
		if (parked !== null) {
			panel.setAttribute('tabindex', parked);
			panel.removeAttribute(PARKED);
			panel.removeAttribute(REACHABLE);
			return;
		}
		if (panel.hasAttribute('tabindex') && !own) {
			panel.removeAttribute(REACHABLE);
			return;
		}
		if (!hasFocusable(panel)) {
			if (panel.getAttribute('tabindex') !== '0') panel.tabIndex = 0;
			if (!panel.hasAttribute(REACHABLE)) panel.setAttribute(REACHABLE, '');
		} else {
			panel.removeAttribute('tabindex');
			panel.removeAttribute(REACHABLE);
		}
	};

	/** Writes every output from the state, each attribute only when it differs. */
	const apply = () => {
		for (const tab of tabs()) {
			const isCurrent = tab === current;
			if (tab.getAttribute('aria-selected') !== String(isCurrent)) tab.setAttribute('aria-selected', String(isCurrent));
			const index = tab === stop ? 0 : -1;
			if (tab.getAttribute('tabindex') !== String(index)) tab.tabIndex = index;
			const panel = panelOf(tab);
			if (!panel) continue;
			if (isCurrent) panel.removeAttribute('hidden');
			else if (panel.getAttribute('hidden') !== 'until-found') panel.setAttribute('hidden', 'until-found');
			setReachable(panel, isCurrent);
		}
	};

	const select = (target: HTMLElement, focus: boolean, announce = true) => {
		const previous = current;
		current = stop = target;
		// State first, focus second, so the tab is announced as selected when it takes focus.
		apply();
		lastIndex = tabs().indexOf(target);
		if (focus) target.focus();
		if (announce && previous && previous !== target) {
			const detail: TabsChangeDetail = { tab: target, panel: panelOf(target) };
			tablist()?.dispatchEvent(new CustomEvent('interop-tabs-change', { bubbles: true, detail }));
		}
	};

	const fromHash = () => {
		let id = '';
		try {
			id = decodeURIComponent(document.defaultView?.location.hash.slice(1) ?? '');
		} catch {
			// A malformed fragment, such as a lone %, names no panel.
			return undefined;
		}
		return id ? enabled().find((tab) => tab.getAttribute('aria-controls') === id) : undefined;
	};

	/**
	 * Wires every tab and panel, and keeps exactly one tab selected: `preferred` if given and enabled,
	 * else the one marked, else the one at the last selected position.
	 */
	const reconcile = (preferred?: HTMLElement) => {
		const all = tabs();
		if (recording && all.length && !examined.has(root)) {
			// The first time the tabs appear, before the helper writes anything: what the markup chose.
			examined.add(root);
			if (all.filter((tab) => panelOf(tab)?.hasAttribute('hidden') === false).length > 1) showedPanels.add(root);
		}
		for (const tab of all) {
			tab.id ||= `itx-tab-${++ids}`;
			const panel = panelOf(tab);
			if (panel && !panel.hasAttribute('aria-labelledby')) panel.setAttribute('aria-labelledby', tab.id);
		}
		const candidates = enabled();
		// An inserted tab marked selected; else the selection the helper holds; else, before it holds
		// one, the tab the markup marked; else the enabled tab nearest the last selected position.
		const choice = preferred ?? (current && all.includes(current) ? current : current ? undefined : marked());
		const target = choice && candidates.includes(choice) ? choice : candidates[Math.min(lastIndex, candidates.length - 1)];
		if (target) select(target, false);
		else apply();
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
			event.key === forward
				? (index + 1) % count
				: event.key === back
					? (index - 1 + count) % count
					: event.key === 'Home'
						? 0
						: event.key === 'End'
							? count - 1
							: -1;
		if (next < 0) return;
		event.preventDefault();
		const target = candidates[next];
		if (activation === 'automatic') {
			select(target, true);
			return;
		}
		stop = target;
		apply();
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
		stop = current;
		apply();
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

	// What the observer sees, and what each change does:
	// - a tab, tab list or panel added or removed, or a tab's `disabled`, `aria-controls` or `id`, or a
	//   panel's `id`, changed: the tabs reconcile at once;
	// - an output written by someone else, `aria-selected` or `tabindex` on a tab, `hidden` or
	//   `tabindex` on a panel: the state is written back;
	// - anything inside the shown panel's content: whether that panel needs to be a tab stop is
	//   rechecked, at most once a frame, because the check reads layout. Changes inside hidden panels
	//   and inside a tab's own content do nothing.
	const view = document.defaultView;
	let frame = 0;
	const recheckShown = () => {
		if (frame || !view) return;
		frame = view.requestAnimationFrame(() => {
			frame = 0;
			const panel = current && panelOf(current);
			if (panel && !panel.hasAttribute('hidden')) setReachable(panel, true);
		});
	};
	const isPart = (node: Node) => node instanceof Element && (node.matches(PARTS) || node.querySelector(PARTS) !== null);
	const onMutation = (records: MutationRecord[]) => {
		const list = tablist();
		const all = tabs();
		const panels = new Set(all.map(panelOf).filter((panel) => panel !== null));
		const shown = current && panelOf(current);
		let structural = false;
		let rewrite = false;
		let recheck = false;
		for (const record of records) {
			const target = record.target as Element;
			if (record.type === 'childList') {
				if (target === list || Array.from(record.addedNodes).some(isPart) || Array.from(record.removedNodes).some(isPart))
					structural = true;
				else if (shown?.contains(target)) recheck = true;
			} else if (all.includes(target as HTMLElement)) {
				if (record.attributeName === 'aria-selected' || record.attributeName === 'tabindex') rewrite = true;
				else structural = true;
			} else if (panels.has(target as HTMLElement)) {
				if (record.attributeName === 'id') structural = true;
				else rewrite = true;
			} else if (target === list) {
				structural = true;
			} else if (shown?.contains(target)) {
				recheck = true;
			}
		}
		if (structural) {
			// A tab inserted already marked selected takes the selection: the markup that added it chose it.
			// A tab already in place carries what the helper wrote, so its attribute is not read as a choice.
			const added = records
				.flatMap((record) => Array.from(record.addedNodes))
				.flatMap((node) => (node instanceof Element ? [node, ...Array.from(node.querySelectorAll('[role="tab"]'))] : []))
				.filter((element) => element.matches('[role="tab"][aria-selected="true"]'))
				.at(-1) as HTMLElement | undefined;
			reconcile(added);
		} else if (rewrite) apply();
		else if (recheck) recheckShown();
	};

	const observer = new MutationObserver(onMutation);
	observer.observe(root, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ['aria-selected', 'tabindex', 'hidden', 'disabled', 'aria-controls', 'id'],
	});
	const listening = new AbortController();
	const { signal } = listening;
	root.addEventListener('keydown', onKeydown, { signal });
	root.addEventListener('click', onClick, { signal });
	root.addEventListener('focusout', onFocusout, { signal });
	root.addEventListener('beforematch', onBeforematch, { signal });
	if (hash) document.defaultView?.addEventListener('hashchange', onHashchange, { signal });

	reconcile();
	const initial = hash ? fromHash() : undefined;
	if (initial) select(initial, false, false);
	observer.takeRecords();

	const unbind = () => {
		observer.disconnect();
		listening.abort();
		if (frame) view?.cancelAnimationFrame(frame);
		// A consumer's tabindex waiting on a hidden panel goes back where it was.
		for (const panel of tabs().map(panelOf)) {
			const parked = panel?.getAttribute(PARKED);
			if (panel && parked != null) {
				panel.setAttribute('tabindex', parked);
				panel.removeAttribute(PARKED);
			}
		}
	};
	return Object.assign(unbind, {
		select: (tab: HTMLElement) => {
			if (tabs().includes(tab) && !(tab as HTMLButtonElement).disabled) select(tab, false);
		},
	});
}
