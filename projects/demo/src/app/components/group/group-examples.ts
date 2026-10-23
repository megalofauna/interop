/** The markup each example on the group page shows, written to be copied. */
export const examples = {
	named: `<div role="group" interop-group aria-label="Export">
	<button interop-button type="button">PDF</button>
	<button interop-button type="button">CSV</button>
	<button interop-button type="button">Print</button>
</div>
`,
	fieldset: `<fieldset interop-group>
	<legend>Notifications</legend>
	<button interop-button type="button">Mute for an hour</button>
	<button interop-button type="button">Mute until tomorrow</button>
</fieldset>
`,
	attached: `<div role="group" interop-group="attached" aria-label="Zoom">
	<button interop-button="icon" type="button" aria-label="Zoom out" (click)="zoomBy(-10)">
		<svg interop-icon name="tabler-minus"></svg>
	</button>
	<button interop-button="icon" type="button" aria-label="Zoom in" (click)="zoomBy(10)">
		<svg interop-icon name="tabler-plus"></svg>
	</button>
</div>
<span>{{ zoom() }}%</span>
`,
};
