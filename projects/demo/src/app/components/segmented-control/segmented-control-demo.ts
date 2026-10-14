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
import { InteropIcon } from "interop/icon";

@Component({
	selector: "demo-segmented-control",
	imports: [InteropIcon],
	templateUrl: "./segmented-control-demo.html",
	styleUrl: "./segmented-control-demo.css",
})
export class SegmentedControlDemo {
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
