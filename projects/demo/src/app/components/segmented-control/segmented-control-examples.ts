/** The markup each example on the segmented control page shows, written to be copied. */
export const examples = {
	fitCss: `/* A static threshold: stacked below a width you choose, no script. */
@media (width < 30rem) {
	.sort-order {
		--itx-segmented-orientation: vertical;
	}
}
`,
	fitHtml: `<!-- Always stacked -->
<fieldset interop-radio-group="segmented" itx-orientation="vertical">…</fieldset>

<!-- Stacked only when the row does not fit: bindSegmentedFit(), or in Angular -->
<fieldset interop-radio-group="segmented" interop-segmented-fit>…</fieldset>
`,
};
