import {
	Component,
	DestroyRef,
	ElementRef,
	afterNextRender,
	computed,
	inject,
	signal,
	viewChild,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { bindSelectAll } from "interop";
import { InteropCodeBlock } from "interop/code-block";
import { DemoExample } from "../../example/example";
import { region } from "../../example/region";
import template from "./checkbox-demo.html";
import disabled from "./examples/disabled.html";
import group from "./examples/group.html";
import heavyCss from "./examples/heavy.css";
import heavy from "./examples/heavy.html";
import longLabel from "./examples/long-label.html";
import onItsOwn from "./examples/on-its-own.html";
import rtl from "./examples/rtl.html";
import selectAll from "./examples/select-all.html";
import sizes from "./examples/sizes.html";

type Topping = "cheese" | "olives" | "peppers";

@Component({
	selector: "demo-checkbox",
	host: { "itx-flow": "" },
	imports: [DemoExample, InteropCodeBlock, RouterLink],
	templateUrl: "./checkbox-demo.html",
	styleUrl: "./checkbox-demo.css",
})
export class CheckboxDemo {
	protected readonly examples = {
		onItsOwn,
		longLabel,
		disabled,
		group,
		selectAll,
		rtl,
		sizes,
		heavy,
		heavyCss,
	};
	protected readonly toppingsCode = region(template, "toppings");
	protected readonly atLeastOneCode = region(template, "at-least-one");

	protected readonly bindColumns = (root: HTMLElement) =>
		bindSelectAll(root.querySelector<HTMLInputElement>("#all-columns")!);
	protected readonly selectAllTs = `import { bindSelectAll } from "interop";

// Returns a function that removes the behavior.
bindSelectAll(document.querySelector("#all-columns"));
`;
	protected readonly atLeastOneTs = `/** The first box carries the group's validity, so the browser blocks submit and says why. */
checkAtLeastOne(): void {
	const boxes = Array.from(this.atLeastOne().nativeElement.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
	boxes[0].setCustomValidity(boxes.some((box) => box.checked) ? "" : "Choose at least one day.");
}

/** The reset event fires before the form resets, so read the boxes after it. */
afterReset(): void {
	setTimeout(() => this.checkAtLeastOne());
}
`;

	protected readonly toppings = signal<Record<Topping, boolean>>({
		cheese: true,
		olives: false,
		peppers: false,
	});
	protected readonly all = computed(() =>
		Object.values(this.toppings()).every(Boolean),
	);
	protected readonly some = computed(
		() => Object.values(this.toppings()).some(Boolean) && !this.all(),
	);
	protected readonly submitted = signal<string | null>(null);

	private readonly atLeastOne =
		viewChild.required<ElementRef<HTMLFieldSetElement>>("atLeastOne");

	constructor() {
		const destroyRef = inject(DestroyRef);
		afterNextRender(() => this.checkAtLeastOne());
	}

	protected setAll(checked: boolean): void {
		this.toppings.set({ cheese: checked, olives: checked, peppers: checked });
	}

	protected set(topping: Topping, checked: boolean): void {
		this.toppings.update((toppings) => ({ ...toppings, [topping]: checked }));
	}

	/** "Choose at least one": the first box carries the group's validity, so the browser blocks submit and says why. */
	protected checkAtLeastOne(): void {
		const boxes = Array.from(
			this.atLeastOne().nativeElement.querySelectorAll<HTMLInputElement>(
				'input[type="checkbox"]',
			),
		);
		boxes[0].setCustomValidity(
			boxes.some((box) => box.checked) ? "" : "Choose at least one day.",
		);
	}

	/** The reset event fires before the form resets, so read the boxes after it. */
	protected afterReset(): void {
		setTimeout(() => this.checkAtLeastOne());
	}

	protected submit(event: SubmitEvent): void {
		event.preventDefault();
		this.submitted.set(
			new FormData(event.target as HTMLFormElement).getAll("day").join(", "),
		);
	}
}
