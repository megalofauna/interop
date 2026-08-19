import { ChangeDetectionStrategy, Component } from "@angular/core";
import {
	InteropButton,
	InteropFieldInput,
	InteropPopover,
	InteropPopoverTrigger,
} from "interop";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";
import { DemoPage } from "../../components/demo-page/demo-page";
import { DemoSection } from "../../components/demo-section/demo-section";
import {
	INPUT_FACTS,
	LAYER_KEYS,
	RANK_FACTS,
	type RankFact,
} from "./ladder-facts";

@Component({
	selector: "color-page",
	standalone: true,
	imports: [
		DemoPage,
		DemoSection,
		DemoMasthead,
		InteropButton,
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

	/** Every seeded family, in the order the generator reports them. */
	protected readonly families = [
		{ id: "colorway", label: "Colourway", seed: "#0066CC" },
		{ id: "danger", label: "Danger", seed: "oklch(.50 .105 33)" },
		{ id: "info", label: "Info", seed: "oklch(.53 .058 218)" },
		{ id: "success", label: "Success", seed: "oklch(.53 .078 122)" },
		{ id: "warning", label: "Warning", seed: "oklch(.62 .105 78)" },
	];

	/** The roles that re-derive against whatever surface they land on. */
	protected readonly accentRoles = ["tint", "border", "text"];

	/** Shown side by side to prove a colourway switch leaves nothing behind. */
	protected readonly colorways = [
		{ id: "", label: "Default — blue" },
		{ id: "amber", label: "Amber" },
	];
}
