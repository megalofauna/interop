import { Component, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";
import { CodeBlock, type CodeFile } from "interop";
import { DemoPage } from "../../components/demo-page/demo-page";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";

/**
 * Principles — the standing statement of why Interop is built the way it is.
 *
 * Prose page, not a component demo, so it skips the usage/API/notes rhythm.
 * Each principle is a claim plus one paragraph, and ends with a link to the
 * demo section that proves it. The evidence lives on the demo pages; this page
 * only states positions.
 *
 * Body copy sits inside `[interop-typography-root]` blocks so the library's own
 * prose system does the sizing and rhythm. Long-form research draft, including
 * the competitor material that belongs on individual demo pages: `ethos.md`
 * alongside this file.
 */
@Component({
	selector: "principles-page",
	standalone: true,
	imports: [RouterLink, CodeBlock, DemoPage, DemoSection, DemoMasthead],
	templateUrl: "./principles-page.html",
	styleUrl: "./principles-page.css",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrinciplesPage {
	protected readonly hostCode = `<button interop-button>
<label interop-radio>
<fieldset interop-chip-filter>
<input type="range" interop-slider>

<ul interop-tree>
<li interop-tree-item>
<ol interop-step-list>

<dialog interop-dialog>
<progress interop-progress>
<output interop-slider-value>`;

	protected readonly hostFiles: CodeFile[] = [
		{ label: "template.html", language: "html", code: this.hostCode },
	];

	protected readonly cascadeCode = `/* What the library ships. Zero specificity, inside a layer. */
@layer interop.foundation {
  :where(button[interop-button]) { … }
}

/* What you write. Wins on contact, no !important, no ::ng-deep. */
.checkout button { background: rebeccapurple; }`;

	protected readonly cascadeFiles: CodeFile[] = [
		{ label: "cascade.css", language: "css", code: this.cascadeCode },
	];

	protected readonly tiersCode = `// Presentation. Styles a real button through custom properties.
imports: []

// …plus reactive state: disabled, loading, loadingText.
imports: [InteropButton]

// …plus activation guards: throttle, debounce, reentrance, once.
imports: [InteropButton, InteropButtonActivation]`;

	protected readonly tiersFiles: CodeFile[] = [
		{ label: "component.ts", language: "ts", code: this.tiersCode },
	];
}
