import {
	computed,
	DestroyRef,
	Directive,
	forwardRef,
	inject,
	input,
	signal,
} from "@angular/core";
import {
	AbstractControl,
	ControlValueAccessor,
	NG_VALUE_ACCESSOR,
	ValidationErrors,
} from "@angular/forms";

import { ErrorMessages, FieldError } from "../errors/field-error.model";
import { INTEROP_ERROR_MESSAGES } from "../errors/error-messages.token";
import { resolveErrors } from "../errors/resolve-errors";

/**
 * When to display validation errors relative to user interaction.
 * - `'touched'` — after the field has been blurred at least once.
 * - `'dirty'`   — after the value has been changed at least once.
 * - `'immediate'` — always, regardless of interaction state.
 */
export type ShowErrorsOn = "touched" | "dirty" | "immediate";

/**
 * How to display multiple validation errors.
 * - `'single'` — show only the highest-priority (first) error.
 * - `'all'`    — show every active error in a stacked list.
 */
export type ErrorDisplay = "single" | "all";

/**
 * Provides the `NG_VALUE_ACCESSOR` token pointing to a concrete
 * `ControlValueAccessor` class. Exported for consumers who build their
 * own CVA components on top of `FieldBase` using the traditional
 * `NG_VALUE_ACCESSOR` provider pattern.
 *
 * **Do not use this inside `InteropFieldInput` or `InteropFieldTextarea`.**
 * Those components use the self-injection pattern (`inject(NgControl)` +
 * `ngControl.valueAccessor = this`) which avoids the NG0200 circular
 * dependency that arises when both approaches are active simultaneously.
 */
export function provideFieldValueAccessor(type: any) {
	return {
		provide: NG_VALUE_ACCESSOR,
		useExisting: forwardRef(() => type),
		multi: true,
	};
}

/**
 * FieldBase — Abstract foundation for Interop field components.
 *
 * Encapsulates all shared logic for `<interop-input-field>` and
 * `<interop-textarea-field>`:
 *
 * - **ControlValueAccessor** — works with `formControl`, `formControlName`,
 *   and `ngModel` out of the box.
 * - **Error resolution** — merges library defaults → app-wide overrides →
 *   per-field overrides, resolves `ValidationErrors` into displayable
 *   `FieldError` objects, and gates visibility on interaction state.
 * - **ARIA wiring** — computes `aria-describedby` and `aria-errormessage`
 *   values from rendered note and error IDs.
 * - **Notes normalization** — accepts `string | string[] | null` and
 *   normalizes to `string[]`.
 *
 * Concrete subclasses provide:
 * - A template with the appropriate native element (`<input>` or `<textarea>`).
 * - Any element-specific inputs (e.g. `type` for input, `autoResize` for textarea).
 * - CVA wiring via `inject(NgControl, { self: true, optional: true })` and
 *   `ngControl.valueAccessor = this` in the constructor (self-injection pattern).
 *
 * Using `@Directive` (rather than a bare class) so Angular processes
 * the signal inputs, host bindings, and DI on this base.
 */
@Directive({ standalone: true })
export abstract class FieldBase implements ControlValueAccessor {
	// ── Injections ──────────────────────────────────────────────────────────

	private globalMessages = inject(INTEROP_ERROR_MESSAGES);
	private readonly destroyRef = inject(DestroyRef);

	// ── Public inputs ───────────────────────────────────────────────────────

	/** Unique ID wired to `<label for>` and the native element's `id`. */
	id = input.required<string>();

	/** Label text rendered above the field. */
	label = input.required<string>();

	/** Whether the field is required. Sets `aria-required` and visual indicator. */
	required = input<boolean>(false);

	/** Placeholder forwarded to the native element. */
	placeholder = input<string>("");

	/** Whether the field is disabled. */
	disabled = input<boolean>(false);

	/** Whether the field is read-only. */
	readonly = input<boolean>(false);

	/**
	 * Explicit `AbstractControl` reference for reading validation errors.
	 * Use this when the control lives outside the component (e.g., you are
	 * not using CVA). If the component is used with `formControl` /
	 * `formControlName` / `ngModel`, the control is detected automatically
	 * and this input is unnecessary.
	 */
	control = input<AbstractControl | null>(null);

	/**
	 * Manual error input for consumers not using Angular Forms.
	 * Accepts a single error, an array of errors, or null.
	 * When provided, takes precedence over control-based error resolution.
	 */
	fieldErrors = input<FieldError | FieldError[] | null>(null);

