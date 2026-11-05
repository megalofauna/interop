/** The code each example on the toast page shows, written to be copied. */
export const examples = {
	region: `<!-- Once, in the app shell, after the main content -->
<section interop-toasts popover="manual" aria-label="Notifications"></section>
`,
	show: `import { toast } from 'interop';

toast('Message sent', { description: 'To the support team' });
`,
	colors: `toast('Payment received', { color: 'success' });
toast('Maintenance starts at 14:00', { color: 'info' });
toast('Storage is 80% full', { color: 'warning' });
toast('Payment failed', { color: 'danger' });
`,
	action: `toast(\`\${file} deleted\`, {
	color: 'success',
	action: { label: 'Undo', run: () => this.restore(file, index) },
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
