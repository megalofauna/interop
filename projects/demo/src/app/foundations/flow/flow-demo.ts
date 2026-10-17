import { Component, signal } from "@angular/core";
import { InteropCodeBlock } from "interop/code-block";

@Component({
	selector: "demo-flow",
	imports: [InteropCodeBlock],
	templateUrl: "./flow-demo.html",
	styleUrl: "./flow-demo.css",
})
export class FlowDemo {
	protected readonly boxes = signal(false);
	protected readonly markup = `<article itx-flow>
	<h2>Install</h2>
	<p>…</p>
	<figure>…</figure>
</article>
`;
	protected readonly tokens = `article {
	--itx-flow-space: var(--itx-space-5);
}
`;
}