	/**
	 * Hint or helper text displayed below the field.
	 * Accepts a single string, an array of strings, or null.
	 */
	fieldNotes = input<string | string[] | null>(null);

	/**
	 * Per-field error message overrides. Merged on top of app-wide and
	 * library-level defaults (most-specific wins).
	 */
	errorMessages = input<ErrorMessages>({});

	/**
	 * When to display errors relative to user interaction.
	 * Only applies to control-based errors — manual `fieldErrors` are
	 * always shown immediately.
	 */
	showErrorsOn = input<ShowErrorsOn>("touched");

	/**
	 * Whether to show a single (highest-priority) error or all errors.
	 */
	errorDisplay = input<ErrorDisplay>("single");

	// ── CVA state ───────────────────────────────────────────────────────────

	/** Current field value (internal signal, updated by CVA and user input). */
	protected value = signal<string>("");

	/** Callback registered by Angular Forms to propagate value changes. */
	private onChangeFn: (value: string) => void = () => {};

	/** Callback registered by Angular Forms to mark the control as touched. */
	private onTouchedFn: () => void = () => {};

	/**
	 * The `AbstractControl` instance provided by Angular Forms via CVA.
	 * Set externally by the concrete subclass after the NgControl injects
	 * and resolves, or remains `null` when used without forms.
	 *
	 * This is set via {@link setCvaControl} — called from the concrete
	 * component's constructor after Angular has resolved NgControl.
	 */
	private cvaControl = signal<AbstractControl | null>(null);

	// ── Internal state ──────────────────────────────────────────────────────

	/** Whether the native element currently has focus. */
	focused = signal(false);

	// ── Computed: error resolution ──────────────────────────────────────────

	/**
	 * The active control used for reading errors and interaction state.
	 * Explicit `[control]` input takes precedence, then CVA-provided control.
	 */
	private activeControl = computed<AbstractControl | null>(
		() => this.control() ?? this.cvaControl(),
	);

	/**
	 * Merged message map: library defaults ← app-wide overrides ← per-field overrides.
	 */
	private mergedMessages = computed<ErrorMessages>(() => ({
		...this.globalMessages,
		...this.errorMessages(),
	}));

	/**
	 * Normalized manual field errors. `null` and single objects become arrays.
	 */
	private normalizedFieldErrors = computed<FieldError[] | null>(() => {
		const raw = this.fieldErrors();
		if (raw == null) return null;
		return Array.isArray(raw) ? raw : [raw];
	});

	/**
	 * Revision counter incremented on every form-control event (value change,
	 * status change, touched/dirty change). Reading this signal inside computed
	 * properties that consume non-signal AbstractControl properties (`.errors`,
	 * `.touched`, `.dirty`) forces those computeds to re-evaluate reactively.
	 */
	private ctrlRevision = signal(0);

	/**
	 * All resolved errors before visibility gating.
	 * Manual `fieldErrors` take precedence over control-based resolution.
	 */
	private resolvedErrors = computed<FieldError[]>(() => {
		const manual = this.normalizedFieldErrors();
		if (manual !== null) return manual;

		const ctrl = this.activeControl();
		if (!ctrl) return [];

		// Depend on ctrlRevision so this recomputes when ctrl.errors changes.
		this.ctrlRevision();

		return resolveErrors(ctrl.errors, this.mergedMessages());
	});

	/**
	 * Whether errors should currently be shown, based on `showErrorsOn`
	 * and the control's interaction state.
	 */
	private shouldShowErrors = computed<boolean>(() => {
		// Manual errors are always shown — the consumer controls visibility.
		if (this.normalizedFieldErrors() !== null) return true;

		const ctrl = this.activeControl();
		if (!ctrl) return false;

		// Depend on ctrlRevision so this recomputes when touched/dirty changes.
		this.ctrlRevision();

		const mode = this.showErrorsOn();
		if (mode === "immediate") return true;
		if (mode === "touched") return ctrl.touched;
		if (mode === "dirty") return ctrl.dirty;
		return false;
	});

	/**
	 * The errors that should actually be rendered, accounting for
	 * visibility gating and display mode.
	 */
	visibleErrors = computed<FieldError[]>(() => {
		if (!this.shouldShowErrors()) return [];

		const errors = this.resolvedErrors();
		if (errors.length === 0) return [];

		return this.errorDisplay() === "single" ? [errors[0]] : errors;
	});

