import {
	Component,
	ElementRef,
	ViewEncapsulation,
	afterNextRender,
	inject,
	signal,
} from "@angular/core";
import { InteropIcon } from "interop/icon";

interface Variant {
	/** Space-separated, like a variant on interop-button. */
	id: string;
	name: string;
	note: string;
	/** Tokens the button would need for this look; empty when today's tokens express it. */
	needs: string[];
}

interface Frame {
	title: string;
	lede: string;
	variants: Variant[];
}

interface Reading {
	scheme: string;
	variant: string;
	rest: number;
	hover: number;
	edge: number | null;
}

/** Variants of button[interop-button], from its own tokens. Not in the nav. */
@Component({
	selector: "demo-button-lab",
	host: { "itx-flow": "", class: "button-lab" },
	imports: [InteropIcon],
	templateUrl: "./button-lab.html",
	styleUrl: "./button-lab.css",
	encapsulation: ViewEncapsulation.None,
})
export class ButtonLab {
	protected readonly schemes = ["light", "dark"];
	protected readonly count = signal(3);

	protected readonly frames: Frame[] = [
		{
			title: "Emphasis",
			lede: "How loudly a button asks to be pressed.",
			variants: [
				{
					id: "primary",
					name: "Primary",
					note: "The text color as the fill. One per view.",
					needs: [],
				},
				{ id: "", name: "Secondary", note: "Today's button.", needs: [] },
				{
					id: "outline",
					name: "Outline",
					note: "The edge alone, 3:1 against the page.",
					needs: [],
				},
				{
					id: "tertiary",
					name: "Tertiary",
					note: "No fill or edge until hovered.",
					needs: [],
				},
			],
		},
		{
			title: "Intent",
			lede: "What the action does to the reader's data: the badge's tint, on a control.",
			variants: [
				{
					id: "plus",
					name: "Plus",
					note: "Adds or keeps: success tint and edge.",
					needs: [],
				},
				{
					id: "minus",
					name: "Minus",
					note: "Removes: danger tint and edge.",
					needs: [],
				},
				{
					id: "minus-solid",
					name: "Minus, solid",
					note: "The confirming step. White on the danger count's red.",
					needs: [],
				},
			],
		},
		{
			title: "Material",
			lede: "The surfaces the house already draws: knob, track, glass, edge.",
			variants: [
				{
					id: "raised",
					name: "Raised",
					note: "The knob: a lift that settles when pressed.",
					needs: ["--itx-button-box-shadow", "--itx-button-translate-active"],
				},
				{
					id: "recessed",
					name: "Recessed",
					note: "The track: a well with a top shade.",
					needs: ["--itx-button-box-shadow"],
				},
				{
					id: "frosted",
					name: "Frosted",
					note: "The popover's glass. Shown over a picture below.",
					needs: ["--itx-button-backdrop-filter"],
				},
				{
					id: "edged",
					name: "Edged",
					note: "The callout's start edge.",
					needs: ["--itx-button-border-inline-start-width"],
				},
			],
		},
		{
			title: "Crossings",
			lede: "Two ideas at once.",
			variants: [
				{
					id: "primary pill",
					name: "Primary, pill",
					note: "Round by shape.",
					needs: [],
				},
				{
					id: "raised primary",
					name: "Raised primary",
					note: "The lift under the dark fill.",
					needs: ["--itx-button-box-shadow"],
				},
				{
					id: "edged go",
					name: "Edged, success",
					note: "A secondary with a success start edge: quieter than Plus.",
					needs: ["--itx-button-border-inline-start-width"],
				},
				{
					id: "outline pill",
					name: "Outline, pill",
					note: "A filter or a tag-like action.",
					needs: [],
				},
			],
		},
	];

	protected readonly readings = signal<Reading[]>([]);

	constructor() {
		const host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
		afterNextRender(() =>
			requestAnimationFrame(() => this.readings.set(measure(host))),
		);
	}

	protected toggle(event: Event) {
		const button = event.currentTarget as HTMLButtonElement;
		button.setAttribute(
			"aria-pressed",
			String(button.getAttribute("aria-pressed") !== "true"),
		);
	}

	protected step(by: number) {
		this.count.update((value) => Math.max(0, value + by));
	}

	protected ratio(value: number | null, minimum: number) {
		return value === null
			? "—"
			: `${value.toFixed(2)}${value < minimum ? " ✗" : ""}`;
	}
}

/**
 * Each measured variant's text against its fill at rest and on hover, and its edge against the page.
 * Tokens are resolved in the variant's scheme through a probe, then painted over the page.
 */
function measure(host: HTMLElement): Reading[] {
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = 1;
	const context = canvas.getContext("2d", { willReadFrequently: true })!;
	const paint = (...colors: string[]) => {
		context.clearRect(0, 0, 1, 1);
		for (const color of colors) {
			context.fillStyle = color;
			context.fillRect(0, 0, 1, 1);
		}
		return Array.from(
			context.getImageData(0, 0, 1, 1).data.slice(0, 3),
			(v) => v / 255,
		);
	};
	const luminance = (rgb: number[]) => {
		const [r, g, b] = rgb.map((v) =>
			v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
		);
		return 0.2126 * r + 0.7152 * g + 0.0722 * b;
	};
	const contrast = (a: number[], b: number[]) => {
		const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
		return (high + 0.05) / (low + 0.05);
	};

	return Array.from(
		host.querySelectorAll<HTMLButtonElement>("button[data-measure]"),
		(button) => {
			const scheme = button.closest<HTMLElement>(".scheme")!;
			const probe = scheme.querySelector<HTMLElement>(".probe")!;
			const page = getComputedStyle(scheme).backgroundColor;
			const token = (name: string) => {
				probe.style.color = getComputedStyle(button).getPropertyValue(name);
				return getComputedStyle(probe).color;
			};
			const text = (fill: string, color: string) =>
				contrast(paint(page, fill, color), paint(page, fill));
			const edge = token("--itx-button-border-color");
			return {
				scheme: scheme.classList.contains("dark") ? "dark" : "light",
				variant: button.dataset["measure"]!,
				rest: text(
					token("--itx-button-background-color"),
					token("--itx-button-color"),
				),
				hover: text(
					token("--itx-button-background-color-hover"),
					token("--itx-button-color-hover"),
				),
				// A clear edge is no edge.
				edge: /,\s*0\)$/.test(edge)
					? null
					: contrast(paint(page, edge), paint(page)),
			};
		},
	);
}
