import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
	selector: "section[ptx-home-page]",
	imports: [RouterLink],
	template: `
		<div interop-typography-root>
			<h1>Protocol</h1>
			<p>Content authored in markdown, rendered through the design system.</p>
			<ul>
				<li><a routerLink="/getting-started">Getting started</a></li>
				<li><a routerLink="/kitchen-sink">Markdown kitchen sink</a></li>
			</ul>
		</div>
	`,
})
export class HomePage {}
