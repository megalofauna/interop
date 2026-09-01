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
	resolveRgb,
	usedValue,
} from "interop/lib/dev/contrast";

/*
 * One sequence rather than two named bands. 1-3 are the ground and 4-6 sit on
 * it; that grouping is a spacing property of the ramp, documented beside the
 * values, not encoded in every token name.
 */
const SURFACES = [
	"surface-1",
	"surface-2",
	"surface-3",
	"surface-4",
	"surface-5",
	"surface-6",
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
	/** The one the spike ships. */
	readonly chosen?: boolean;
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
 * 0.025 gap above surface-3, so it shifts up with it, and the text tiers are
 * re-solved against the new deepest layer. The ladder runs between two fixed
 * ends, so lightness spent on the page band comes out of the top — which is
 * the trade the topGap column prices.
 */
const LAD = (page: number[], layer: number[], text: number[]): Rung[] => [
	...page.map((l, i) => ({
		label: `surface-${i + 1}`,
		band: "page" as const,
		color: `oklch(${l} 0.008 255)`,
	})),
	...layer.map((l, i) => ({
		label: `surface-${i + 4}`,
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
		chosen: true,
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

/*
 * The naming worked sample.
 *
 * Six real declarations from the shipped theme, spanning every hard case: a
 * fill that appears under text, a quiet rule, a family wash, family text, a
 * 3:1 edge, and a secondary text tier.
 *
 * The left side is the component's own token and never changes — only the
 * system token being named varies. Scoring names against adjectives is where
 * bias hides; reading them in the declarations we actually write is not.
 */
interface Scheme {
	readonly name: string;
	readonly note: string;
	readonly lines: readonly string[];
}

const SAMPLE_LHS = [
	"--itx-table-row-hover-bg",
	"--itx-content-rule-color",
	"--itx-callout-background",
	"--itx-field-error-color",
	"--itx-toast-border-color",
	"--itx-field-placeholder-color",
] as const;

const SCHEMES: readonly Scheme[] = [
	{
		name: "Today",
		note: "Family-first. tint and solid describe how a colour looks, not what it does.",
		lines: [
			"var(--itx-neutral-2)",
			"var(--itx-neutral-3)",
			"var(--itx-info-tint)",
			"var(--itx-danger-text)",
			"var(--itx-neutral-8)",
			"var(--itx-neutral-10)",
		],
	},
	{
		name: "Positional",
		note: "Numbers for everything with an order, names only for the jobs that have no position. Never lies, extends forever, needs no consensus — and says nothing on its own.",
		lines: [
			"var(--itx-fill)",
			"var(--itx-rule)",
			"var(--itx-info-3)",
			"var(--itx-danger-11)",
			"var(--itx-edge)",
			"var(--itx-neutral-9)",
		],
	},
	{
		name: "Subtle / bold",
		note: "Bootstrap and Atlassian. The plurality term for a wash. Family-first, so it sits beside the step tokens without a second shape.",
		lines: [
			"var(--itx-fill)",
			"var(--itx-divider)",
			"var(--itx-info-subtle)",
			"var(--itx-danger-text)",
			"var(--itx-border)",
			"var(--itx-text-secondary)",
		],
	},
	{
		name: "Namespaced role",
		note: "namespace · type · role · modifier. The role segment marks which vocabulary you are in — raw steps stay family-first, answers go slot-first — and makes the supported set autocompletable. Strains where a family wash needs both a family and a prominence in one modifier slot.",
		lines: [
			"var(--itx-role-background-interactive)",
			"var(--itx-role-divider)",
			"var(--itx-role-background-info-subtle)",
			"var(--itx-role-text-danger)",
			"var(--itx-role-edge)",
			"var(--itx-role-text-subtle)",
		],
	},
	{
		name: "Slot-first",
		note: "Primer and Atlassian structure. Sorts by what you are painting rather than which colour. Breaks the shape of the step tokens, which are family-first.",
		lines: [
			"var(--itx-bg-interactive)",
			"var(--itx-border-subtle)",
			"var(--itx-bg-info-subtle)",
			"var(--itx-fg-danger)",
			"var(--itx-border-default)",
			"var(--itx-fg-muted)",
		],
	},
];

/*
 * The role vocabulary under namespace · type · role · family · modifier.
 *
 * Role is the primary distinction — this is a text thing, an edge thing.
 * Family names the ramp. Modifier adjusts the base. Both trailing segments are
 * optional, which keeps the common case short and costs a little: position no
 * longer says which slot the last segment fills, because danger names a ramp
 * and subtle names a prominence. Both are small closed sets.
 *
 * Surfaces stay out of this namespace. They are written by the engine and are
 * a source rather than an override point — see .agent/color.md.
 */
interface RoleRow {
	readonly token: string;
	readonly job: string;
	readonly note?: string;
}
interface RoleGroup {
	readonly slot: string;
	readonly rows: readonly RoleRow[];
}

const VOCABULARY: readonly RoleGroup[] = [
	{
		slot: "text",
		rows: [
			{ token: "--itx-role-text", job: "primary" },
			{
				token: "--itx-role-text-{modifier}",
				job: "three tiers below primary",
				note: "the modifier words are the open question",
			},
			{ token: "--itx-role-text-{family}", job: "family text, one per family" },
			{
				token: "--itx-role-text-on-bold",
				job: "the label on a solid fill",
				note: "no family segment — one label clears every solid, worst 4.75 on info",
			},
		],
	},
	{
		slot: "background",
		rows: [
			{
				token: "--itx-role-background-interactive",
				job: "hover and selected",
				note: "derived from the surface it lands on, and shared by both states",
			},
			{ token: "--itx-role-background-{family}-subtle", job: "family wash" },
			{ token: "--itx-role-background-{family}-bold", job: "family solid" },
		],
	},
	{
		slot: "edge",
		rows: [
			{ token: "--itx-role-edge", job: "an edge that must read, 3:1" },
			{ token: "--itx-role-edge-{family}", job: "family edge" },
		],
	},
	{
		slot: "divider",
		rows: [
			{
				token: "--itx-role-divider",
				job: "a separator that must not assert itself",
				note: "no floor, so nothing to clear",
			},
		],
	},
	{
		slot: "scrim",
		rows: [
			{
				token: "--itx-role-scrim",
				job: "over arbitrary content",
				note: "the only job the palette cannot express",
			},
		],
	},
];

/** Tokens the vocabulary deliberately does NOT contain, and why. */
const RETIRED: readonly RoleRow[] = [
	{
		token: "on-tint / on-subtle",
		job: "the label on a wash",
		note: "family text already clears on the family wash — 7.10 to 8.32, every one above 7:1. Five tokens restating a guarantee the pairing already makes.",
	},
	{
		token: "on-solid, per family",
		job: "five labels for five solids",
		note: "one label clears all five. Collapses to --itx-role-text-on-bold.",
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
	protected readonly schemes = SCHEMES;
	protected readonly vocabulary = VOCABULARY;
	protected readonly retired = RETIRED;
	protected readonly sampleLhs = SAMPLE_LHS;

	/** The declaration as it would be written, padded so the values line up. */
	protected declaration(scheme: Scheme, i: number): string {
		return `${SAMPLE_LHS[i]}:`.padEnd(32) + " " + scheme.lines[i] + ";";
	}

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

	/**
	 * A translucent token composited over a named backdrop, as a colour string.
	 *
	 * Needed because resolveRgb defaults its backdrop to white. Asking for the
	 * scrim's contrast directly reports it over white rather than over the page,
	 * which reads as a confident wrong answer — 3.83 where the truth is 1.27.
	 */
	protected composite(over: string, under: string): string {
		const rgb = resolveRgb(this.value(over), this.value(under));
		return rgb ? `rgb(${rgb.join(" ")})` : "";
	}

	/** A token measured against an already-composited colour. */
	protected ratioAgainst(fg: string, backdrop: string): number {
		const f = this.value(fg);
		return f && backdrop ? contrastRatio(f, backdrop) : Number.NaN;
	}

	/**
	 * A pairing seen through a veil drawn OVER both sides.
	 *
	 * The scrim covers the content, so it composites over the text and over the
	 * page — not the other way round. Compositing opaque text over the scrim
	 * returns the text unchanged and reports no dimming at all.
	 */
	protected ratioUnder(fg: string, bg: string, veil: string): number {
		const f = this.composite(veil, fg);
		const b = this.composite(veil, bg);
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
