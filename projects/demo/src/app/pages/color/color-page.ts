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
import { InteropButton } from "interop";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";
import { DemoPage } from "../../components/demo-page/demo-page";
import { DemoSection } from "../../components/demo-section/demo-section";
import {
	contrastRatio,
	effectiveBackground,
	formatRatio,
	usedValue,
} from "interop/lib/dev/contrast";

/** A family and the token prefix its steps use. */
interface Family {
	readonly id: string;
	readonly label: string;
}

/** A step, with what it measures against the chosen background. */
interface Step {
	readonly n: number;
	readonly token: string;
	readonly color: string;
	readonly ratio: number;
	readonly clears: 3 | 4.5 | 7 | 0;
}

/** A role, the step it resolves to, and what it measures. */
interface Role {
	readonly token: string;
	readonly step: number | null;
	readonly ratio: number;
}

const FAMILIES: readonly Family[] = [
	{ id: "neutral", label: "Neutral" },
	{ id: "colorway", label: "Colourway" },
	{ id: "danger", label: "Danger" },
	{ id: "success", label: "Success" },
	{ id: "warning", label: "Warning" },
	{ id: "info", label: "Info" },
];

const STEPS = Array.from({ length: 14 }, (_, i) => i + 1);

/** Backgrounds a step is read against. Step 1 is the page; step 3 is a tint. */
const BACKGROUNDS = [1, 3] as const;

const ROLES = ["tint", "on-tint", "border", "text"] as const;

/*
 * Neutral has steps but no roles. Roles name a family's accent jobs, and the
 * neutral family is the substrate those accents are read against.
 */
const ROLE_FAMILIES: readonly Family[] = FAMILIES.filter(
	(f) => f.id !== "neutral",
);

/** The layers the engine reaches. */
const LAYERS = [0, 1, 2] as const;

@Component({
	selector: "color-page",
	standalone: true,
	imports: [DemoPage, DemoSection, DemoMasthead, InteropButton],
	templateUrl: "./color-page.html",
	styleUrl: "./color-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorPage {
	protected readonly families = FAMILIES;
	protected readonly steps = STEPS;
	protected readonly backgrounds = BACKGROUNDS;
	protected readonly layers = LAYERS;
	protected readonly roles = ROLES;
	protected readonly roleFamilies = ROLE_FAMILIES;

	/** Which step the floor board measures against. */
	protected readonly background = signal<number>(1);

	protected readonly scheme = signal<"light" | "dark">("dark");

	/** Every step's resolved colour, keyed `family-n`. Measured, not tabulated. */
	private readonly colors = signal<ReadonlyMap<string, string>>(new Map());

	/** Every role's resolved colour, keyed `family-role`. */
	private readonly roleColors = signal<ReadonlyMap<string, string>>(new Map());

	/** Each surface's resolved colour, keyed by layer. */
	protected readonly surfaces = signal<ReadonlyMap<number, string>>(new Map());

	/** Role ratios at each layer, keyed `family-role-layer`. */
	private readonly atDepth = signal<ReadonlyMap<string, number>>(new Map());

	protected readonly formatRatio = formatRatio;

	protected color(family: string, n: number): string {
		return this.colors().get(`${family}-${n}`) ?? "";
	}

	/**
	 * A family's steps against the chosen background, with the highest floor
	 * each one clears.
	 */
	protected board(family: string): readonly Step[] {
		const bg = this.color(family, this.background());
		return STEPS.map((n) => {
			const color = this.color(family, n);
			const ratio = bg && color ? contrastRatio(color, bg) : 0;
			return {
				n,
				token: `--itx-${family}-${n}`,
				color,
				ratio,
				clears: ratio >= 7 ? 7 : ratio >= 4.5 ? 4.5 : ratio >= 3 ? 3 : 0,
			} satisfies Step;
		});
	}

	/**
	 * A family's roles, each matched back to the step it resolves to.
	 *
	 * Matching by colour rather than reading the declaration means the table
	 * shows where the role actually lands.
	 */
	protected roleTable(family: string): readonly Role[] {
		const page = this.color(family, 1);
		return ROLES.map((role) => {
			const color = this.roleColors().get(`${family}-${role}`) ?? "";
			const step = STEPS.find((n) => this.color(family, n) === color) ?? null;
			const against = role === "on-tint" ? this.color(family, 3) : page;
			return {
				token: `--itx-${family}-${role}`,
				step,
				ratio: color && against ? contrastRatio(color, against) : 0,
			} satisfies Role;
		});
	}

	/** The border role measured at every layer, which is what sets its step. */
	protected depth(family: string, role: string, layer: number): number {
		return this.atDepth().get(`${family}-${role}-${layer}`) ?? 0;
	}

	/** The tightest border reading at the deepest layer, across families. */
	protected readonly tightest = computed(() => {
		const readings = ROLE_FAMILIES.map((f) =>
			this.depth(f.id, "border", 2),
		).filter((r) => r > 0);
		return readings.length ? Math.min(...readings) : 0;
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
			const host = this.host.nativeElement;

			const colors = new Map<string, string>();
			for (const el of Array.from(
				host.querySelectorAll<HTMLElement>("[data-step]"),
			)) {
				const key = el.dataset["step"];
				if (key) colors.set(key, usedValue(el, "background-color"));
			}
			this.colors.set(colors);

			const roleColors = new Map<string, string>();
			for (const el of Array.from(
				host.querySelectorAll<HTMLElement>("[data-role]"),
			)) {
				const key = el.dataset["role"];
				if (key) roleColors.set(key, usedValue(el, "background-color"));
			}
			this.roleColors.set(roleColors);

			const surfaces = new Map<number, string>();
			for (const el of Array.from(
				host.querySelectorAll<HTMLElement>("[data-surface]"),
			)) {
				const layer = Number(el.dataset["surface"]);
				surfaces.set(layer, usedValue(el, "background-color"));
			}
			this.surfaces.set(surfaces);

			// Roles at depth. The probe paints its own role colour, so the surface
			// has to come from its parent — and via effectiveBackground, because a
			// layer-0 container does not paint and the page above it does.
			const depths = new Map<string, number>();
			for (const el of Array.from(
				host.querySelectorAll<HTMLElement>("[data-depth]"),
			)) {
				const key = el.dataset["depth"];
				const parent = el.parentElement;
				if (!key || !parent) continue;
				depths.set(
					key,
					contrastRatio(
						usedValue(el, "background-color"),
						effectiveBackground(parent),
					),
				);
			}
			this.atDepth.set(depths);
		});
	}
}
