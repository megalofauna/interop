import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	computed,
	DestroyRef,
	ElementRef,
	inject,
	signal,
} from "@angular/core";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";
import { DemoPage } from "../../components/demo-page/demo-page";
import { DemoSection } from "../../components/demo-section/demo-section";
import {
	contrastRatio,
	formatRatio,
	usedValue,
} from "interop/lib/dev/contrast";

/** One sequence of six. 1 to 3 are the ground, 4 to 6 sit on it. */
const SURFACES = [1, 2, 3, 4, 5, 6] as const;

/** The depth engine indexes the sequence; it never lands on 1, 3 or 6. */
const DEPTH_MAP: Readonly<Record<number, number>> = { 0: 2, 1: 4, 2: 5 };
const LAYERS = [0, 1, 2] as const;

/**
 * What a component can paint under text: the bare surface, or one of the two
 * derived fills. Both fills come from --itx-surface, so they only appear on
 * the surfaces depth assigns.
 */
const BACKDROPS = [
	{ id: "bare", label: "bare" },
	{ id: "interactive", label: "+ interactive" },
	{ id: "control", label: "+ control" },
] as const;

const TEXT_ROLES = [
	{ token: "--itx-role-text", label: "text", floor: 7, job: "body copy" },
	{
		token: "--itx-role-text-quiet",
		label: "text-quiet",
		floor: 7,
		job: "the 7:1 tier",
	},
	{
		token: "--itx-role-text-quieter",
		label: "text-quieter",
		floor: 4.5,
		job: "the 4.5:1 tier",
	},
	{
		token: "--itx-role-text-disabled",
		label: "text-disabled",
		floor: 3,
		job: "the 3:1 tier",
	},
] as const;

const BORDER_ROLES = [
	{ token: "--itx-role-edge", label: "edge", floor: 3 },
	{ token: "--itx-role-divider", label: "divider", floor: 0 },
] as const;

interface Family {
	readonly id: string;
	readonly label: string;
	readonly hue: number;
}

const FAMILIES: readonly Family[] = [
	{ id: "colorway", label: "Colourway", hue: 264 },
	{ id: "danger", label: "Danger", hue: 33 },
	{ id: "warning", label: "Warning", hue: 78 },
	{ id: "success", label: "Success", hue: 122 },
	{ id: "info", label: "Info", hue: 218 },
];

/** The vocabulary, grouped the way it is written. */
const VOCABULARY = [
	{
		slot: "text",
		rows: [
			{ token: "--itx-role-text", job: "body copy" },
			{ token: "--itx-role-text-quiet", job: "the 7:1 tier" },
			{ token: "--itx-role-text-quieter", job: "the 4.5:1 tier" },
			{ token: "--itx-role-text-disabled", job: "the 3:1 tier" },
			{ token: "--itx-role-text-{family}", job: "family text" },
			{ token: "--itx-role-text-inverse", job: "the label on a family fill" },
		],
	},
	{
		slot: "background",
		rows: [
			{ token: "--itx-role-background-interactive", job: "hover and selected" },
			{
				token: "--itx-role-background-control",
				job: "a filled control's own plane",
			},
			{ token: "--itx-role-background-{family}", job: "the family fill" },
			{
				token: "--itx-role-background-{family}-subtle",
				job: "the family wash",
			},
		],
	},
	{
		slot: "edge",
		rows: [
			{ token: "--itx-role-edge", job: "an edge that must read, 3:1" },
			{ token: "--itx-role-edge-{family}", job: "family edge" },
			{
				token: "--itx-role-divider",
				job: "a separator that must not assert itself",
			},
		],
	},
	{
		slot: "scrim",
		rows: [{ token: "--itx-role-scrim", job: "over arbitrary content" }],
	},
] as const;

