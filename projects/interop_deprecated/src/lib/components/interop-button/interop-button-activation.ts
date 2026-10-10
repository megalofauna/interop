import {
	Directive,
	HostListener,
	computed,
	effect,
	inject,
	input,
	isDevMode,
	signal,
} from "@angular/core";
import { InteropActivation } from "../../services/interop-activation.service";
import {
	createActivationHandler,
	type ActivationHandler,
	type ActivationOptions,
	type ManagedActivation,
} from "../../utils/activation";
import { InteropButton } from "./interop-button";

/**
 * Activation layer for InteropButton — debounce, throttle, reentrancy, and
 * cross-component triggering. Optional: import alongside InteropButton only
 * when [onActivate] or [activationId] are needed.
 *
 * Consumers who use only styling, disabled, or loading do not need this
 * directive and pay no bundle cost for the activation utilities.
 *
 * @example
 * ```typescript
 * imports: [InteropButton, InteropButtonActivation]
 * ```
 * ```html
 * <button interop-button
 *         [onActivate]="submit"
 *         [activationOptions]="{ throttleMs: 500, reentrant: false }">
 *   Submit
 * </button>
 * ```
 */
@Directive({
	selector: "button[interop-button]",
	standalone: true,
})
export class InteropButtonActivation {
	private readonly button = inject(InteropButton, {
		self: true,
		optional: true,
	});
	private readonly activationService = inject(InteropActivation, {
		optional: true,
	});

	readonly onActivate = input<ActivationHandler<unknown> | null>(null);
	readonly activationId = input<string | null>(null);
	readonly payload = input<unknown>(undefined);
	readonly activationOptions = input<ActivationOptions>({});

	readonly canActivate = computed(
		() =>
			!(this.button?.isDisabled() ?? false) &&
			!!(this.onActivate() || this.activationId()),
	);

	private readonly localActivation = signal<ManagedActivation<unknown> | null>(
		null,
	);

	constructor() {
		if (isDevMode() && !this.button) {
			console.warn(
				"[InteropButtonActivation] No InteropButton found on the same element. " +
					"Import InteropButton alongside InteropButtonActivation.",
			);
		}

		effect(() => {
			const handler = this.onActivate();
			const options = this.activationOptions();
			this.localActivation.set(
				handler ? createActivationHandler(handler, options) : null,
			);
		});
	}

	@HostListener("click", ["$event"])
	protected onButtonActivate(event: Event): void {
		if (this.button?.isDisabled()) {
			event.preventDefault();
			return;
		}

		const local = this.localActivation();
		if (local) {
			local(this.payload());
			return;
		}

		const id = this.activationId();
		if (id) {
			this.activationService?.trigger(id, this.payload());
		}
	}
}
