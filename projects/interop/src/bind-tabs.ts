import { isRtl } from './direction';
import { hasFocusable } from './focusable';

let ids = 0;

export interface TabsOptions {
	/** `automatic` selects a tab as the arrow keys reach it. `manual` moves focus only; Enter or Space selects. */
	activation?: 'automatic' | 'manual';
	/** Select the tab whose panel matches the URL fragment, on first bind and on `hashchange`. Never writes the URL. */
	hash?: boolean;
}

export interface TabsChangeDetail {
	tab: HTMLElement;
	panel: HTMLElement | null;
}

/** A binding: call it to remove the behavior; `select` chooses a tab from code. */
export interface TabsBinding {
	(): void;
	select(tab: HTMLElement): void;
}

/** Marks a panel tabindex the helper set, as opposed to the consumer's. */
const REACHABLE = 'data-tabs-reachable';
/** Holds a consumer's tabindex while its panel is hidden, so a hidden panel is never a tab stop. */
const PARKED = 'data-tabs-tabindex';
/** Marks an `aria-labelledby` the helper wrote, so it follows its tab's `id`. */
const LABELLED = 'data-tabs-labelledby';
/** What makes a change to the DOM a change to the tabs, as opposed to a panel's content. */
const PARTS = '[role="tablist"], [role="tab"], [role="tabpanel"]';

/** The binding on each root, so a second call returns it rather than binding twice. */
const bindings = new WeakMap<Element, TabsBinding>();
/** Roots whose tabs have appeared once, and those whose markup then left more than one panel showing. */
const examined = new WeakSet<Element>();
const showedPanels = new WeakSet<Element>();
/** Roots whose URL fragment has been applied, so a rebind does not apply it again. */
const hashed = new WeakSet<Element>();

/** Whether `root`'s markup, when its tabs first appeared, left more than one panel without `hidden`. The dev audit reads it. */
export function tabsShowedPanels(root: Element): boolean {
	return showedPanels.has(root);
}

/**
 * Adds tab behavior to markup the consumer writes: a `[role=tablist]` of `[role=tab]` buttons in
 * `root`, each pointing at its `[role=tabpanel]` with `aria-controls`.
 *
 * - Exactly one tab is selected: on bind, the one marked `aria-selected="true"`, or the first
 *   available tab. After that the helper holds the selection. It holds the tab list's only tab stop.
 *   Every other panel is `hidden="until-found"`, so find-in-page can still reach it, and a match
 *   there selects its tab.
 * - The arrow keys move between tabs, following `aria-orientation` and the writing direction, and
 *   wrap. Home and End go to the first and last. Disabled and hidden tabs are skipped, and keys held
 *   with a modifier are left alone.
 * - With automatic activation, the arrow keys select. With manual activation they move focus, and
 *   the button's own click on Enter or Space selects. Leaving the tab list returns its tab stop to
 *   the selected tab.
 * - A tab without an `id` gets one, and its panel gets `aria-labelledby` if it has none. The shown
 *   panel gets `tabindex="0"` when nothing in it is focusable, so the keyboard can reach its
 *   content. Hidden panels never do.
 * - Selecting a different tab fires `interop-tabs-change` on the tab list, with the tab and the
 *   panel as its detail. If the selected tab is removed or becomes unavailable, a neighbor is
 *   selected.
 *
 * The helper owns `aria-selected` and `tabindex` on tabs, and `hidden` and `tabindex` on panels: it
 * writes them and never reads them back, except the markup's `aria-selected` on bind and on a tab
 * inserted already marked selected. Calling it again on a bound root returns the same binding.
 *
 * Returns a function that removes the behavior, with `select(tab)` to choose a tab from code.
 */
