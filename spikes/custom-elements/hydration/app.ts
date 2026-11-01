// A small app rendered on the server and hydrated in the browser, to check that <interop-tabs>
// survives Angular hydration. Compiled just in time, so the check needs no Angular build.
import "@angular/compiler";
import { CUSTOM_ELEMENTS_SCHEMA, Component, signal } from "@angular/core";
import "interop/tabs";

@Component({
	selector: "app-root",
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	template: `
		<interop-tabs>
			<div role="tablist" aria-label="Logs">
				@for (log of logs(); track log.id) {
					<button type="button" role="tab" [attr.aria-controls]="log.id">
						{{ log.name }}
					</button>
				}
			</div>
			@for (log of logs(); track log.id) {
				<section role="tabpanel" [id]="log.id">
					<p>{{ log.text }}</p>
				</section>
			}
		</interop-tabs>
		<button type="button" id="add" (click)="add()">Add a log</button>
	`,
})
export class App {
	protected readonly logs = signal([
		{ id: "log-1", name: "Log 1", text: "Docking clamps released." },
		{ id: "log-2", name: "Log 2", text: "Course corrected." },
	]);

	protected add(): void {
		this.logs.update((logs) => [
			...logs,
			{
				id: `log-${logs.length + 1}`,
				name: `Log ${logs.length + 1}`,
				text: "Entry recorded.",
			},
		]);
	}
}
