import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	ElementRef,
	inject,
	signal,
} from "@angular/core";
import {
	InteropBadge,
	InteropButton,
	InteropCallout,
	InteropFieldInput,
	InteropPopover,
	InteropPopoverTrigger,
} from "interop";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";
import { DemoPage } from "../../components/demo-page/demo-page";
import { DemoSection } from "../../components/demo-section/demo-section";
import {
	clearsFloor,
	contrastRatio,
	effectiveBackground,
	formatRatio,
	luminanceDelta,
	measure,
	usedValue,
} from "interop/lib/dev/contrast";
import {
	PALETTE_FLOORS,
	PALETTE_RAMP,
	PALETTE_SCALES,
} from "./palette-preview";
import {
	FAMILY_FACTS,
	HUE_CEILINGS,
	HUE_SWEEP,
	INPUT_FACTS,
	LAYER_KEYS,
	RANK_FACTS,
	type FamilyFact,
	type RankFact,
} from "./ladder-facts";

@Component({
	selector: "color-page",
	standalone: true,
	imports: [
		DemoPage,
		DemoSection,
		DemoMasthead,
		InteropBadge,
		InteropButton,
		InteropCallout,
		InteropFieldInput,
		InteropPopover,
		InteropPopoverTrigger,
	],
	templateUrl: "./color-page.html",
	styleUrl: "./color-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorPage {
	/**
	 * The rank table, straight from the generator's derivation record.
	 *
	 * This used to be a hand-kept copy annotated "mirrors the RANKS table",
	 * which is a promise a comment cannot keep — a floor could move in the
	 * generator and the page would go on documenting the old one. The record is
	 * emitted by the same run that solves the ladder, so it cannot lag it.
	 */
	protected readonly ranks: readonly RankFact[] = RANK_FACTS;

	/** Layers above the page. Derived from DEPTH, so it follows the config. */
	protected readonly layers: readonly number[] = LAYER_KEYS.filter(
		(key) => !key.startsWith("n"),
	).map(Number);

	/**
	 * Step-size candidates for the dark ramp, rendered side by side.
	 *
	 * The candidates are hardcoded on purpose — the whole point is to compare
	 * the shipped ramp against ones that do not exist yet. The SHIPPED row is
	 * not: it is built from the record, so it cannot go on advertising a step
	 * size that was retuned three commits ago. It was labelled "ΔL .0375" while
	 * the generator was emitting .0395, which is exactly the drift this closes.
	 *
	 * The ceiling is not free: above roughly L .44 rank 5 cannot reach 7:1 even
	 * against pure white, so a wider step buys fewer usable layers.
	 */
	protected readonly darkCandidates = [
		{ label: "ΔL .060", steps: [0.2, 0.26, 0.32, 0.38, 0.44] },
		{ label: "ΔL .048", steps: [0.2, 0.248, 0.296, 0.344, 0.392] },
		this.shippedCandidate(),
		{ label: "ΔL .030", steps: [0.2, 0.23, 0.26, 0.29, 0.32] },
	];

	/** The dark ramp as actually shipped, read back out of the record. */
	private shippedCandidate(): { label: string; steps: number[] } {
		const { page, up, ease, max } = INPUT_FACTS.ramp["dark"];
		const steps = [page];
		let l = page;
		let step = up;
		for (let i = 0; i < this.layers.length - 1; i++) {
			l = Math.min(max, l + step);
			steps.push(Math.round(l * 1000) / 1000);
			step *= ease;
		}
		const drift = ease === 1 ? "" : ` easing ${ease}`;
		return {
			label: `ΔL ${up.toFixed(4).replace(/^0/, "")}${drift} — shipped`,
			steps,
		};
	}

	protected swatch(l: number): string {
		return `oklch(${l} 0.006 250)`;
	}

	/**
	 * Every seeded family, from the record rather than a hand-kept list.
	 *
	 * The old copy quoted "#0066CC" for the colourway. That seed is now Jelly
	 * Bean, and a page that documents the seed has to be told when the seed
	 * changes — so it is not told, it is generated.
	 */
	protected readonly families: readonly FamilyFact[] = FAMILY_FACTS.filter(
		(f) => f.variant === "default" || f.variant === "seventies",
	);

	/** The two colourways, side by side, to prove a switch leaves nothing behind. */
	protected readonly colorways: readonly FamilyFact[] = FAMILY_FACTS.filter(
		(f) => f.role === "colorway",
	);

	/** The status used for the depth comparison. One variable at a time. */
	protected readonly depthStatus = "danger";

	/**
	 * Rest, hover and active for one family, as three swatches side by side.
	 *
	 * States are stepped AWAY from the label, which means the direction is not a
	 * constant: a fill with a light label darkens, a fill with a dark label
	 * lightens. Jelly Bean and Cream Can sit adjacent here precisely so that flip
	 * is something you see rather than something you are told.
	 */
	protected readonly solidStates = ["solid", "solid-hover", "solid-active"];

	/* ── 12-step preview ─────────────────────────────────────────────────── */

	/**
	 * A proposed palette, rendered but not shipped.
	 *
	 * Nothing here is a token, and nothing here was positioned by a contrast
	 * target. The steps are evenly spaced in OKLCH lightness — a ramp, which is
	 * what a palette is — and the contrast guidance below was measured off them
	 * afterwards rather than designed into them.
	 */
	protected readonly previewScales = PALETTE_SCALES;
	protected readonly previewFloors = PALETTE_FLOORS;
	protected readonly previewRamp = PALETTE_RAMP;

	/** Even spacing, stated once: what the ramp actually steps by. */
	protected readonly previewDelta =
		Math.round(
			((PALETTE_RAMP.lightest - PALETTE_RAMP.darkest) /
				(PALETTE_SCALES[0].steps.length - 1)) *
				1000,
		) / 1000;

	/** One swatch. No light-dark(): a palette is a ramp, not a scheme pair. */
	protected previewColor(scaleId: string, step: number): string {
		const scale = PALETTE_SCALES.find((s) => s.id === scaleId);
		const s = scale?.steps.find((x) => x.step === step);
		return s ? `oklch(${s.l} ${s.c} ${scale!.hue})` : "transparent";
	}

	/** Whether the offset rule holds for every pair at this floor. */
	protected previewOffset(scaleId: string, floorId: string): string {
		const o = PALETTE_SCALES.find((s) => s.id === scaleId)?.offsets[floorId];
		return o?.offset == null ? "—" : `${o.offset} steps`;
	}

	/**
	 * The offsets, if every scale agrees. They do, which is the finding: an even
	 * ramp gives one rule for every hue rather than a table per family.
	 */
	protected sharedOffset(floorId: string): number | null {
		const all = PALETTE_SCALES.map((s) => s.offsets[floorId]?.offset ?? null);
		return all.every((v) => v !== null && v === all[0]) ? all[0] : null;
	}

	/* ── Palette boards ──────────────────────────────────────────────────── */

	/**
	 * Every layer, deepest sink first — the same order the generator emits.
	 *
	 * The palette is a grid rather than a strip because that is what it is: a
	 * rank is a contrast target against its own surface, so "contrast 4" is a
	 * different colour on every layer. A flat swatch row would have to pick one
	 * and imply the rest.
	 */
	protected readonly paletteLayers: readonly string[] = LAYER_KEYS;

	/** Neutral columns: the substrate, then everything drawn on it. */
	protected readonly neutralColumns = [
		{ token: "--itx-surface", label: "surface" },
		...RANK_FACTS.map((r) => ({
			token: `--itx-contrast-${r.rank}`,
			label: `contrast-${r.rank}`,
		})),
	];

	/** Colourway columns — the roles that re-solve against their layer. */
	protected readonly colorwayColumns = [
		{ token: "--itx-colorway-tint", label: "tint" },
		{ token: "--itx-colorway-on-tint", label: "on-tint" },
		{ token: "--itx-colorway-border", label: "border" },
		{ token: "--itx-colorway-text", label: "text" },
	];

	/** The four that do not move: a brand colour that drifts is not one. */
	protected readonly colorwayFixed = [
		{ token: "--itx-colorway-solid", label: "solid" },
		{ token: "--itx-colorway-on-solid", label: "on-solid" },
		{ token: "--itx-colorway-solid-hover", label: "solid-hover" },
		{ token: "--itx-colorway-solid-active", label: "solid-active" },
	];

	/** A layer key as it reads in the engine: n2 is two sinks below the page. */
	protected layerLabel(key: string): string {
		return key.startsWith("n") ? `−${key.slice(1)}` : key;
	}

	/* ── The gamut envelope ──────────────────────────────────────────────── */

	protected readonly ceilings = HUE_CEILINGS;
	protected readonly defaultSeedChroma = HUE_SWEEP.seedC;

	/** The hues a default-strength seed cannot have, because sRGB has not got them. */
	protected readonly clampedHues = HUE_CEILINGS.filter(
		(entry) => entry.peakChroma < HUE_SWEEP.seedC,
	);

	protected readonly lowestCeiling = HUE_CEILINGS.reduce((low, entry) =>
		entry.peakChroma < low.peakChroma ? entry : low,
	);

	/** Chroma .34 gives the curve headroom without flattening it against the top. */
	private readonly gamutScale = 200 / 0.34;

	/** The envelope as SVG points: hue across, peak chroma up. */
	protected readonly ceilingPoints = HUE_CEILINGS.map(
		(entry) =>
			`${(entry.hue / 360) * 720},${200 - entry.peakChroma * this.gamutScale}`,
	).join(" ");

	protected readonly seedLine = 200 - HUE_SWEEP.seedC * this.gamutScale;

	/** "solid" reads as a state name only once you drop the prefix. */
	protected stateLabel(state: string): string {
		return state === "solid" ? "rest" : state.replace("solid-", "");
	}

	/** A seed, written the way the generator holds it. */
	protected seedOf(family: FamilyFact): string {
		const { l, c, h } = family.seed;
		return `oklch(${l} ${c} ${h})`;
	}

	/** Display name: the human one where the seed has it, else the family id. */
	protected labelOf(family: FamilyFact): string {
		return family.name ?? family.id;
	}

	/* ── Measurement ─────────────────────────────────────────────────────── */

	private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

	/** Measured ratios and signed deltas, keyed by the probe's data-measure id. */
	private readonly readings = signal<ReadonlyMap<string, number>>(new Map());

	constructor() {
		afterNextRender(() => {
			this.remeasure();

			// Every measurement is scheme-dependent, and the toggle changes the
			// scheme by setting an attribute rather than navigating — so nothing
			// would otherwise tell this page its numbers just went stale.
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

	private cleanup: (() => void) | null = null;

	/**
	 * Read every probe in the page and record what it actually measures.
	 *
	 * Deferred a frame: the scheme switch swaps custom-property values, and
	 * measuring in the mutation callback can catch the old computed values.
	 */
	/** Resolved colour per swatch, keyed by its data-swatch id. */
	private readonly swatches = signal<ReadonlyMap<string, string>>(new Map());

	/**
	 * The colour a swatch actually resolved to, as the browser reports it.
	 *
	 * Read rather than derived: a palette sample that printed the numbers the
	 * generator emitted would be a picture of the generator, not of the page.
	 * Every value here came back out of a painted element.
	 */
	protected swatchColor(key: string): string {
		return this.swatches().get(key) ?? "";
	}

	private remeasure(): void {
		requestAnimationFrame(() => {
			const colours = new Map<string, string>();
			for (const el of Array.from(
				this.host.nativeElement.querySelectorAll<HTMLElement>("[data-swatch]"),
			)) {
				const key = el.dataset["swatch"];
				if (key) colours.set(key, usedValue(el, "background-color"));
			}
			this.swatches.set(colours);

			const next = new Map<string, number>();
			const probes = Array.from(
				this.host.nativeElement.querySelectorAll<HTMLElement>("[data-measure]"),
			);

			for (const el of probes) {
				const key = el.dataset["measure"];
				if (!key) continue;
				const property = el.dataset["measureProp"] ?? "color";
				const mode = el.dataset["measureMode"] ?? "ratio";

				if (mode === "delta") {
					// Against the surface OUTSIDE the probe, which is the surface the
					// role was solved against — not the probe's own fill.
					const parent = el.parentElement;
					next.set(
						key,
						parent
							? luminanceDelta(
									usedValue(el, property),
									effectiveBackground(parent),
								)
							: Number.NaN,
					);
				} else if (mode === "outward") {
					const parent = el.parentElement;
					next.set(
						key,
						parent
							? this.ratioAgainst(usedValue(el, property), parent)
							: Number.NaN,
					);
				} else {
					next.set(key, measure(el, property));
				}
			}
			this.readings.set(next);
		});
	}

	/**
	 * A role measured against the surface OUTSIDE the element carrying it.
	 *
	 * The callout's accent rule is a border on the callout itself, but `border`
	 * is solved against the surface the callout sits on — so measuring it
	 * against the callout's own tint would grade it on the wrong question.
	 */
	private ratioAgainst(color: string, against: Element): number {
		return contrastRatio(color, effectiveBackground(against));
	}

	/** A measured ratio, formatted. Renders "—" rather than a number if unread. */
	protected reading(key: string): string {
		return formatRatio(this.readings().get(key) ?? Number.NaN);
	}

	/** A measured signed delta, formatted with its sign kept. */
	protected delta(key: string): string {
		const value = this.readings().get(key);
		return value === undefined || !Number.isFinite(value)
			? "—"
			: `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(3)}`;
	}

	/** Whether a measured reading clears a floor. Drives the pass/fail marker. */
	protected passes(key: string, floor: number): boolean {
		return clearsFloor(this.readings().get(key) ?? Number.NaN, floor);
	}

	/**
	 * Whether a wash still leans the way its scheme intends.
	 *
	 * There is no fixed correct sign, which is the trap: contrast moves away
	 * from the surface, so a wash is LIGHTER than its surface in dark and DARKER
	 * in light. Comparing against a hardcoded direction marks every light-scheme
	 * tint as broken. So the reference is the neutral wash — rank 1, measured in
	 * the same layer, in whatever scheme is live. A status tint is doing its job
	 * when it leans the same way that does.
	 */
	protected leansWithScheme(tintKey: string, washKey: string): boolean {
		const tint = this.readings().get(tintKey);
		const wash = this.readings().get(washKey);
		if (tint === undefined || wash === undefined) return true;
		if (!Number.isFinite(tint) || !Number.isFinite(wash)) return true;
		return Math.sign(tint) === Math.sign(wash);
	}
}
