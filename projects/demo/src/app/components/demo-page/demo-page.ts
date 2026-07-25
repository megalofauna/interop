import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	afterNextRender,
	computed,
	inject,
} from "@angular/core";
import { PageNav, type PageNavLink } from "interop";
import { DemoPageRegistry } from "./demo-page.registry";

/**
 * Page shell — a masthead slot, a derived page nav, and scroll-spy.
 *
 * Projects a `<demo-masthead>` and the page's `<demo-section>`s. Sections
 * register with {@link DemoPageRegistry} as they init, so the nav links and the
 * active-section highlight come from the DOM. A page no longer maintains a
 * links array or its own IntersectionObserver.
 *
 * ```html
 * <demo-page>
 *   <demo-masthead category="Components" title="Button">…lead…</demo-masthead>
 *   <demo-section heading="Appearance"> … </demo-section>
 * </demo-page>
 * ```
 */
@Component({
	selector: "demo-page",
	standalone: true,
	imports: [PageNav],
	providers: [DemoPageRegistry],
	template: `
		<article class="demo-page">
			<div class="demo-page__content">
				<ng-content select="demo-masthead" />
				<itx-page-nav
					[links]="navLinks()"
					[activeHref]="activeHref()"
					[sticky]="true"
					[fade]="true"
				/>
				<ng-content />
			</div>
		</article>
	`,
	styles: [":host { display: contents; }"],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoPage {
	private readonly registry = inject(DemoPageRegistry);
	private readonly destroyRef = inject(DestroyRef);

	readonly navLinks = computed<PageNavLink[]>(() =>
		this.registry
			.sections()
			.map((s) => ({ label: s.heading, href: `#${s.id}` })),
	);

	readonly activeHref = computed(() => {
		const id = this.registry.activeId();
		return id ? `#${id}` : null;
	});

	constructor() {
		afterNextRender(() => {
			const visible = new Set<string>();
			const observer = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						if (entry.isIntersecting) visible.add(entry.target.id);
						else visible.delete(entry.target.id);
					}
					// Last visible section in DOM order wins the highlight.
					const active = this.registry
						.sections()
						.findLast((s) => visible.has(s.id));
					this.registry.activeId.set(active?.id ?? null);
				},
				{ rootMargin: "0px 0px -60% 0px", threshold: 0 },
			);
			for (const s of this.registry.sections()) observer.observe(s.el);
			this.destroyRef.onDestroy(() => observer.disconnect());
		});
	}
}
