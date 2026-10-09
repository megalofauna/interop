/**
 * Shared substrate for the InteropMotion directive family. Provides the small
 * state-machine primitive every motion directive needs: apply a state class to
 * an element, listen for animationend to clean up (one-shot) or stay applied
 * until released (hold). All property-specific concerns (which CSS animation
 * runs, which transform applies on hover, what the reduced-motion fallback is)
 * live in preset CSS — this utility never reads tokens or property names.
 */

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export interface MotionSurface {
	/** The element receiving state classes. The directive's host. */
	readonly target: HTMLElement;
	/** True when the user prefers reduced motion. Captured at construction. */
	readonly reducedMotion: boolean;
	/**
	 * One-shot: add the state class, wire a single animationend listener that
	 * removes it. No-op if the state class is already present (an in-flight
	 * animation continues uninterrupted).
	 */
	fire(): void;
	/**
	 * Continuous: add the state class and keep it. Returns a release function
	 * that removes the class. No animationend involvement.
	 */
	hold(): () => void;
	/**
	 * Remove any active listener and clear the state class. Call from
	 * DestroyRef.
	 */
	destroy(): void;
}

export function setupMotionSurface(
	host: HTMLElement,
	opts: { className: string },
): MotionSurface {
	const { className } = opts;
	let abort: AbortController | null = null;

	return {
		target: host,
		reducedMotion: window.matchMedia(REDUCED_MOTION_QUERY).matches,

		fire(): void {
			if (host.classList.contains(className)) return;

			abort?.abort();
			abort = new AbortController();
			host.classList.add(className);
			host.addEventListener(
				"animationend",
				() => {
					host.classList.remove(className);
					abort = null;
				},
				{ once: true, signal: abort.signal },
			);
		},

		hold(): () => void {
			host.classList.add(className);
			return () => host.classList.remove(className);
		},

		destroy(): void {
			abort?.abort();
			abort = null;
			host.classList.remove(className);
		},
	};
}
