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

type Topping = "cheese" | "olives" | "peppers";

@Component({
	selector: "demo-checkbox",
	host: { "itx-flow": "" },
	imports: [RouterLink],
	templateUrl: "./checkbox-demo.html",
	styleUrl: "./checkbox-demo.css",
})
export class CheckboxDemo {
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

	private readonly helperParent =
		viewChild.required<ElementRef<HTMLInputElement>>("helperParent");
	private readonly atLeastOne =
		viewChild.required<ElementRef<HTMLFieldSetElement>>("atLeastOne");

	constructor() {
		const destroyRef = inject(DestroyRef);
		afterNextRender(() => {
			destroyRef.onDestroy(bindSelectAll(this.helperParent().nativeElement));
			this.checkAtLeastOne();
		});
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
