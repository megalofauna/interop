/**
 * Binds a helper to every element in an inserted example that matches `selector`, and returns one
 * function that removes them all: `[bind]="each('[interop-tabs]', bindTabs)"`.
 */
export const each =
	<T extends HTMLElement>(selector: string, bind: (element: T) => () => void) =>
	(root: HTMLElement): (() => void) => {
		const unbinds = Array.from(root.querySelectorAll<T>(selector)).map(
			(element) => bind(element),
		);
		return () => unbinds.forEach((unbind) => unbind());
	};
