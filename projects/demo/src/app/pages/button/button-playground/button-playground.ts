import {
	Component,
	ChangeDetectionStrategy,
	computed,
	signal,
} from "@angular/core";
import {
	InteropButton,
	InteropSegment,
	InteropSegmentedControl,
} from 'interop';

type Variant =
	| "base"
	| "action-minus"
	| "action"
	| "action-plus"
	| "action-colorway";
type Size = "xs" | "sm" | "md" | "lg";
type Radius =
	| "round-xs"
	| "round-sm"
	| "round-md"
	| "round-lg"
	| "round-xl"
	| "round-full";

const VARIANTS: ReadonlySet<string> = new Set([
	"base",
	"action-minus",
	"action",
	"action-plus",
	"action-colorway",
]);
const SIZES: ReadonlySet<string> = new Set(["xs", "sm", "md", "lg"]);
const RADII: ReadonlySet<string> = new Set([
	"round-xs",
	"round-sm",
	"round-md",
	"round-lg",
	"round-xl",
	"round-full",
]);

@Component({
	selector: "button-playground",
	standalone: true,
	imports: [
		InteropButton,
		InteropSegmentedControl,
		InteropSegment,
	],
	templateUrl: "./button-playground.html",
	styleUrl: "./button-playground.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonPlayground {
	readonly variant = signal<Variant>("action");
	readonly size = signal<Size>("md");
	readonly radius = signal<Radius>("round-md");
	readonly modifiers = signal<string[]>([]);

	readonly tokens = computed(() => {
		const tokens: string[] = [];
		if (this.variant() !== "base") tokens.push(this.variant());
		tokens.push(this.size());
		tokens.push(this.radius());
		for (const m of this.modifiers()) tokens.push(m);
		return tokens;
	});

	readonly attributeValue = computed(() => this.tokens().join(" "));

	readonly attributeMarkup = computed(
		() => `interop-button="${this.attributeValue()}"`,
	);

	setVariant(value: string) {
		if (VARIANTS.has(value)) this.variant.set(value as Variant);
	}

	setSize(value: string) {
		if (SIZES.has(value)) this.size.set(value as Size);
	}

	setRadius(value: string) {
		if (RADII.has(value)) this.radius.set(value as Radius);
	}
}