export function bindTabs(root: HTMLElement, options: TabsOptions = {}): TabsBinding {
	const existing = bindings.get(root);
	if (existing) return existing;
	const { activation = 'automatic', hash = false } = options;
	const document = root.ownerDocument;
	/**
	 * The helper's state, from which every output is written. `current` is the selected tab, which may
	 * since have been removed; `stop` is the tab holding the tab list's one tab stop, which under
	 * manual activation follows focus.
	 */
	let current: HTMLElement | null = null;
	let stop: HTMLElement | null = null;
	/** The selected tab's position among all tabs, kept for when it is removed. */
	let lastIndex = 0;
	/** The panels the last pass wrote, so one that leaves the mapping is hidden again. */
	let written = new Set<HTMLElement>();

	const tablist = () => root.querySelector<HTMLElement>(':scope > [role="tablist"]');
	const tabs = () => {
		const list = tablist();
		if (!list) return [];
		return Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]')).filter((tab) => tab.closest('[role="tablist"]') === list);
	};
	/** A tab can be chosen unless it is disabled or hidden. */
	const available = (tab: HTMLElement) => !(tab as HTMLButtonElement).disabled && !tab.hasAttribute('hidden');
	const enabled = () => tabs().filter(available);
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
	/** The tab the markup marked selected. Read only before the helper holds a selection. */
	const marked = () => tabs().find((tab) => tab.getAttribute('aria-selected') === 'true');
	/** The available tab nearest a position among all tabs: at or after it, else before it. */
	const nearest = (index: number) => {
		const all = tabs();
		for (let i = Math.max(index, 0); i < all.length; i++) if (available(all[i])) return all[i];
		for (let i = Math.min(index, all.length) - 1; i >= 0; i--) if (available(all[i])) return all[i];
		return undefined;
	};

	/**
	 * Only the shown panel can be a tab stop. A hidden="until-found" panel keeps its box, so it stays
	 * focusable, and a tabindex on it would be a stop with nothing visible.
	 */
	const setReachable = (panel: HTMLElement, shown: boolean) => {
		// A tabindex the helper writes is marked, so a later binding tells it from the consumer's. A
		// consumer's tabindex waits in PARKED while its panel is hidden and comes back when it shows.
		const own = panel.hasAttribute(REACHABLE);
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
		if (panel.hasAttribute('tabindex') && !own) return;
		if (!hasFocusable(panel)) {
			if (panel.getAttribute('tabindex') !== '0') panel.tabIndex = 0;
			if (!own) panel.setAttribute(REACHABLE, '');
		} else {
			panel.removeAttribute('tabindex');
			panel.removeAttribute(REACHABLE);
		}
	};

	/**
	 * Writes every output from the state, each attribute only when it differs. Each panel is decided
	 * once, shown if it is the selected tab's and hidden otherwise, so two tabs that share a panel
	 * cannot undo each other, and a panel no tab controls any more is hidden again.
	 */
	const apply = () => {
		const shown = current ? panelOf(current) : null;
		const mapped = new Set<HTMLElement>();
		for (const tab of tabs()) {
			const selected = String(tab === current);
			if (tab.getAttribute('aria-selected') !== selected) tab.setAttribute('aria-selected', selected);
			const index = tab === stop ? '0' : '-1';
			if (tab.getAttribute('tabindex') !== index) tab.setAttribute('tabindex', index);
			const panel = panelOf(tab);
			if (panel) mapped.add(panel);
		}
		for (const panel of new Set([...mapped, ...written])) {
			if (panel === shown) {
				panel.removeAttribute('hidden');
				setReachable(panel, true);
			} else {
				if (panel.getAttribute('hidden') !== 'until-found') panel.setAttribute('hidden', 'until-found');
				setReachable(panel, false);
			}
		}
		written = mapped;
	};

	/** Selects `target`. A structural change keeps the tab stop where manual navigation left it. */
	const select = (target: HTMLElement, focus: boolean, announce = true, keepStop = false) => {
		const previous = current;
		current = target;
		if (!keepStop || !stop || !tabs().includes(stop) || !available(stop)) stop = target;
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
	 * Wires every tab and panel, and keeps exactly one tab selected: an inserted tab marked selected,
	 * if it can be chosen; else the selection the helper holds, if it still can be; before the helper
	 * holds one, the tab the markup marked; else the available tab nearest the selection's position.
	 */
	const reconcile = (preferred?: HTMLElement) => {
		const all = tabs();
		if (all.length && !examined.has(root)) {
			// The first time the tabs appear, before the helper writes anything: what the markup chose.
			examined.add(root);
			if (all.filter((tab) => panelOf(tab)?.hasAttribute('hidden') === false).length > 1) showedPanels.add(root);
		}
		for (const tab of all) {
			tab.id ||= `itx-tab-${++ids}`;
			const panel = panelOf(tab);
			if (panel && (!panel.hasAttribute('aria-labelledby') || panel.hasAttribute(LABELLED))) {
				if (panel.getAttribute('aria-labelledby') !== tab.id) panel.setAttribute('aria-labelledby', tab.id);
				panel.setAttribute(LABELLED, '');
			}
		}
		const first = marked();
		const choice =
			preferred && available(preferred)
				? preferred
				: current && all.includes(current) && available(current)
					? current
					: !current && first && available(first)
						? first
						: undefined;
		const target = choice ?? nearest(current && all.includes(current) ? all.indexOf(current) : current ? lastIndex : 0);
		if (target) select(target, false, true, true);
		else {
			if (current && !all.includes(current)) current = null;
			apply();
		}
	};

	const onKeydown = (event: KeyboardEvent) => {
		const list = tablist();
		const focused = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('[role="tab"]') : null;
		if (!list || !focused || focused.closest('[role="tablist"]') !== list) return;
		if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
		const candidates = enabled();
		const index = candidates.indexOf(focused);
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
		if (!tab || !tabs().includes(tab) || !available(tab)) return;
		select(tab, false);
	};

	// Manual activation moves the tab stop with focus. Focus leaving the tab list gives it back to the
	// selected tab; focus moving inside a panel is none of the tab list's business.
	const onFocusout = (event: FocusEvent) => {
		const list = tablist();
		if (!list || !list.contains(event.target as Node) || list.contains(event.relatedTarget as Node | null)) return;
		if (stop === current) return;
		stop = current;
		apply();
	};

	// Find-in-page fires beforematch on a hidden="until-found" panel before revealing it.
	const onBeforematch = (event: Event) => {
		const tab = enabled().find((candidate) => panelOf(candidate) === event.target);
		if (tab) select(tab, false);
	};

	const onHashchange = () => {
		const tab = fromHash();
		if (tab) select(tab, false);
	};

	// The observer watches the helper's inputs, never its outputs:
	// - a tab, tab list or panel added or removed, a tab's `disabled`, `hidden`, `aria-controls` or
	//   `id`, or a panel's `id`, changed: the tabs reconcile at once;
	// - a change inside the shown panel's content: whether that panel needs to be a tab stop is
	//   rechecked, at most once a frame and only when the helper owns its tabindex, because the check
	//   reads layout. Changes inside hidden panels and inside a tab's own content do nothing.
	// The outputs, `aria-selected`, `tabindex` and a panel's `hidden`, are not watched: the helper
	// writes them from its state, and a write by anyone else is out of contract (the dev audit
	// reports it) rather than fought, which could never end.
	const view = document.defaultView;
	let frame = 0;
	const recheckShown = () => {
		if (frame || !view) return;
		frame = view.requestAnimationFrame(() => {
			frame = 0;
			const panel = current && panelOf(current);
			if (panel && !panel.hasAttribute('hidden') && (!panel.hasAttribute('tabindex') || panel.hasAttribute(REACHABLE))) {
				setReachable(panel, true);
			}
		});
	};
	const isPart = (node: Node) => node instanceof Element && (node.matches(PARTS) || node.querySelector(PARTS) !== null);
	const onMutation = (records: MutationRecord[]) => {
		const list = tablist();
		const all = tabs();
		const panels = new Set([...all.map(panelOf).filter((panel) => panel !== null), ...written]);
		const shown = current && panelOf(current);
		let structural = false;
		let recheck = false;
		for (const record of records) {
			const target = record.target as HTMLElement;
			if (record.type === 'childList') {
				if (target === list || Array.from(record.addedNodes).some(isPart) || Array.from(record.removedNodes).some(isPart))
					structural = true;
				else if (shown?.contains(target)) recheck = true;
			} else if (all.includes(target) || target === list) {
				structural = true;
			} else if (panels.has(target)) {
				// A panel's own `hidden` is the helper's output; only its `id` is an input.
				if (record.attributeName === 'id') structural = true;
			} else if (shown?.contains(target)) {
				recheck = true;
			}
		}
		if (structural) {
			// A tab of this list inserted already marked selected takes the selection: the markup that
			// added it chose it. A tab already in place carries what the helper wrote, so its attribute is
			// not read as a choice.
			const added = records
				.flatMap((record) => Array.from(record.addedNodes))
				.flatMap((node) => (node instanceof Element ? [node, ...Array.from(node.querySelectorAll('[role="tab"]'))] : []))
				.filter((element) => all.includes(element as HTMLElement) && element.getAttribute('aria-selected') === 'true')
				.at(-1) as HTMLElement | undefined;
			reconcile(added);
		} else if (recheck) recheckShown();
	};

	const observer = new MutationObserver(onMutation);
	observer.observe(root, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ['disabled', 'hidden', 'aria-controls', 'id'],
	});
	const listening = new AbortController();
	const { signal } = listening;
	root.addEventListener('keydown', onKeydown, { signal });
	root.addEventListener('click', onClick, { signal });
	root.addEventListener('focusout', onFocusout, { signal });
	root.addEventListener('beforematch', onBeforematch, { signal });
	if (hash) document.defaultView?.addEventListener('hashchange', onHashchange, { signal });

	reconcile();
	// The fragment chooses on a root's first bind only; a later bind keeps the selection it finds.
	if (hash && !hashed.has(root)) {
		hashed.add(root);
		const initial = fromHash();
		if (initial) select(initial, false, false);
	}
	observer.takeRecords();

	const unbind = () => {
		observer.disconnect();
		listening.abort();
		if (frame) view?.cancelAnimationFrame(frame);
		bindings.delete(root);
		// The helper's own panel tabindex goes; a consumer's tabindex parked on a hidden panel stays parked,
		// so no hidden panel becomes a tab stop, and a later binding gives it back when the panel shows.
		for (const panel of written) {
			if (panel.hasAttribute(REACHABLE)) {
				panel.removeAttribute('tabindex');
				panel.removeAttribute(REACHABLE);
			}
		}
	};
	const binding: TabsBinding = Object.assign(unbind, {
		select: (tab: HTMLElement) => {
			if (tabs().includes(tab) && available(tab)) select(tab, false);
		},
	});
	bindings.set(root, binding);
	return binding;
}
