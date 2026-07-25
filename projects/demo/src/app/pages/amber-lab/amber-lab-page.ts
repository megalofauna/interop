import { ChangeDetectionStrategy, Component } from "@angular/core";
import { DemoPage } from "../../components/demo-page/demo-page";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";
import { DemoSection } from "../../components/demo-section/demo-section";

interface Strategy {
	key: string;
	klass: string;
	label: string;
	blurb: string;
}

@Component({
	selector: "amber-lab-page",
	standalone: true,
	imports: [DemoPage, DemoMasthead, DemoSection],
	templateUrl: "./amber-lab-page.html",
	styleUrl: "./amber-lab-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AmberLabPage {
	readonly modes = ["light", "dark"] as const;

	readonly roles = [
		"bg-subtle",
		"bg-muted",
		"bg-bold",
		"border-muted",
		"border-bold",
		"text",
		"on-bold",
	];

	readonly strategies: Strategy[] = [
		{
			key: "contrast",
			klass: "strat-contrast",
			label: "Strategy 2 — Contrast-anchored",
			blurb:
				"Each role is solved for a target WCAG contrast against the surface, per mode, in-gamut. Every role does its job in both modes — bg-bold is the same vivid orange light and dark, so the dark-mode mud is gone — but the colors are whatever contrast demands, so light-mode text is a barely-amber dark brown.",
		},
		{
			key: "anchor",
			klass: "strat-anchor",
			label: "Strategy 3 — Anchor-and-mix",
			blurb:
				"One brand anchor mixed toward the mode's surface at fixed ratios. Harmonious, identity-consistent tints and a bold that keeps one identity across modes — but contrast isn't guaranteed: light-mode text lands ~2.68:1 (fails AA) and bold borders go faint. Shown unpatched so the model's weakness is visible.",
		},
		{
			key: "floored",
			klass: "strat-floored",
			label: "Strategy 4 — Anchor-mix + contrast floor",
			blurb:
				"Strategy 3's mix, then each role pushed away from the surface only as far as its contrast target needs — no further, chroma kept as high as the new lightness allows. Keeps S3's identity wherever it was already legible (backgrounds, dark-mode text verbatim), nudged only where it failed: light-mode text becomes #512500 (AA 4.5:1) yet stays amber, and bold borders regain their edge. The synthesis.",
		},
	];

	swatchBg(role: string): string {
		return `var(--r-${role})`;
	}
}
