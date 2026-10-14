/** The markup each app shell mode shows, written to be copied. */
export const examples = {
	disclosure: `<div class="shell">
	<header>…</header>
	<details class="site-nav">
		<summary interop-button>Menu</summary>
		<nav aria-label="Pages">…</nav>
	</details>
	<main>…</main>
</div>
`,
	disclosureCss: `/* The shell's own container, so the layout follows the space it has, not the window. */
.app {
	container: shell / inline-size;
}

.shell {
	display: grid;
	grid-template-areas: "header" "nav" "main";
}

@container shell (inline-size >= 48rem) {
	.shell {
		grid-template-columns: 16rem 1fr;
		grid-template-areas: "header header" "nav main";
	}

	/*
	 * The summary goes, and the nav shows whether the disclosure is open or not. Only where
	 * ::details-content is supported: elsewhere the summary stays, so the nav can still be opened.
	 */
	@supports selector(::details-content) {
		.site-nav > summary {
			display: none;
		}

		.site-nav::details-content {
			content-visibility: visible;
		}
	}
}
`,
	drawer: `<div class="shell">
	<header>
		<button interop-button type="button" class="menu" commandfor="site-nav" command="toggle-popover">Menu</button>
		…
	</header>
	<nav id="site-nav" interop-popover="drawer" popover aria-label="Pages">…</nav>
	<main>…</main>
</div>
`,
	drawerCss: `@container shell (inline-size >= 48rem) {
	.menu {
		display: none;
	}

	/* The same popover, shown in the page: a closed popover is only hidden by the browser's display: none. */
	nav[popover] {
		grid-area: nav;
		display: block;
		position: static;
		inline-size: auto;
		block-size: auto;
		opacity: 1;
		translate: none;
		border-width: 0;
		box-shadow: none;
	}
}
`,
	drawerTs: `// In Angular, import InteropDrawer from interop/popover. Elsewhere:
import { bindDrawer } from "interop";

bindDrawer(document.getElementById("site-nav"));
`,
};
