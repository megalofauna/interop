/** A link in the list to a section of this page: the same document, with a fragment. */
function sectionLinks(list: HTMLElement): HTMLAnchorElement[] {
	const here = list.ownerDocument.location;
	return Array.from(list.querySelectorAll<HTMLAnchorElement>('a[href*="#"]')).filter(
		(link) => link.hash.length > 1 && link.origin === here.origin && link.pathname === here.pathname && link.search === here.search,
	);
}

/** The nearest ancestor of `link`, up to and including `list`, that scrolls and overflows. */
function scrollerWithin(link: HTMLElement, list: HTMLElement): HTMLElement | null {
	for (let node = link.parentElement; node; node = node.parentElement) {
		const { overflowX, overflowY } = getComputedStyle(node);
		if (
			(/auto|scroll/.test(overflowX) && node.scrollWidth > node.clientWidth + 1) ||
			(/auto|scroll/.test(overflowY) && node.scrollHeight > node.clientHeight + 1)
		)
			return node;
		if (node === list) return null;
	}
	return null;
}

/** Scrolls the scroller by the least amount that shows all of `link`, inside its scroll padding. */
function reveal(link: HTMLElement, scroller: HTMLElement): void {
	const box = link.getBoundingClientRect();
	const port = scroller.getBoundingClientRect();
	const style = getComputedStyle(scroller);
	// scroll-padding is `auto` by default, which parses to NaN.
	const pad = (value: string) => parseFloat(value) || 0;
	const top = port.top + pad(style.scrollPaddingTop);
	const bottom = port.bottom - pad(style.scrollPaddingBottom);
	const left = port.left + pad(style.scrollPaddingLeft);
	const right = port.right - pad(style.scrollPaddingRight);
	const x = box.left < left ? box.left - left : box.right > right ? box.right - right : 0;
	const y = box.top < top ? box.top - top : box.bottom > bottom ? box.bottom - bottom : 0;
	// No `behavior`: the scroller's own `scroll-behavior` decides, so reduced motion reaches it.
	if (x || y) scroller.scrollBy({ left: x, top: y });
}

/**
 * Follows the link to the section in view, in a list of links to sections of this page. The
 * browser decides which section that is, with `scroll-target-group` on the list and
 * `:target-current` on the link; this fills what it leaves:
 *
 * - The current link gets `aria-current="true"`, which the browser does not expose for
 *   `:target-current` yet. A link that already has `aria-current` keeps it.
 * - Without `:target-current` (Firefox and Safari), the current link is the last one whose section
 *   starts in the top half of the window, the last one once the page is scrolled to its end, or the
 *   first. It is marked with `aria-current="true"`, which the CSS styles the same.
 * - When the list scrolls, as a bar of links that overflows, the current link is scrolled into
 *   view within it. The page itself does not move.
 *
 * The page nav and the tree set `scroll-target-group` in their CSS. Links to other pages are left
 * alone. Returns a function that removes the behavior and the `aria-current` it set.
 */
export function bindTargetCurrent(list: HTMLElement): () => void {
	const doc = list.ownerDocument;
	const view = doc.defaultView!;
	const native =
		typeof CSS !== 'undefined' &&
		CSS.supports('selector(:target-current)') &&
		getComputedStyle(list).getPropertyValue('scroll-target-group') === 'auto';

	const fallback = (): HTMLAnchorElement | null => {
		const links = sectionLinks(list);
		const root = doc.scrollingElement ?? doc.documentElement;
		const scrolls = root.scrollHeight > view.innerHeight;
		if (links.length && scrolls && root.scrollTop + view.innerHeight >= root.scrollHeight - 1) return links[links.length - 1];
		let current: HTMLAnchorElement | null = links[0] ?? null;
		for (const link of links) {
			const target = doc.getElementById(decodeURIComponent(link.hash.slice(1)));
			if (target && target.getBoundingClientRect().top <= view.innerHeight / 2) current = link;
		}
		return current;
	};

	let current: HTMLAnchorElement | null = null;
	/** The link this helper gave `aria-current`, so only that one is cleared. */
	let marked: HTMLAnchorElement | null = null;
	let frame = 0;

	const update = () => {
		frame = 0;
		const link = native ? list.querySelector<HTMLAnchorElement>('a:target-current') : fallback();
		if (link === current) return;
		current = link;
		marked?.removeAttribute('aria-current');
		marked = null;
		if (!link) return;
		if (!link.hasAttribute('aria-current')) {
			link.setAttribute('aria-current', 'true');
			marked = link;
		}
		const scroller = scrollerWithin(link, list);
		if (scroller) reveal(link, scroller);
	};
	// The browser updates :target-current in the frame after a scroll, so read it one frame later.
	const schedule = () => {
		if (!frame) frame = view.requestAnimationFrame(() => (frame = view.requestAnimationFrame(update)));
	};

	const listening = new AbortController();
	const { signal } = listening;
	// Capturing, so a scroll anywhere, the page or a scroller in it, is heard.
	doc.addEventListener('scroll', schedule, { capture: true, passive: true, signal });
	doc.addEventListener('scrollend', schedule, { capture: true, signal });
	view.addEventListener('resize', schedule, { signal });
	view.addEventListener('hashchange', schedule, { signal });
	const observer = new MutationObserver(schedule);
	observer.observe(list, { childList: true, subtree: true });
	schedule();

	return () => {
		listening.abort();
		observer.disconnect();
		view.cancelAnimationFrame(frame);
		marked?.removeAttribute('aria-current');
	};
}
