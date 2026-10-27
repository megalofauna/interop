import {
	Component,
	ElementRef,
	ViewEncapsulation,
	afterNextRender,
	inject,
	signal,
} from "@angular/core";
import { bindSlider } from "interop";

/** Candidate looks for the slider and the progress bar. Listed under Labs in the nav. */
@Component({
	selector: "demo-track-lab",
	host: {
		"itx-flow": "",
		class: "track-lab",
		"[attr.data-track]": "track()",
		"[attr.data-thumb]": "thumb()",
		"[attr.data-lift]": "lift()",
		"[attr.data-ends]": "ends()",
		"[attr.data-press]": "press()",
	},
	templateUrl: "./track-lab.html",
	styleUrl: "./track-lab.css",
	encapsulation: ViewEncapsulation.None,
})
export class TrackLab {
	protected readonly track = signal("shaded");
	protected readonly thumb = signal("knob");
	protected readonly lift = signal("on");
	protected readonly ends = signal("round");
	protected readonly press = signal("grow");
	protected readonly progress = signal(40);

	protected readonly schemes = ["light", "dark"];
	protected readonly surfaces = ["Page", "Panel"];
	protected readonly sizes = ["sm", "md", "lg"];

	constructor() {
		const host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
		afterNextRender(() => {
			for (const input of host.querySelectorAll<HTMLInputElement>(
				"input[lab-slider]",
			))
				bindSlider(input);
		});
	}

	protected set(
		dial: "track" | "thumb" | "lift" | "ends" | "press",
		event: Event,
	) {
		this[dial].set((event.target as HTMLInputElement).value);
	}

	protected step() {
		this.progress.update((value) => (value >= 100 ? 0 : value + 20));
	}
}
