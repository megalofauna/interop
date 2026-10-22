// @ts-expect-error The text loader turns the file into a string.
import actions from "./toolbar-actions.ts" with { loader: "text" };
// @ts-expect-error The text loader turns the file into a string.
import floating from "./toolbar-demo.css" with { loader: "text" };

/** The code each example on the toolbar page shows, written to be copied. */
export const examples = {
	template: `<div interop-field>
	<label for="comment">Comment</label>
	<div interop-toolbar role="toolbar" focusgroup="toolbar" aria-label="Formatting" aria-controls="comment" itx-size="sm">
		@for (group of groups; track group.label) {
			<div role="group" [attr.aria-label]="group.label">
				@for (action of group.actions; track action.label) {
					<button interop-button="icon" type="button" [interopTooltip]="tip" [attr.aria-pressed]="pressed(comment, action)" (click)="apply(comment, action)">
						<svg interop-icon [name]="action.icon"></svg>
					</button>
					<span interop-tooltip="label" #tip>{{ action.label }}</span>
				}
			</div>
		}
	</div>
	<textarea interop-input id="comment" name="comment" rows="6" #comment></textarea>
</div>
`,
	actions: actions as string,
	channel: `<div interop-toolbar="channel" role="toolbar" focusgroup="toolbar" aria-label="Formatting" aria-controls="comment" itx-size="sm">
	…
</div>
`,
	floating: floating as string,
};
