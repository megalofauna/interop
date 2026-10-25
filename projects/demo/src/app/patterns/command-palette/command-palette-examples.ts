/** The markup the command palette page shows, written to be copied. */
export const examples = {
	goTo: `<button interop-button type="button" commandfor="go-to" command="show-modal" interopShortcut="mod+k">
	Search <kbd></kbd>
</button>

<dialog #goTo id="go-to" interop-dialog="palette" closedby="any" aria-labelledby="go-to-label">
	<search interop-field>
		<label id="go-to-label" for="go-to-query">Go to page</label>
		<input interop-input id="go-to-query" type="search" autofocus autocomplete="off" spellcheck="false"
			[interopFilter]="pages" [filterEmpty]="noPages" />
	</search>
	<nav aria-label="Pages">
		<!-- A link in a single-page app navigates without a page load, so close the dialog. -->
		<ul #pages role="list" (click)="goTo.close()">
			@for (page of pageLinks; track page.path) {
				<li><a [routerLink]="page.path">{{ page.title }}</a></li>
			}
		</ul>
	</nav>
	<p #noPages hidden>No pages match.</p>
	<footer>
		<span><kbd>↓</kbd> <kbd>↑</kbd> Move</span>
		<span><kbd>Enter</kbd> Open</span>
		<span><kbd>Esc</kbd> Clear, then close</span>
	</footer>
</dialog>
`,
};
