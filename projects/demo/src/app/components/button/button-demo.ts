import { Component, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { InteropCodeBlock } from "interop/code-block";
import { InteropIcon } from "interop/icon";
import { InteropInvoker } from "interop/invoker";
import { InteropTooltip } from "interop/tooltip";

@Component({
	selector: "demo-button",
	host: { "itx-flow": "" },
	imports: [
		InteropCodeBlock,
		InteropIcon,
		InteropInvoker,
		InteropTooltip,
		RouterLink,
	],
	templateUrl: "./button-demo.html",
	styleUrl: "./button-demo.css",
})
export class ButtonDemo {
	protected readonly bold = signal(false);
	protected readonly busy = signal(true);
	protected readonly saved = signal(0);
	protected readonly splitResult = signal("");
	protected readonly splitExample = `<div role="group" interop-group="attached" aria-label="Save">
	<button interop-button type="button" (click)="save()">Save</button>
	<button interop-button="icon" type="button" command="toggle-popover" commandfor="save-more"
		aria-label="More save options">
		<svg interop-icon name="tabler-chevron-down"></svg>
	</button>
</div>
<div interop-popover popover id="save-more" class="choices">
	<button interop-button type="button" command="hide-popover" commandfor="save-more"
		(click)="saveDraft()">Save as draft</button>
	<button interop-button type="button" command="hide-popover" commandfor="save-more"
		(click)="saveAndClose()">Save and close</button>
</div>
`;

	protected saveAs(result: string): void {
		this.splitResult.set(result);
	}

	protected readonly save = async () => {
		await new Promise((resolve) => setTimeout(resolve, 1500));
		this.saved.update((n) => n + 1);
	};
}
