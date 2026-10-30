import {
	Component,
	ElementRef,
	ViewEncapsulation,
	afterRenderEffect,
	inject,
	signal,
} from "@angular/core";

type Dial = "fill" | "tint" | "text" | "type" | "pad" | "height" | "weight";

interface Reading {
	scheme: string;
	status: string;
	text: number;
	border: number | null;
}

/** Candidate looks for the badge. Listed under Labs in the nav. */
@Component({
	selector: "demo-badge-lab",
	host: {
		"itx-flow": "",
		class: "badge-lab",
		"[attr.data-fill]": "fill()",
		"[attr.data-tint]": "tint()",
		"[attr.data-text]": "text()",
		"[attr.data-type]": "type()",
		"[attr.data-pad]": "pad()",
		"[attr.data-height]": "height()",
		"[attr.data-weight]": "weight()",
	},
	templateUrl: "./badge-lab.html",
	styleUrl: "./badge-lab.css",
	encapsulation: ViewEncapsulation.None,
})
export class BadgeLab {
	protected readonly fill = signal("tinted");
	protected readonly tint = signal("12");
	protected readonly text = signal("readable");
	protected readonly type = signal("current");
	protected readonly pad = signal("roomy");
	protected readonly height = signal("taller");
	protected readonly weight = signal("400");

	protected readonly schemes = ["light", "dark"];
	protected readonly surfaces = ["Page", "Panel"];
	protected readonly sizes = ["sm", "md", "lg"];
	protected readonly statuses = ["", "info", "success", "warning", "danger"];
	protected readonly words: Record<string, string> = {
		"": "Draft",
		info: "Beta",
		success: "Operational",
		warning: "Degraded",
		danger: "Outage",
	};

	protected readonly readings = signal<Reading[]>([]);

	constructor() {
		const host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
		afterRenderEffect(() => {
			// Read every dial, so a change measures again.
			[
				this.fill(),
				this.tint(),
				this.text(),
				this.type(),
				this.pad(),
				this.height(),
				this.weight(),
			];
			requestAnimationFrame(() => this.readings.set(measure(host)));
		});
	}

	protected set(dial: Dial, event: Event) {
		this[dial].set((event.target as HTMLInputElement).value);
	}

	protected ratio(value: number | null, minimum: number) {
		return value === null
			? "—"
			: `${value.toFixed(2)}${value < minimum ? " ✗" : ""}`;
	}
}

/** Text against the badge's background, and the border against the page, for each md badge on the page. */
function measure(host: HTMLElement): Reading[] {
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = 1;
	const context = canvas.getContext("2d", { willReadFrequently: true })!;
	/** Paints the colors in order, the first opaque, and reads the result back as sRGB. */
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
		host.querySelectorAll<HTMLElement>("[data-measure]"),
		(badge) => {
			const style = getComputedStyle(badge);
			const page = getComputedStyle(badge.closest(".scheme")!).backgroundColor;
			const background = paint(page, style.backgroundColor);
			const border =
				parseFloat(style.borderTopWidth) > 0
					? contrast(paint(page, style.borderTopColor), paint(page))
					: null;
			return {
				scheme: badge.closest(".scheme")!.classList.contains("dark")
					? "dark"
					: "light",
				status: badge.getAttribute("itx-color") || "neutral",
				text: contrast(
					paint(page, style.backgroundColor, style.color),
					background,
				),
				border,
			};
		},
	);
}
