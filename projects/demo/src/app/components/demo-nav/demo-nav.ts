import {
	Component,
	ChangeDetectionStrategy,
	input,
	output,
} from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";

interface NavGroup {
	label: string;
	disabled?: boolean;
	items: NavItem[];
}

interface NavItem {
	label: string;
	route?: string;
}

@Component({
	selector: "demo-nav",
	standalone: true,
	imports: [RouterLink, RouterLinkActive],
	templateUrl: "./demo-nav.html",
	styleUrl: "./demo-nav.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		"[class.is-open]": "open()",
	},
})
export class DemoNav {
	open = input<boolean>(false);
	closed = output<void>();

	groups: NavGroup[] = [
		{
			label: "Components",
			items: [
				{ label: "Badge", route: "/components/badge" },
				{ label: "Button", route: "/components/button" },
				{ label: "Callout", route: "/components/callout" },
				{ label: "Checkbox", route: "/components/checkbox" },
				{ label: "Chip", route: "/components/chip" },
				{ label: "Code Block" },
				{ label: "Dialog", route: "/components/dialog" },
				{ label: "Expansion Panel", route: "/components/expansion-panel" },
				{ label: "Field", route: "/components/field" },
				{ label: "Icon", route: "/components/icon" },
				{ label: "Kbd", route: "/components/kbd" },
				{ label: "List", route: "/components/list" },
				{ label: "Listbox", route: "/components/listbox" },
				{ label: "Radio", route: "/components/radio" },
				{ label: "Scroll Area", route: "/components/scroll-area" },
				{ label: "Segmented Control", route: "/components/segmented-control" },
				{ label: "Stepper", route: "/components/stepper" },
				{ label: "Table", route: "/components/table" },
				{ label: "Tabs", route: "/components/tabs" },
				{ label: "Toggle", route: "/components/toggle" },
				{ label: "Toast", route: "/components/toast" },
				{ label: "Tooltip", route: "/components/tooltip" },
				{ label: "Visimorph", route: "/components/visimorph" },
			],
		},
		{
			label: "Directives",
			items: [
				{ label: "Auto Render", route: "/components/auto-render" },
			],
		},
		{
			label: "Primitives",
			items: [
				{ label: "Code Renderer", route: "/components/code-renderer" },
			],
		},
		{ label: "Containers", disabled: true, items: [] },
		{ label: "Services", disabled: true, items: [] },
		{ label: "Composites", disabled: true, items: [] },
	];

	onBackdropClick() {
		this.closed.emit();
	}
}
