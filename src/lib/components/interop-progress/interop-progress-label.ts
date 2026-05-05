import {
	Directive,
	ElementRef,
	afterNextRender,
	inject,
	isDevMode,
} from "@angular/core";
import { generateProgressId } from "./interop-progress";

let labelCounter = 0;

/**
 * InteropProgressLabel — Companion directive for labelling a progress bar.
 *
 * Apply to any visible text element adjacent to `<progress interop-progress>`.
 * Auto-wires `aria-labelledby` on the progress, pointing back to this element.
 * This is the correct labelling mechanism — `<progress>` is not a labelable
 * element, so native `<label for>` is unreliable across assistive technology.
 *
 * Note: `<label>` is a valid host here for visual semantics, but the accessible
 * name is always established via `aria-labelledby`, not the native `for`
 * attribute. A `<span>`, `<p>`, or `<div>` works equally well.
 *
 * @example Auto-wired (preferred — label and progress are siblings)
 * ```html
 * <span interop-progress-label>Uploading</span>
 * <progress interop-progress [value]="42" [max]="100"></progress>
 * ```
 *
 * @example Explicit target id (label and progress are not siblings)
 * ```html
 * <span interop-progress-label target="upload-bar">Uploading</span>
 * ...
 * <progress interop-progress id="upload-bar" [value]="42"></progress>
 * ```
 */
@Directive({
	selector: "[interop-progress-label]",
	standalone: true,
})
export class InteropProgressLabel {
	private readonly elementRef = inject(ElementRef<HTMLElement>);

	constructor() {
		afterNextRender(() => {
			const label = this.elementRef.nativeElement;

			// Ensure this element has an id so aria-labelledby can reference it.
			if (!label.id) {
				label.id = `itx-progress-label-${++labelCounter}`;
			}

			// Resolve the target progress element.
			const targetId = label.getAttribute("target");
			const progress: HTMLElement | null = targetId
				? document.getElementById(targetId)
				: findNextProgress(label);

			if (!progress) {
				if (isDevMode()) {
					console.warn(
						"[InteropProgressLabel] Could not find an adjacent " +
						"progress[interop-progress] element. Set [target] to the " +
						"id of the progress element if they are not siblings.",
					);
				}
				return;
			}

			if (isDevMode() && !progress.matches("progress[interop-progress]")) {
				console.warn(
					`[InteropProgressLabel] target "${targetId}" does not point to ` +
					"a progress[interop-progress] element.",
				);
			}

			// Ensure the progress has an id for the label reference.
			if (!progress.id) {
				progress.id = generateProgressId();
			}

			// Wire the accessible name via aria-labelledby, not htmlFor.
			// <progress> is not a labelable element; native label association is unreliable.
			progress.setAttribute("aria-labelledby", label.id);
		});
	}
}

function findNextProgress(el: HTMLElement): HTMLElement | null {
	let sibling = el.nextElementSibling as HTMLElement | null;
	while (sibling) {
		if (sibling.matches("progress[interop-progress]")) return sibling;
		sibling = sibling.nextElementSibling as HTMLElement | null;
	}
	return null;
}