@Component({
	selector: "color-page",
	standalone: true,
	imports: [DemoPage, DemoSection, DemoMasthead],
	templateUrl: "./color-page.html",
	styleUrl: "./color-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorPage {
	protected readonly surfaceNumbers = SURFACES;
	protected readonly layers = LAYERS;
	protected readonly backdrops = BACKDROPS;
	protected readonly textRoles = TEXT_ROLES;
	protected readonly borderRoles = BORDER_ROLES;
	protected readonly families = FAMILIES;
	protected readonly vocabulary = VOCABULARY;
	protected readonly depthMap = DEPTH_MAP;

	protected readonly scheme = signal<"light" | "dark">("dark");
	protected readonly formatRatio = formatRatio;

	/** Every probe's resolved colour, keyed by its data-probe attribute. */
	private readonly probes = signal<ReadonlyMap<string, string>>(new Map());

	protected value(key: string): string {
		return this.probes().get(key) ?? "";
	}

	protected ratio(fgKey: string, bgKey: string): number {
		const fg = this.value(fgKey);
		const bg = this.value(bgKey);
		return fg && bg ? contrastRatio(fg, bg) : Number.NaN;
	}

	/** Which backdrops exist on a surface: fills only land where depth does. */
	protected backdropsFor(n: number): readonly (typeof BACKDROPS)[number][] {
		const filled = Object.values(DEPTH_MAP).includes(n);
		return filled ? BACKDROPS : BACKDROPS.slice(0, 1);
	}

	protected clears(ratio: number, floor: number): boolean {
		return !floor || (!Number.isNaN(ratio) && ratio >= floor);
	}

	/**
	 * The text reading with the least room above its floor.
	 *
	 * Ranked by slack rather than by ratio: a 3.1 against a 3 floor is tighter
	 * than a 7.2 against a 7, and the ratio alone would say the opposite.
	 */
	protected readonly tightestText = computed(() => {
		let worst: {
			slack: number;
			ratio: number;
			floor: number;
			label: string;
		} | null = null;
		for (const n of SURFACES)
			for (const b of this.backdropsFor(n))
				for (const role of TEXT_ROLES) {
					const ratio = this.ratio(role.label, `bg-${n}-${b.id}`);
					if (Number.isNaN(ratio)) continue;
					const slack = ratio - role.floor;
					if (!worst || slack < worst.slack)
						worst = {
							slack,
							ratio,
							floor: role.floor,
							label: `${role.label} on surface-${n} ${b.label}`,
						};
				}
		return worst;
	});

	/** How far the divider drifts across every background it can land on. */
	protected readonly dividerSpread = computed(() => {
		const readings: number[] = [];
		for (const n of SURFACES)
			for (const b of this.backdropsFor(n)) {
				const r = this.ratio("divider", `bg-${n}-${b.id}`);
				if (!Number.isNaN(r)) readings.push(r);
			}
		if (!readings.length) return null;
		return { lo: Math.min(...readings), hi: Math.max(...readings) };
	});

	/* ── Measurement ─────────────────────────────────────────────────────── */

	private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
	private cleanup: (() => void) | null = null;

	constructor() {
		afterNextRender(() => {
			this.remeasure();

			// The theme toggle sets an attribute rather than navigating, so nothing
			// else tells this page its numbers went stale.
			const root = document.querySelector("[interop-root]");
			const observer = new MutationObserver(() => this.remeasure());
			if (root)
				observer.observe(root, {
					attributes: true,
					attributeFilter: ["itx-theme"],
				});
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

	private readScheme(): "light" | "dark" {
		const root = document.querySelector("[interop-root]");
		const declared = root
			? getComputedStyle(root).colorScheme.trim()
			: "light dark";
		if (declared === "dark" || declared === "light") return declared;
		return matchMedia("(prefers-color-scheme: dark)").matches
			? "dark"
			: "light";
	}

	/**
	 * Deferred a frame: a scheme switch swaps custom-property values, and reading
	 * in the same frame returns the outgoing ones.
	 */
	private remeasure(): void {
		this.scheme.set(this.readScheme());
		requestAnimationFrame(() => {
			const next = new Map<string, string>();
			for (const el of Array.from(
				this.host.nativeElement.querySelectorAll<HTMLElement>("[data-probe]"),
			)) {
				const key = el.dataset["probe"];
				if (key) next.set(key, usedValue(el, "background-color"));
			}
			this.probes.set(next);
		});
	}
}
