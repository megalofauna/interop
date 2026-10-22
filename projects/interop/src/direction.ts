/** Whether `element` lays out right to left, from `:dir()` or, where that is unsupported, the nearest `dir` attribute. */
export function isRtl(element: Element): boolean {
	try {
		return element.matches(':dir(rtl)');
	} catch {
		return element.closest('[dir]')?.getAttribute('dir') === 'rtl';
	}
}
