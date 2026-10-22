/** The code each example on the toast page shows, written to be copied. */
export const examples = {
	region: `<!-- Once, in the app shell, after the main content -->
<section interop-toasts popover="manual" aria-label="Notifications"></section>
`,
	show: `import { toast } from 'interop';

toast('Message sent', { description: 'To the harbor master' });
`,
	colors: `toast('Docking approved', { color: 'success' });
toast('Bay 4 opens at 14:00', { color: 'info' });
toast('Fuel below 20%', { color: 'warning' });
toast('Hull breach in bay 2', { color: 'danger' });
`,
	action: `toast(\`\${crate} jettisoned\`, {
	color: 'success',
	action: { label: 'Undo', run: () => this.restore(crate, index) },
});
`,
	timeout: `toast('Link copied', { timeout: 6000 });
`,
	dialog: `<dialog id="course" interop-dialog aria-labelledby="course-title">
	…
	<button interop-button type="button" (click)="save()">Save course</button>
	<section interop-toasts popover="manual" aria-label="Notifications"></section>
</dialog>
`,
};
