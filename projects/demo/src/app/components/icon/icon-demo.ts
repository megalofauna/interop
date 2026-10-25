import { Component } from "@angular/core";
import { InteropIcon } from "interop/icon";
import * as tabler from "interop/tabler";
import { DemoExample } from "../../example/example";
import fixed from "./examples/fixed.html";
import labeled from "./examples/labeled.html";
import named from "./examples/named.html";
import own from "./examples/own.html";
import scale from "./examples/scale.html";
import textSizeCss from "./examples/text-size.css";
import textSize from "./examples/text-size.html";

@Component({
	selector: "demo-icon",
	host: { "itx-flow": "" },
	imports: [DemoExample, InteropIcon],
	templateUrl: "./icon-demo.html",
	styleUrl: "./icon-demo.css",
})
export class IconDemo {
	protected readonly examples = {
		named,
		textSize,
		textSizeCss,
		scale,
		fixed,
		labeled,
		own,
	};
	/** Every icon Interop ships. */
	protected readonly names = Object.values(tabler).map((icon) => icon.name);

	protected readonly namedTs = `import { drawIcons, registerIcons } from "interop";
import { TablerCheck, TablerCopy, TablerSearch } from "interop/tabler";

// Once, before any icon draws.
registerIcons(TablerCheck, TablerCopy, TablerSearch);
// Without Angular: draws every icon in the page. Call it again after adding icons.
drawIcons(document.body);
`;
}
