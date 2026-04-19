import { Component, ChangeDetectionStrategy, viewChild } from "@angular/core";
import {
	InteropStepper,
	InteropStepList,
	InteropStep,
	InteropStepPanel,
	InteropButton,
	InteropTable,
	InteropCellDef,
	type TableColumn,
} from "src/public-api";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoNotes, type DemoNote } from "../../components/demo-notes/demo-notes";

interface ApiEntry {
	component?: string;
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
}

@Component({
	selector: "stepper-page",
	standalone: true,
	imports: [
		InteropStepper,
		InteropStepList,
		InteropStep,
		InteropStepPanel,
		InteropButton,
		InteropTable,
		InteropCellDef,
		DemoSection,
		DemoExample,
		DemoNotes,
	],
	templateUrl: "./stepper-page.html",
	styleUrl: "./stepper-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperPage {
	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "component", label: "Component" },
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{ component: "interop-stepper", name: "activeStep", type: "number", default: "0", description: "Currently active step index (0-based). Two-way bindable." },
		{ component: "interop-stepper", name: "linear", type: "boolean", default: "true", description: "When true, steps must be completed in order. Future steps are locked until the user advances." },
		{ component: "interop-stepper", name: "orientation", type: "'horizontal' | 'vertical'", default: "'horizontal'", description: "Layout orientation of the step indicator strip." },
		{ component: "interop-stepper", name: "ariaLabel", type: "string", default: "'Progress'", description: "Accessible label for the step indicator navigation landmark." },
		{ component: "interop-stepper", name: "icons", type: "Partial<Record<StepStatus, string>>", default: "{}", description: "Default icon name overrides applied to all steps." },
		{ component: "interop-stepper", name: "indicatorTemplate", type: "TemplateRef | null", default: "null", description: "Custom template for the step indicator circle content." },
		{ component: "li[interop-step]", name: "label", type: "string", default: "—", description: "Required. The step's visible label text.", required: true },
		{ component: "li[interop-step]", name: "status", type: "StepStatus | null", default: "null", description: "Overrides the auto-calculated step status." },
		{ component: "li[interop-step]", name: "optional", type: "boolean", default: "false", description: "Marks the step as optional." },
		{ component: "li[interop-step]", name: "icons", type: "Partial<Record<StepStatus, string>>", default: "{}", description: "Overrides default icon names for specific statuses on this step only." },
	];

	outputColumns: TableColumn<ApiEntry>[] = [
		{ key: "component", label: "Component" },
		{ key: "name", label: "Output" },
		{ key: "type", label: "Type" },
		{ key: "description", label: "Description" },
	];

	outputEntries: ApiEntry[] = [
		{ component: "interop-stepper", name: "activeStepChange", type: "number", default: "", description: "Emitted when the active step index changes." },
		{ component: "interop-stepper", name: "stepAttempt", type: "{ index: number; reason: 'locked' | 'bounds' }", default: "", description: "Emitted when a navigation attempt is blocked by linear lock or step bounds." },
	];

	notes: DemoNote[] = [
		{
			type: 'release',
			label: 'v0.1.0',
			title: 'Stepper component added to manifest',
			body: 'InteropStepper is a composable multi-step wizard. Linear mode (default) locks future steps until the user advances. Non-linear mode allows free navigation.',
		},
		{
			type: 'note',
			label: 'Navigation',
			body: 'The stepper does not render navigation buttons. Consumers provide them using a template reference variable (#stepper) to access back(), next(), canGoBack(), and canGoForward().',
		},
	];
}
