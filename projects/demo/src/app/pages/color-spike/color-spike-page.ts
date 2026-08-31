import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	ElementRef,
	inject,
	signal,
	ViewEncapsulation,
} from "@angular/core";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";
import { DemoPage } from "../../components/demo-page/demo-page";
import { DemoSection } from "../../components/demo-section/demo-section";
import {
	contrastRatio,
	formatRatio,
	usedValue,
} from "interop/lib/dev/contrast";

const SURFACES = [
	"page-0",
	"page-1",
	"page-2",
	"layer-0",
	"layer-1",
	"layer-2",
] as const;
const TEXTS = ["text-0", "text-1", "text-2", "text-3"] as const;
const BORDERS = ["separator", "edge"] as const;
const ACCENTS = ["danger", "warning", "success", "info", "colorway"] as const;

/** The floor each text tier was solved to, against the deepest layer. */
const TEXT_FLOOR: Record<string, number> = {
	"text-0": 3,
	"text-1": 4.5,
	"text-2": 7,
	"text-3": 7,
};
const BORDER_FLOOR: Record<string, number> = { separator: 0, edge: 3 };

/** One rung of a candidate ladder, with the swatch it paints. */
interface Rung {
	readonly label: string;
	readonly band: "page" | "layer" | "text";
	readonly color: string;
}

interface Candidate {
	readonly spacing: string;
	/** Per-step separation at the dark end, in 8-bit levels. */
	readonly levels: number;
	/** Lightness left between the 7:1 tier and the far end. */
	readonly topGap: string;
	readonly dark: readonly Rung[];
	readonly light: readonly Rung[];
}

/*
 * Page-band candidates at 2, 3 and 4 percent.
 *
 * Widening the page band is not a local change. The layer band keeps its
 * 0.025 gap above page-2, so it shifts up with it, and the text tiers are
 * re-solved against the new deepest layer. The ladder runs between two fixed
 * ends, so lightness spent on the page band comes out of the top — which is
 * the trade the topGap column prices.
 */
const LAD = (page: number[], layer: number[], text: number[]): Rung[] => [
	...page.map((l, i) => ({
		label: `page-${i}`,
		band: "page" as const,
		color: `oklch(${l} 0.008 255)`,
	})),
	...layer.map((l, i) => ({
		label: `layer-${i}`,
		band: "layer" as const,
		color: `oklch(${l} 0.008 255)`,
	})),
	...text.map((l, i) => ({
		label: `text-${i}`,
		band: "text" as const,
		color: `oklch(${l} 0.008 255)`,
	})),
];

const CANDIDATES: readonly Candidate[] = [
	{
		spacing: "2%",
		levels: 5,
		topGap: "0.127",
		dark: LAD(
			[0.18, 0.2, 0.22],
			[0.245, 0.295, 0.345],
			[0.617, 0.719, 0.843, 0.97],
		),
		light: LAD(
			[0.99, 0.97, 0.95],
			[0.925, 0.875, 0.825],
			[0.524, 0.432, 0.329, 0.15],
		),
	},
	{
		spacing: "3%",
		levels: 7,
		topGap: "0.100",
		dark: LAD(
			[0.18, 0.21, 0.24],
			[0.265, 0.315, 0.365],
			[0.641, 0.745, 0.87, 0.97],
		),
		light: LAD(
			[0.99, 0.96, 0.93],
			[0.905, 0.855, 0.805],
			[0.509, 0.417, 0.309, 0.15],
		),
	},
	{
		spacing: "4%",
		levels: 9,
		topGap: "0.075",
		dark: LAD(
			[0.18, 0.22, 0.26],
			[0.285, 0.335, 0.385],
			[0.661, 0.766, 0.895, 0.97],
		),
		light: LAD(
			[0.99, 0.95, 0.91],
			[0.885, 0.835, 0.785],
			[0.492, 0.402, 0.289, 0.15],
		),
	},
];

@Component({
	selector: "color-spike-page",
	standalone: true,
	imports: [DemoPage, DemoSection, DemoMasthead],
	templateUrl: "./color-spike-page.html",
	styleUrls: ["./spike-tokens.css", "./color-spike-page.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorSpikePage {
	protected readonly surfaces = SURFACES;
	protected readonly texts = TEXTS;
	protected readonly borders = BORDERS;
	protected readonly accents = ACCENTS;
	protected readonly formatRatio = formatRatio;
	protected readonly candidates = CANDIDATES;

	/** Which arm the candidate ladders paint. Independent of the page theme. */
	protected readonly candidateArm = signal<"dark" | "light">("dark");

	protected rungs(c: Candidate): readonly Rung[] {
		return this.candidateArm() === "dark" ? c.dark : c.light;
	}

	/** Every spike token's resolved colour, keyed by its name. */
	private readonly seen = signal<ReadonlyMap<string, string>>(new Map());

	protected value(name: string): string {
		return this.seen().get(name) ?? "";
	}

	protected ratio(fg: string, bg: string): number {
		const f = this.value(fg);
		const b = this.value(bg);
		return f && b ? contrastRatio(f, b) : Number.NaN;
	}

	/** Whether a reading clears the floor its token was solved to. */
	protected clears(token: string, reading: number): boolean {
		const floor = TEXT_FLOOR[token] ?? BORDER_FLOOR[token] ?? 0;
		return !floor || (Number.isFinite(reading) && reading >= floor - 0.005);
	}

	/** The spread of a border across every surface. The claim being tested. */
	protected spread(border: string): string {
		const rs = SURFACES.map((s) => this.ratio(border, s)).filter((r) =>
			Number.isFinite(r),
		);
		if (!rs.length) return "—";
		return (Math.max(...rs) - Math.min(...rs)).toFixed(2);
	}

	/* ── Measurement ─────────────────────────────────────────────────────── */

	private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
	private cleanup: (() => void) | null = null;

	constructor() {
		afterNextRender(() => {
			this.remeasure();
			const root = document.querySelector("[interop-root]");
			const observer = new MutationObserver(() => this.remeasure());
			if (root) {
				observer.observe(root, {
					attributes: true,
					attributeFilter: ["itx-theme"],
				});
			}
			const media = matchMedia("(prefers-color-scheme: dark)");
			const onScheme = () => this.remeasure();
			media.addEventListener("change", onScheme);
			this.cleanup = () => {
				observer.disconnect();
				media.removeEventListener("change", onScheme);
			};
		});
		inject(DestroyRef).onDestroy(() => this.cleanup?.());
	}

	/** Deferred a frame: a scheme switch swaps values mid-frame. */
	private remeasure(): void {
		requestAnimationFrame(() => {
			const next = new Map<string, string>();
			for (const el of Array.from(
				this.host.nativeElement.querySelectorAll<HTMLElement>("[data-token]"),
			)) {
				const key = el.dataset["token"];
				if (key) next.set(key, usedValue(el, "background-color"));
			}
			this.seen.set(next);
		});
	}
}
