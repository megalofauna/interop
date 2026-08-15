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

interface RankEntry {
	readonly rank: number;
	readonly intent: string;
	readonly floor: string;
}

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
	/** Mirrors the RANKS table in scripts/generate-color-ladder.mjs. */
	protected readonly ranks: readonly RankEntry[] = [
		{ rank: 1, intent: "Wash — hover fills, stripes, selected tints", floor: "perceptible (≥ 0.02 L)" },
		{ rank: 2, intent: "Hairline, dividers", floor: "1.5:1" },
		{ rank: 3, intent: "Border, emphasis edge", floor: "3:1" },
		{ rank: 4, intent: "Secondary text", floor: "4.5:1" },
		{ rank: 5, intent: "Body text", floor: "7:1" },
		{ rank: 6, intent: "Maximum", floor: "as far as the scheme allows" },
	];

	protected readonly layers = [0, 1, 2, 3, 4];

	/**
	 * Step-size candidates for the dark ramp, rendered side by side.
	 *
	 * Hardcoded rather than read from the tokens on purpose: the whole point is
	 * to compare the shipped ramp against ones that do not exist yet. Whichever
	 * wins gets typed into SURFACES in scripts/generate-color-ladder.mjs, which
	 * then re-solves every contrast rank against it.
	 *
	 * The ceiling is not free: above roughly L .44 rank 5 cannot reach 7:1 even
	 * against pure white, so a wider step buys fewer usable layers.
	 */
	protected readonly darkCandidates = [
		{ label: "ΔL .060", steps: [0.2, 0.26, 0.32, 0.38, 0.44] },
		{ label: "ΔL .048", steps: [0.2, 0.248, 0.296, 0.344, 0.392] },
		{ label: "ΔL .0375 — shipped", steps: [0.2, 0.238, 0.275, 0.313, 0.35] },
		{ label: "ΔL .030", steps: [0.2, 0.23, 0.26, 0.29, 0.32] },
	];

	protected swatch(l: number): string {
		return `oklch(${l} 0.006 250)`;
	}
}
