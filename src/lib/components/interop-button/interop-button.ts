import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
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

/**
 * InteropButton — Styled button with opt-in activation guardrails.
 *
 * Use on any `<button>` element. With no additional inputs it behaves as a
 * plain native button with Interop styling applied. Activation guardrails
 * (debounce, throttle, reentrancy) activate when `[onActivate]` is provided.
 * Cross-component triggering activates when `[activationId]` is provided.
 *
 * @example Styled native button (no guardrails)
 * ```html
 * <button interop-button (click)="save()">Save</button>
 * ```
 *
 * @example With activation guardrails
 * ```html
 * <button interop-button
 *         [onActivate]="submit"
 *         [activationOptions]="{ throttleMs: 500, reentrant: false }">
 *   Submit
 * </button>
 * ```
 *
 * @example Cross-component coordination
 * ```html
 * <button interop-button [activationId]="'save'">Save from anywhere</button>
 * ```
 */
@Component({
	selector: "button[interop-button]",
	standalone: true,
	imports: [],
	templateUrl: "./interop-button.html",
	styleUrl: "./interop-button.css",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InteropButton {
	private readonly elementRef = inject(ElementRef<HTMLButtonElement>);
	private readonly activationService = inject(InteropActivation, {
		optional: true,
	});

	readonly onActivate = input<ActivationHandler<unknown> | null>(null);
	readonly activationId = input<string | null>(null);
	readonly payload = input<unknown>(undefined);
	readonly activationOptions = input<ActivationOptions>({});
	readonly loading = input<boolean>(false);
	readonly disabled = input<boolean>(false);
	readonly type = input<"button" | "submit" | "reset">("button");
	readonly loadingText = input<string>("Loading...");

	readonly isDisabled = computed(() => this.disabled() || this.loading());
	readonly canActivate = computed(
		() => !this.isDisabled() && !!(this.onActivate() || this.activationId()),
	);

	private readonly localActivation = signal<ManagedActivation<unknown> | null>(
		null,
	);

	constructor() {
		if (isDevMode()) {
			const el = this.elementRef.nativeElement;
			if (el.tagName !== "BUTTON") {
				console.warn(
					`InteropButton must be used on <button> elements. Found on: ${el.tagName.toLowerCase()}`,
				);
			}
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
	onButtonActivate(event: Event): void {
		if (this.isDisabled()) {
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
