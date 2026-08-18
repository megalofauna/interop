import {
	Component,
	ChangeDetectionStrategy,
	signal,
	computed,
} from "@angular/core";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";

/** The five roles the leading specimen renders, with their px size at the
 *  default root, so the harness can show the ratio each one resolves to. */
const ROLES = [
	{ label: "display", px: 48 },
	{ label: "heading", px: 32 },
	{ label: "body", px: 16 },
	{ label: "caption", px: 12 },
	{ label: "fine-print", px: 10 },
] as const;

@Component({
	selector: "typography-page",
	standalone: true,
	imports: [DemoSection, DemoMasthead],
	templateUrl: "./typography-page.html",
	styleUrl: "./typography-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypographyPage {
	/**
	 * Live dial on --itx-lh-leading, in px, applied to the specimen only.
	 *
	 * The leading is a value judgement and the table of ratios it produces is
	 * not the same thing as seeing it set. 8px is the shipped default; the
	 * range spans "no leading at all" to "clearly too much" so the good range
	 * is found by walking past both edges.
	 */
	readonly leadingPx = signal(8);

	/** What the token resolves to, so the dial reads as a mechanism not a slider. */
	readonly leadingCss = computed(() => `${this.leadingPx() / 16}rem`);

	/**
	 * The ratio each role lands on at the current leading, with the ceiling
	 * applied — this is where you can watch --itx-lh-loose start to bite.
	 */
	readonly ratios = computed(() =>
		ROLES.map((role) => {
			const raw = 1 + this.leadingPx() / role.px;
			const capped = Math.min(raw, 1.6);
			return {
				...role,
				ratio: capped.toFixed(2),
				clamped: capped < raw,
			};
		}),
	);

	readonly isDefault = computed(() => this.leadingPx() === 8);

	onLeading(event: Event): void {
		this.leadingPx.set(Number((event.target as HTMLInputElement).value));
	}

	reset(): void {
		this.leadingPx.set(8);
	}
}
