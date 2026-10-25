import { getIcon } from './icon-registry';

const SVG = 'http://www.w3.org/2000/svg';

/**
 * Draws every registered icon in `root`, without a framework: the same result as the Angular
 * `InteropIcon` component.
 *
 *   <svg interop-icon name="tabler-check"></svg>
 *   <svg interop-icon name="tabler-check" size="16" aria-label="Done"></svg>
 *   drawIcons(document.body);
 *
 * - It replaces the icon's children with the registered paths and sets its `viewBox`.
 * - `size` in pixels fixes the icon at that size; otherwise `itx-size`, `--itx-icon-size` or the
 *   text around it decides, as for the component.
 * - An icon is hidden from assistive technology unless it has `aria-label` or `aria-labelledby`,
 *   which make it an image.
 * - An unregistered name is left as it is, with a warning.
 *
 * Call it again after adding icons to the page.
 */
export function drawIcons(root: ParentNode): void {
	const hosts = Array.from(root.querySelectorAll<SVGSVGElement>('svg[interop-icon][name]'));
	if (root instanceof SVGSVGElement && root.matches('svg[interop-icon][name]')) hosts.unshift(root);
	for (const host of hosts) {
		const name = host.getAttribute('name') ?? '';
		const icon = getIcon(name);
		if (!icon) {
			console.warn(`drawIcons: "${name}" is not registered. Pass it to registerIcons().`);
			continue;
		}
		const group = host.ownerDocument.createElementNS(SVG, 'g');
		group.setAttribute('fill', icon.fill);
		group.setAttribute('stroke', icon.stroke);
		group.setAttribute('stroke-linecap', 'round');
		group.setAttribute('stroke-linejoin', 'round');
		for (const shape of icon.paths) {
			const path = host.ownerDocument.createElementNS(SVG, 'path');
			path.setAttribute('d', shape.d);
			if (shape.fill) path.setAttribute('fill', shape.fill);
			if (shape.stroke) path.setAttribute('stroke', shape.stroke);
			if (shape.opacity) path.setAttribute('opacity', shape.opacity);
			group.append(path);
		}
		host.replaceChildren(group);
		host.setAttribute('viewBox', icon.viewBox);

		const labelled = host.hasAttribute('aria-label') || host.hasAttribute('aria-labelledby');
		if (labelled) {
			host.setAttribute('role', 'img');
			host.removeAttribute('aria-hidden');
		} else {
			host.removeAttribute('role');
			host.setAttribute('aria-hidden', 'true');
		}

		const size = Number(host.getAttribute('size'));
		if (host.hasAttribute('size') && !Number.isNaN(size)) {
			host.style.setProperty('--itx-icon-inline-size', `${size}px`);
			host.style.setProperty('--itx-icon-block-size', `${size}px`);
		}
	}
}
