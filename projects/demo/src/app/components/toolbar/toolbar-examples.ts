// @ts-expect-error The text loader turns the file into a string.
import actions from "./toolbar-actions.ts" with { loader: "text" };

/** The code each example on the toolbar page shows, written to be copied. */
export const examples = {
	template: `<div interop-field>
	<label for="comment">Comment</label>
	<div interop-toolbar role="toolbar" focusgroup="toolbar" aria-label="Formatting" aria-controls="comment">
		@for (group of groups; track group.label) {
			<div role="group" [attr.aria-label]="group.label">
				@for (action of group.actions; track action.label) {
					<button interop-button="icon" type="button" itx-size="sm" [interopTooltip]="tip" (click)="apply(comment, action)">
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
};
