import {
	Component,
	DestroyRef,
	ElementRef,
	afterNextRender,
	inject,
	signal,
	viewChild,
} from "@angular/core";
import { bindRadioHomeEnd } from "interop";
import { InteropBadge } from "interop/badge";
import { InteropCodeBlock } from "interop/code-block";
import { InteropIcon } from "interop/icon";
import { InteropSegmentedFit } from "interop/radio-group";
import { examples } from "./segmented-control-examples";

@Component({
	selector: "demo-segmented-control",
	host: { "itx-flow": "" },
	imports: [InteropBadge, InteropCodeBlock, InteropIcon, InteropSegmentedFit],
	templateUrl: "./segmented-control-demo.html",
	styleUrl: "./segmented-control-demo.css",
})
export class SegmentedControlDemo {
	protected readonly examples = examples;
	protected readonly view = signal("grid");
	private readonly homeEnd =
		viewChild.required<ElementRef<HTMLFieldSetElement>>("homeEnd");

	constructor() {
		const destroyRef = inject(DestroyRef);
		afterNextRender(() =>
			destroyRef.onDestroy(bindRadioHomeEnd(this.homeEnd().nativeElement)),
		);
	}
}
