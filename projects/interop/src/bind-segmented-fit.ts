/**
 * Stacks a segmented radio group when its row does not fit, and puts it back when it does.
 *
 *   <fieldset interop-radio-group="segmented">…</fieldset>
 *   bindSegmentedFit(fieldset);
 *
 * - It measures the row, not a guess: a long or translated label stacks the control exactly when the
 *   row would run past its container (WCAG 1.4.10).
 * - Stacked, the group gets `data-stacked`, which sets --itx-segmented-orientation: vertical; the
 *   stylesheet does the rest. It checks again when the container's width or a label changes.
 * - It is optional. Without it, `itx-orientation="vertical"` stacks the control always, and a page
 *   can set --itx-segmented-orientation itself at a width of its choosing.
 *
 * Returns a function that removes the behavior and `data-stacked`.
 */
export function bindSegmentedFit(group: HTMLElement): () => void {
	// The nearest ancestor with a box of its own: an inline element, such as a custom element's host, has no width to fill.
	let container = group.parentElement;
	while (container && /^(inline|contents)$/.test(getComputedStyle(container).display)) container = container.parentElement;
	if (!container) return () => {};
	let frame = 0;

	/** The width the group may take: its container's content box. */
	const available = () => {
		const style = getComputedStyle(container!);
		return container!.clientWidth - (parseFloat(style.paddingInlineStart) || 0) - (parseFloat(style.paddingInlineEnd) || 0);
	};

	const check = () => {
		// Measure the row itself: horizontal, then stack it only if it runs past the space.
		group.removeAttribute('data-stacked');
		if (group.getBoundingClientRect().width > available() + 0.5) group.setAttribute('data-stacked', '');
	};
	// Reading sizes inside an observer callback can resize the page again in the same frame, so the check waits for the next one.
	const later = () => {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(check);
	};

	const resizes = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(later);
	resizes?.observe(container);
	const mutations = new MutationObserver(later);
	mutations.observe(group, { subtree: true, childList: true, characterData: true });
	check();

	return () => {
		cancelAnimationFrame(frame);
		resizes?.disconnect();
		mutations.disconnect();
		group.removeAttribute('data-stacked');
	};
}
