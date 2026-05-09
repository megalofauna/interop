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
 * ── Disabled vs loading semantics ───────────────────────────────────────────
 *
 * These two states look similar but carry different semantic weight, which
 * drives how each is communicated to assistive technology:
 *
 * `disabled` — the action is structurally unavailable. The native `disabled`
 * attribute is applied by default, which removes the element from the tab
 * order. This is the correct default: browsers, form engines, and AT all
 * understand it without configuration.
 *
 * However, removing an element from the tab order also makes it invisible
 * to keyboard-only users. If a button is temporarily gated (e.g. a submit
 * button blocked by incomplete form fields), a keyboard user who cannot
 * reach it will never learn it exists or what's preventing them from
 * proceeding. For these cases, set `[focusableWhenDisabled]="true"`.
 * This switches from native `disabled` to `aria-disabled="true"`, keeping
 * the button focusable and announceable while still blocking interaction.
 * The click guard in the host listener enforces the same suppression that
 * native `disabled` would provide.
 *
 * `loading` — the action is temporarily executing. `aria-disabled="true"` +
 * `aria-busy="true"` are applied instead of native `disabled`. The button
 * stays in the tab order so that a screen reader user who reaches it mid-
 * operation hears "loading" rather than encountering silence. Pointer events
 * are suppressed via CSS so mouse users see no hover interaction. The click
 * guard prevents re-entry via keyboard as well.
 *
 * ── Attribute summary ────────────────────────────────────────────────────────
 *
 *   State                              disabled   aria-disabled   aria-busy
 *   ─────────────────────────────────────────────────────────────────────────
 *   disabled (default)                   ✓            —              —
 *   disabled + focusableWhenDisabled     —            ✓              —
 *   loading                              —            ✓              ✓
 *
 * ── References ───────────────────────────────────────────────────────────────
 *
 * WAI-ARIA APG Button pattern recommends aria-disabled when an action is
 * temporarily unavailable: https://www.w3.org/WAI/ARIA/apg/patterns/button/
 *
 * MUI Base UI converged on the same focusableWhenDisabled opt-in pattern
 * after community discussion in 2022: https://github.com/mui/material-ui/issues/32917
 *
 * Ariakit makes aria-disabled the default for all disabled controls:
 * https://ariakit.org/reference/focusable
 *
 * ── Future evolution ─────────────────────────────────────────────────────────
 *
 * A natural next step is a `disabledReason` input (string | TemplateRef) that
 * wires an `aria-describedby` tooltip to the button, giving keyboard users
 * the "why" alongside the "unavailable" announcement. This is only useful
 * when `focusableWhenDisabled` is true, since a natively disabled button
 * cannot receive focus and therefore cannot expose a tooltip. See:
 * https://github.com/adobe/react-spectrum/discussions/9232
 *
 * @example Styled native button (no guardrails)
 * ```html
 * <button interop-button (click)="save()">Save</button>
 * ```
 *
 * @example Focusable disabled — submit gated by form validity
 * ```html
 * <button interop-button [disabled]="!form.valid" [focusableWhenDisabled]="true">
 *   Submit
 * </button>
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
 */
@Component({
	selector: "button[interop-button]",
	standalone: true,
	imports: [],
	templateUrl: "./interop-button.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		// Native disabled — removed from tab order. Default for `disabled` input.
		"[disabled]": "disabled() && !focusableWhenDisabled()",
		// aria-disabled — stays focusable, announces unavailable state to AT.
		// Applied when: (a) disabled but focusableWhenDisabled is set, or (b) loading.
		"[attr.aria-disabled]":
			"(disabled() && focusableWhenDisabled()) || loading() ? 'true' : null",
		// aria-busy — signals an async operation is in progress. Loading only.
		"[attr.aria-busy]": "loading() ? 'true' : null",
	},
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
	/**
	 * When true, a disabled button remains in the tab order and is announced
	 * by screen readers, rather than being removed from the page entirely.
	 * Use this when discoverability matters — e.g. a submit button that is
	 * gated on form validity, where a keyboard user should be able to reach
	 * the button and understand why they cannot proceed.
	 *
	 * Switches the DOM strategy from native `disabled` to `aria-disabled="true"`.
	 * Interaction is still fully suppressed by the host listener.
	 */
	readonly focusableWhenDisabled = input<boolean>(false);
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
			warnOnConflictingTokens(el);
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

const BUTTON_SIZES = ["sm", "md", "lg"] as const;
const BUTTON_VARIANTS = [
	"primary",
	"secondary",
	"ghost",
	"destructive",
] as const;

function warnOnConflictingTokens(el: HTMLButtonElement): void {
	const raw = el.getAttribute("interop-button") ?? "";
	const tokens = raw.split(/\s+/).filter(Boolean);

	const sizes = tokens.filter((t) =>
		(BUTTON_SIZES as readonly string[]).includes(t),
	);
	const variants = tokens.filter((t) =>
		(BUTTON_VARIANTS as readonly string[]).includes(t),
	);

	if (sizes.length > 1) {
		console.warn(
			`[InteropButton] Multiple size tokens detected: "${sizes.join(", ")}". ` +
				`Only one of sm | md | lg is valid. Last declaration in source order wins.`,
		);
	}
	if (variants.length > 1) {
		console.warn(
			`[InteropButton] Multiple variant tokens detected: "${variants.join(", ")}". ` +
				`Only one of primary | secondary | ghost | destructive is valid. Last declaration in source order wins.`,
		);
	}
}
