import { Component, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { InteropBadge } from "interop/badge";
import { InteropCodeBlock } from "interop/code-block";
import { InteropIcon } from "interop/icon";

@Component({
	selector: "demo-split-button",
	host: { "itx-flow": "" },
	imports: [InteropBadge, InteropCodeBlock, InteropIcon, RouterLink],
	templateUrl: "./split-button-demo.html",
	styleUrl: "../patterns.css",
})
export class SplitButtonDemo {
	protected readonly splitResult = signal("");
	protected readonly splitExample = `<div role="group" interop-group="attached" aria-label="Save">
	<button interop-button type="button" (click)="save()">Save</button>
	<button interop-button="icon" type="button" command="toggle-popover" commandfor="save-more"
		aria-label="More save options">
		<svg interop-icon name="tabler-chevron-down"></svg>
	</button>
	<div interop-popover popover id="save-more">
		<button interop-button type="button" command="hide-popover" commandfor="save-more"
			(click)="saveDraft()">Save as draft</button>
		<button interop-button type="button" command="hide-popover" commandfor="save-more"
			(click)="saveAndClose()">Save and close</button>
	</div>
</div>
`;

	protected saveAs(result: string): void {
		this.splitResult.set(result);
	}
}
