/** The markup each example on the tree page shows, written to be copied. */
export const examples = {
	nav: `<nav aria-label="Docs">
	<ul interop-tree role="list">
		<li>
			<details open>
				<summary>Guides</summary>
				<ul role="list">
					<li><a href="/guides">Overview</a></li>
					<li><a href="/guides/install" aria-current="page">Install</a></li>
					<li>
						<details>
							<summary>Deploy</summary>
							<ul role="list">
								<li><a href="/guides/deploy/netlify">Netlify</a></li>
								<li><a href="/guides/deploy/vercel">Vercel</a></li>
							</ul>
						</details>
					</li>
				</ul>
			</details>
		</li>
		<li><a href="/changelog">Changelog</a></li>
	</ul>
</nav>
`,
	exclusive: `<ul interop-tree role="list">
	<li>
		<details name="docs-top" open>
			<summary>Guides</summary>
			<ul role="list">…</ul>
		</details>
	</li>
	<li>
		<details name="docs-top">
			<summary>Reference</summary>
			<ul role="list">…</ul>
		</details>
	</li>
</ul>
`,
	angular: `<a routerLink="/guides/install" routerLinkActive="active" ariaCurrentWhenActive="page">Install</a>
`,
};
