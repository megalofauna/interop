import {
	Component,
	DestroyRef,
	ElementRef,
	ViewEncapsulation,
	afterNextRender,
	computed,
	inject,
	signal,
} from "@angular/core";
import { bindSegmentedFit } from "interop";

interface Option {
	id: string;
	name: string;
	note: string;
	/** What the option would add to the library. */
	css: string;
}

const FIELDS =
	":where(select[interop-select], :is(input, textarea)[interop-input]):focus-visible";

/** How a field's border and the focus ring meet. Listed under Labs in the nav. */
@Component({
	selector: "demo-focus-lab",
	host: { "itx-flow": "", class: "focus-lab", "[attr.data-ring]": "ring()" },
	templateUrl: "./focus-lab.html",
	styleUrl: "./focus-lab.css",
	encapsulation: ViewEncapsulation.None,
})
export class FocusLab {
	protected readonly scheme = signal("light");
	protected readonly ring = signal("cover");

	protected readonly options: Option[] = [
		{
			id: "today",
			name: "Today",
			note: "The border, a 2px gap, then the ring.",
			css: "/* Nothing. */",
		},
		{
			id: "cover",
			name: "Cover",
			note: "The ring sits on the border, so one blue edge replaces the grey one. On an invalid field the ring covers the outer half of the red border; the inner half still shows.",
			css: `${FIELDS} {\n\t--itx-outline-offset: calc(-1 * var(--itx-field-border-width));\n}\n\n:where([interop-button]:focus-visible) {\n\t--itx-outline-offset: calc(-1 * var(--itx-button-border-width));\n}`,
		},
		{
			id: "fuse",
			name: "Fuse",
			note: "The border takes the ring's color and the ring sits on it: one edge. On an invalid field the ring turns red and sits against the red border, so the red edge doubles in width.",
			css: `${FIELDS} {\n\t--itx-field-border-color: var(--itx-outline-color);\n\t--itx-field-border-color-hover: var(--itx-outline-color);\n\t--itx-outline-offset: calc(-1 * var(--itx-field-border-width));\n}\n\n${FIELDS}:where([aria-invalid="true"], :user-invalid:not([aria-invalid="false"])) {\n\t--itx-outline-color: var(--itx-field-border-color-invalid);\n\t--itx-outline-offset: 0px;\n}\n\n:where([interop-button]:focus-visible) {\n\t--itx-outline-offset: calc(-1 * var(--itx-button-border-width));\n}\n\n/* In interop-button.base.css: the token exists. */\n--itx-button-border-color-focus-visible: var(--itx-outline-color);`,
		},
		{
			id: "fuse-dim",
			name: "Fuse + Dim",
			note: "Fields fuse: one edge, blue, or red when invalid. Buttons dim: their faint border steps down under the ring.",
			css: `/* Fuse's two field rules, and Dim's button token. */\n${FIELDS} {\n\t--itx-field-border-color: var(--itx-outline-color);\n\t--itx-field-border-color-hover: var(--itx-outline-color);\n\t--itx-outline-offset: calc(-1 * var(--itx-field-border-width));\n}\n\n${FIELDS}:where([aria-invalid="true"], :user-invalid:not([aria-invalid="false"])) {\n\t--itx-outline-color: var(--itx-field-border-color-invalid);\n\t--itx-outline-offset: 0px;\n}\n\n/* In interop-button.base.css: the token exists. */\n--itx-button-border-color-focus-visible: light-dark(var(--itx-neutral-300), var(--itx-neutral-700));`,
		},
		{
			id: "hide",
			name: "Hide",
			note: "The border goes clear while the ring shows; the ring floats 2px out. An invalid field keeps its red.",
			css: `${FIELDS} {\n\t--itx-field-border-color: transparent;\n\t--itx-field-border-color-hover: transparent;\n}\n\n/* In interop-button.base.css: the token exists. */\n--itx-button-border-color-focus-visible: transparent;`,
		},
		{
			id: "dim",
			name: "Dim",
			note: "The border steps down to a faint line while the ring shows. An invalid field keeps its red.",
			css: `${FIELDS} {\n\t--itx-field-border-color: light-dark(var(--itx-neutral-350), var(--itx-neutral-600));\n\t--itx-field-border-color-hover: var(--itx-field-border-color);\n}\n\n/* In interop-button.base.css: the token exists. */\n--itx-button-border-color-focus-visible: light-dark(var(--itx-neutral-300), var(--itx-neutral-700));`,
		},
		{
			id: "hug",
			name: "Hug",
			note: "No gap: the ring sits against the border, outside it, so the two read as one thick edge.",
			css: `:where(select[interop-select], :is(input, textarea)[interop-input], [interop-button]):focus-visible {\n\t--itx-outline-offset: 0px;\n}`,
		},
	];

	constructor() {
		const host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
		const destroy = inject(DestroyRef);
		// The dials stack when the window is too narrow for their row.
		afterNextRender(() => {
			const unbinds = Array.from(
				host.querySelectorAll<HTMLElement>(".dials > fieldset"),
				(dial) => bindSegmentedFit(dial),
			);
			destroy.onDestroy(() => unbinds.forEach((unbind) => unbind()));
		});
	}

	protected readonly chosen = computed(() =>
		this.options.find((option) => option.id === this.ring())!,
	);

	protected set(dial: "scheme" | "ring", event: Event) {
		this[dial].set((event.target as HTMLInputElement).value);
	}
}
