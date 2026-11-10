import { NgTemplateOutlet } from "@angular/common";
import { Component, signal } from "@angular/core";
import { registerIcons } from "interop";
import { InteropCodeBlock } from "interop/code-block";
import { InteropIcon } from "interop/icon";
import {
	TablerBold,
	TablerCode,
	TablerHeading,
	TablerItalic,
	TablerLink,
	TablerList,
	TablerListNumbers,
	TablerQuote,
	TablerStrikethrough,
} from "interop/tabler";
import { InteropToolbar } from "interop/toolbar";
import {
	applyMarkdown,
	groups,
	isPressed,
	type MarkdownAction,
} from "./toolbar-actions";
import { examples } from "./toolbar-examples";

registerIcons(
	TablerHeading,
	TablerBold,
	TablerItalic,
	TablerStrikethrough,
	TablerQuote,
	TablerCode,
	TablerLink,
	TablerList,
	TablerListNumbers,
);

@Component({
	selector: "demo-toolbar",
	host: {
		"itx-flow": "",
		// The pressed state follows the cursor. selectionchange covers it where the browser fires it
		// for a text area; the other events cover the rest.
		"(document:selectionchange)": "changed()",
		"(input)": "changed()",
		"(keyup)": "changed()",
		"(pointerup)": "changed()",
	},
	imports: [NgTemplateOutlet, InteropCodeBlock, InteropIcon, InteropToolbar],
	templateUrl: "./toolbar-demo.html",
	styleUrl: "./toolbar-demo.css",
})
export class ToolbarDemo {
	protected readonly groups = groups;
	protected readonly examples = examples;
	/** Bumped whenever a selection or a text may have changed, so the pressed states are read again. */
	private readonly revision = signal(0);

	protected changed(): void {
		this.revision.update((n) => n + 1);
	}

	/** The ID of an action's label tooltip, unique per toolbar because each is named after its field. */
	protected tipId(field: HTMLTextAreaElement, action: MarkdownAction): string {
		return `${field.id}-tip-${action.label.toLowerCase().replace(/\s+/g, "-")}`;
	}

	/** aria-pressed for a toggle, or null for a command, which has no pressed state. */
	protected pressed(
		field: HTMLTextAreaElement,
		action: MarkdownAction,
	): string | null {
		this.revision();
		return action.kind === "link" ? null : String(isPressed(field, action));
	}

	protected apply(field: HTMLTextAreaElement, action: MarkdownAction): void {
		applyMarkdown(field, action);
		this.changed();
	}
}
