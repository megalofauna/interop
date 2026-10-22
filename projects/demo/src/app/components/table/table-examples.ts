// @ts-expect-error The text loader turns the file into a string.
import stacked from "./table-stacked.css" with { loader: "text" };

/** The code each example on the table page shows, written to be copied. */
export const examples = {
	reference: `<table interop-table>
	<caption>Button attributes</caption>
	<thead>
		<tr><th scope="col">Attribute</th><th scope="col">Does</th></tr>
	</thead>
	<tbody>
		<tr><th scope="rowgroup" colspan="2">Look</th></tr>
		<tr><th scope="row"><code>interop-button</code></th><td>…</td></tr>
		<tr><th scope="row"><code>itx-size</code></th><td>…</td></tr>
	</tbody>
	<tbody>
		<tr><th scope="rowgroup" colspan="2">Behavior</th></tr>
		<tr><th scope="row"><code>type</code></th><td>…</td></tr>
	</tbody>
</table>
`,
	data: `<div interop-scroll-area aria-labelledby="cargo-caption">
	<table interop-table>
		<caption id="cargo-caption">Cargo manifest</caption>
		<thead>
			<tr>
				<th scope="col">Item</th>
				<th scope="col">Category</th>
				<th scope="col">Deck</th>
				<th scope="col" itx-numeric>Mass (kg)</th>
				…
			</tr>
		</thead>
		<tbody>
			@for (row of cargo; track row.item) {
				<tr>
					<th scope="row">{{ row.item }}</th>
					<td>{{ row.category }}</td>
					<td>{{ row.deck }}</td>
					<td itx-numeric>{{ row.mass }}</td>
					…
				</tr>
			}
		</tbody>
	</table>
</div>
`,
	empty: `<tbody>
	<tr><td colspan="6">No cargo on this deck.</td></tr>
</tbody>
`,
	stackedHtml: `<div class="crew">
	<table interop-table>
		<caption>Crew</caption>
		<thead>
			<tr><th scope="col">Name</th><th scope="col">Role</th>…</tr>
		</thead>
		<tbody>
			@for (member of crew; track member.name) {
				<tr>
					<th scope="row" data-label="Name">{{ member.name }}</th>
					<td data-label="Role">{{ member.role }}</td>
					…
				</tr>
			}
		</tbody>
	</table>
</div>
`,
	stackedCss: stacked as string,
};
