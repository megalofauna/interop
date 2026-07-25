import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	ElementRef,
	type OnInit,
	computed,
	inject,
	input,
} from "@angular/core";
import { DemoPageRegistry, demoSlug } from "../demo-page/demo-page.registry";

type DemoSectionChips = { label: string; size: string }[];

/**
 * Page-level section. Renders an `h2` (with an optional `[description]` slot)
 * and registers itself with the enclosing {@link DemoPage} so it appears in the
 * derived nav. The anchor id defaults to a slug of the heading; pass `[id]` to
 * override. The id is set on the host element, which is both the anchor target
 * and the scroll-spy observation target.
 *
 * ```html
 * <demo-section heading="Appearance">
 *   <p description>Lead prose for the section.</p>
 *   <demo-example label="Size"> … </demo-example>
 * </demo-section>
 * ```
 */
@Component({
	selector: "section[demo-section], demo-section",
	standalone: true,
	host: { "[id]": "resolvedId()" },
	template: `
		<hgroup class="demo-section__head">
			<h2 class="demo-section__heading">
				<a
					[href]="'#' + resolvedId()"
					class="demo-section__anchor"
					aria-hidden="true"
					>#</a
				>
				{{ heading() }}
			</h2>
		</hgroup>
			<ng-content select="[description]" />
		<div class="demo-section__body">
			<ng-content />
		</div>
	`,
	styleUrl: "./demo-section.css",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoSection implements OnInit {
	readonly heading = input.required<string>();
	/** Optional explicit anchor id; defaults to a slug of the heading. */
	readonly id = input<string>();
	readonly chips = input<DemoSectionChips>([]);

	readonly resolvedId = computed(() => this.id() ?? demoSlug(this.heading()));

	private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
	private readonly registry = inject(DemoPageRegistry, { optional: true });
	private readonly destroyRef = inject(DestroyRef);

	ngOnInit(): void {
		const registry = this.registry;
		if (!registry) return; // usable outside <demo-page>; just doesn't register
		const id = this.resolvedId();
		registry.register({
			id,
			heading: this.heading(),
			el: this.host.nativeElement,
		});
		this.destroyRef.onDestroy(() => registry.unregister(id));
	}
}
