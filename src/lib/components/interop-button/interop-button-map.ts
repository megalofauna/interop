import {
	Directive,
	ElementRef,
	InjectionToken,
	OnInit,
	inject,
} from "@angular/core";

/**
 * Maps consumer-defined vocabulary to Interop's internal button tokens.
 * Each key is a consumer keyword; each value is a space-separated string of
 * Interop tokens it should expand to.
 *
 * @example
 * {
 *   provide: ITX_BUTTON_MAP,
 *   useValue: {
 *     primary:   'action-plus',
 *     secondary: 'action',
 *     ghost:     'action-minus',
 *     danger:    'action-plus destroy',
 *   },
 * }
 */
export type ItxButtonMap = Record<string, string>;
export const ITX_BUTTON_MAP = new InjectionToken<ItxButtonMap>("itx-button-map");

/**
 * Resolves consumer vocabulary on [interop-button] to Interop's internal
 * tokens at render time. Only needed when ITX_BUTTON_MAP is provided.
 *
 * Import alongside InteropButton in any component that uses a map:
 * ```ts
 * imports: [InteropButton, InteropButtonMap]
 * ```
 */
@Directive({
	selector: "button[interop-button]",
	standalone: true,
})
export class InteropButtonMap implements OnInit {
	private readonly el: ElementRef<HTMLButtonElement> = inject(ElementRef);
	private readonly map = inject(ITX_BUTTON_MAP, { optional: true });

	ngOnInit(): void {
		const map = this.map;
		if (!map) return;

		const raw = this.el.nativeElement.getAttribute("interop-button") ?? "";
		const tokens = raw.split(/\s+/).filter(Boolean);
		const resolved = [
			...new Set(
				tokens.flatMap((t) => (map[t] ?? t).split(/\s+/).filter(Boolean)),
			),
		].join(" ");

		if (resolved !== raw) {
			this.el.nativeElement.setAttribute("interop-button", resolved);
		}
	}
}
