import {
	ChangeDetectionStrategy,
	Component,
	computed,
	effect,
	inject,
	input,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { InteropChipBadge } from "interop";
import { DemoPageMeta } from "../../services/page-meta";
import { DEMO_CATALOG } from "../demo-nav/demo-nav.catalog";

/**
 * Page masthead — category / title / lead — shared across every demo page.
 *
 * Replaces the copy-pasted `.demo-page__header` block. Reuses the existing
 * global `.demo-page__*` styles (see `_demo-page.scss`), so no local styles are
 * needed; `:host { display: contents }` keeps the host box out of layout so the
 * `<header>` behaves exactly as a direct child of `.demo-page__content` did.
 *
 * The `lead` is projected (not an input) because several pages include inline
 * markup like `<code>` in it.
 *
 * Registers its `{ category, title }` with {@link DemoPageMeta} on change — this
 * is what lets every page "just do that thing": the shell header surfaces this
 * as a breadcrumb when it collapses, with no per-route configuration. The real
 * `<h1>` stays here as the accessible page heading; the shell's copy is
 * decorative.
 */
@Component({
	selector: "demo-masthead",
	standalone: true,
	imports: [RouterLink, InteropChipBadge],
	template: `
		<header class="demo-page__header">
			@if (categoryRoute(); as route) {
				<p class="demo-page__category">
					<a [routerLink]="route" class="demo-page__category-link">{{
						category()
					}}</a>
				</p>
			} @else {
				<p class="demo-page__category">{{ category() }}</p>
			}
			<h1 class="demo-page__title">
				{{ title() }}
				@if (internal()) {
					<span interop-chip-badge itx-size="sm" class="demo-page__title-tag"
						>internal</span
					>
				}
			</h1>
			<p class="demo-page__lead"><ng-content /></p>
		</header>
	`,
	styles: [
		`
			:host {
				display: contents;
			}
			/* 8px from the title, matching the sidebar marker. */
			.demo-page__title-tag {
				margin-inline-start: var(--itx-spacing-2);
				vertical-align: middle;
			}
		`,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoMasthead {
	readonly category = input("");
	readonly title = input("");

	/**
	 * Marks a primitive or shared layer that exists to serve another component
	 * rather than to be consumed directly. Set explicitly rather than derived
	 * from the route: two pages need it, and an explicit input is easier to find
	 * than a lookup.
	 */
	readonly internal = input(false);

	/**
	 * Directory page for this category, resolved from the catalog by label — so
	 * "Components" links to /components without every page passing a route.
	 * Categories with no index (Foundation, Overview) resolve to null and the
	 * eyebrow stays plain text.
	 */
	readonly categoryRoute = computed(
		() =>
			DEMO_CATALOG.find((g) => g.label === this.category())?.landingRoute ??
			null,
	);

	private readonly pageMeta = inject(DemoPageMeta);

	constructor() {
		effect(() =>
			this.pageMeta.set({ category: this.category(), title: this.title() }),
		);
	}
}
