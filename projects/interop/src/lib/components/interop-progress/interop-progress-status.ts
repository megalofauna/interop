import { ChangeDetectionStrategy, Component } from "@angular/core";

/**
 * InteropProgressStatus — Optional live region for progress milestone announcements.
 *
 * Wrap status messages that should be read aloud by screen readers at meaningful
 * moments (complete, error, key transitions). The progress bar itself is intentionally
 * silent to avoid spamming assistive technology on every value tick.
 *
 * Content is projected and announced politely — existing reading is not interrupted.
 * When content is empty or null, nothing is announced.
 *
 * @example Upload complete announcement
 * ```html
 * <progress interop-progress [value]="uploaded" [max]="total" aria-label="Upload"></progress>
 * <interop-progress-status>
 *   @if (uploaded === total) { Upload complete }
 * </interop-progress-status>
 * ```
 *
 * @example Step-based with conditional message
 * ```html
 * <interop-progress-status>
 *   @if (step === totalSteps) { Setup complete — you're ready to go. }
 * </interop-progress-status>
 * ```
 */
@Component({
	selector: "interop-progress-status",
	standalone: true,
	template: "<ng-content />",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		"role": "status",
		"aria-live": "polite",
		"aria-atomic": "true",
		"class": "interop-sr-only",
	},
})
export class InteropProgressStatus {}
