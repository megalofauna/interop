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
