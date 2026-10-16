/** The markup each example on the page nav page shows, written to be copied. */
export const examples = {
	horizontal: `<nav interop-page-nav aria-label="On this page">
	<ul role="list">
		<li><a href="#install">Install</a></li>
		<li><a href="#usage">Usage</a></li>
		<li><a href="#options">Options</a></li>
	</ul>
</nav>
`,
	vertical: `<nav interop-page-nav itx-orientation="vertical" aria-label="On this page">
	<ul interop-tree role="list">
		<li><a href="#install">Install</a></li>
		<li>
			<a href="#usage">Usage</a>
			<ul role="list">
				<li><a href="#options">Options</a></li>
			</ul>
		</li>
	</ul>
</nav>
`,
	inset: `:root {
	/* A fixed header 64px tall: the bar sticks below it, and sections scroll to below the bar. */
	--itx-page-nav-inset-block-start: 4rem;
}
`,
	angular: `<!-- InteropPageNav, from interop/page-nav, calls bindTargetCurrent() on the list. -->
<nav interop-page-nav aria-label="On this page">
	<ul role="list">
		<li><a routerLink="." fragment="install">Install</a></li>
	</ul>
</nav>
`,
	router: `provideRouter(routes, withInMemoryScrolling({ anchorScrolling: "enabled" }))
`,
	helper: `import { bindTargetCurrent } from "interop";

const unbind = bindTargetCurrent(document.querySelector("nav[interop-page-nav] > ul"));
`,
};
