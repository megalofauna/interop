import {
	ChangeDetectionStrategy,
	Component,
	effect,
	inject,
	input,
} from "@angular/core";
import { DemoPageMeta } from "../../services/page-meta";

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
	template: `
		<header class="demo-page__header">
			<p class="demo-page__category">{{ category() }}</p>
			<h1 class="demo-page__title">{{ title() }}</h1>
			<p class="demo-page__lead"><ng-content /></p>
		</header>
	`,
	styles: [":host { display: contents; }"],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoMasthead {
	readonly category = input("");
	readonly title = input("");

	private readonly pageMeta = inject(DemoPageMeta);

	constructor() {
		effect(() =>
			this.pageMeta.set({ category: this.category(), title: this.title() }),
		);
	}
}