	/** Whether there are any visible errors. */
	hasVisibleErrors = computed<boolean>(() => this.visibleErrors().length > 0);

	// ── Computed: notes ─────────────────────────────────────────────────────

	/** Normalized notes array. */
	normalizedNotes = computed<string[]>(() => {
		const raw = this.fieldNotes();
		if (raw == null) return [];
		return Array.isArray(raw) ? raw : [raw];
	});

	// ── Computed: ARIA ──────────────────────────────────────────────────────

	/** Generates a note element ID for the given index. */
	noteId(index: number): string {
		return `${this.id()}-note-${index}`;
	}

	/** Generates an error element ID for the given index. */
	errorId(index: number): string {
		return `${this.id()}-error-${index}`;
	}

	/**
	 * Computed `aria-describedby` value joining note IDs and visible error IDs.
	 * Returns `null` when there are no IDs to reference.
	 */
	describedByIds = computed<string | null>(() => {
		const ids: string[] = [];

		const notes = this.normalizedNotes();
		for (let i = 0; i < notes.length; i++) {
			ids.push(this.noteId(i));
		}

		const errors = this.visibleErrors();
		for (let i = 0; i < errors.length; i++) {
			ids.push(this.errorId(i));
		}

		return ids.length > 0 ? ids.join(" ") : null;
	});

	/**
	 * First error ID for `aria-errormessage`. Returns `null` when
	 * there are no visible errors.
	 */
	firstErrorId = computed<string | null>(() =>
		this.hasVisibleErrors() ? this.errorId(0) : null,
	);

	// ── CVA implementation ──────────────────────────────────────────────────

	writeValue(value: any): void {
		this.value.set(value ?? "");
	}

	registerOnChange(fn: (value: string) => void): void {
		this.onChangeFn = fn;
	}

	registerOnTouched(fn: () => void): void {
		this.onTouchedFn = fn;
	}

	setDisabledState?(isDisabled: boolean): void {
		// Disabled state is driven by the [disabled] input.
		// Angular Forms calls this when the control is enabled/disabled
		// programmatically — we could propagate it, but the input takes
		// precedence in our model.
	}

	// ── Template event handlers ─────────────────────────────────────────────

	/**
	 * Called from the template on `(input)` events.
	 * Updates internal value and notifies Angular Forms.
	 */
	onInput(event: Event): void {
		const element = event.target as HTMLInputElement | HTMLTextAreaElement;
		this.value.set(element.value);
		this.onChangeFn(element.value);
	}

	/**
	 * Called from the template on `(blur)` events.
	 * Marks the control as touched for Angular Forms.
	 */
	onTouched(): void {
		this.onTouchedFn();
	}

	// ── Protected helpers for subclasses ────────────────────────────────────

	/** Live subscription to the current control's events (or null). */
	private ctrlEventSub: { unsubscribe(): void } | null = null;

	/**
	 * Allows the concrete subclass to register the `AbstractControl`
	 * provided by Angular Forms (via NgControl) so the base can read
	 * errors and interaction state from it.
	 *
	 * Also subscribes to the control's `events` stream so that signal
	 * computeds depending on `ctrlRevision` stay reactive to validation
	 * state, touched, and dirty changes.
	 *
	 * Call this from the subclass constructor after injecting NgControl:
	 * ```ts
	 * const ngControl = inject(NgControl, { self: true, optional: true });
	 * if (ngControl) {
	 *   ngControl.valueAccessor = this;
	 *   afterNextRender(() => this.setCvaControl(ngControl.control));
	 * }
	 * ```
	 */
	protected setCvaControl(control: AbstractControl | null): void {
		// Clean up any previous subscription first.
		this.ctrlEventSub?.unsubscribe();
		this.ctrlEventSub = null;

		this.cvaControl.set(control);

		if (control) {
			// Subscribe to all control events (value, status, touched, dirty).
			// Each emission bumps ctrlRevision, which re-triggers any computed
			// signal that reads it (resolvedErrors, shouldShowErrors).
			this.ctrlEventSub = control.events.subscribe(() => {
				this.ctrlRevision.update((r) => r + 1);
			});

			// Clean up when the component is destroyed.
			this.destroyRef.onDestroy(() => {
				this.ctrlEventSub?.unsubscribe();
				this.ctrlEventSub = null;
			});
		}
	}
}
