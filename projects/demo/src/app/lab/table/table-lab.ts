import {
	Component,
	DestroyRef,
	ElementRef,
	Injector,
	ViewEncapsulation,
	afterNextRender,
	inject,
	signal,
} from "@angular/core";
import { bindScrollArea } from "interop";
import { InteropSegmentedFit } from "interop/radio-group";

type DialKey =
	"text" | "row" | "method" | "rule" | "button" | "control" | "touch";

interface Measurement {
	table: string;
	target: number;
	header: number | null;
	plain: number | null;
	wrapped: number | null;
	control: number | null;
	controlOff: boolean;
	plainOff: number | null;
}

/** Candidate text sizes and row heights for the table. Listed under Labs in the nav. */
@Component({
	selector: "demo-table-lab",
	host: {
		"itx-flow": "",
		class: "table-lab",
		"[attr.data-method]": "state().method",
		"[attr.data-rule]": "state().rule",
		"[attr.data-control]": "state().control",
		"[attr.data-touch]": "state().touch",
	},
	imports: [InteropSegmentedFit],
	templateUrl: "./table-lab.html",
	styleUrl: "./table-lab.css",
	encapsulation: ViewEncapsulation.None,
})
export class TableLab {
	/** The opening values match what ships. */
	protected readonly state = signal<Record<DialKey, string>>({
		text: "16",
		row: "40",
		method: "derived",
		rule: "included",
		button: "sm",
		control: "line",
		touch: "off",
	});

	protected readonly dials: {
		key: DialKey;
		legend: string;
		options: { value: string; label: string }[];
	}[] = [
		{
			key: "text",
			legend: "Text",
			options: [
				{ value: "14", label: "14px" },
				{ value: "16", label: "16px" },
			],
		},
		{
			key: "row",
			legend: "Row height",
			options: [
				{ value: "28", label: "28" },
				{ value: "32", label: "32" },
				{ value: "36", label: "36" },
				{ value: "40", label: "40" },
				{ value: "44", label: "44" },
				{ value: "48", label: "48" },
				{ value: "56", label: "56" },
			],
		},
		{
			key: "method",
			legend: "How the height is set",
			options: [
				{ value: "derived", label: "Derived padding" },
				{ value: "height-0", label: "Height, 0 padding" },
				{ value: "height-4", label: "Height, 4px padding" },
			],
		},
		{
			key: "rule",
			legend: "1px row rule",
			options: [
				{ value: "added", label: "Added" },
				{ value: "included", label: "Included" },
			],
		},
		{
			key: "button",
			legend: "Button in a cell",
			options: [
				{ value: "xs", label: "xs" },
				{ value: "sm", label: "sm" },
				{ value: "md", label: "md" },
			],
		},
		{
			key: "control",
			legend: "Control in a cell",
			options: [
				{ value: "grow", label: "Row grows" },
				{ value: "line", label: "Takes one line" },
			],
		},
		{
			key: "touch",
			legend: "44px touch floor",
			options: [
				{ value: "off", label: "Off" },
				{ value: "on", label: "On" },
			],
		},
	];

	protected readonly matrix = [
		{
			text: "14",
			rows: [
				{ value: "28", label: "compact" },
				{ value: "36", label: "regular" },
				{ value: "44", label: "spacious" },
			],
		},
		{
			text: "16",
			rows: [
				{ value: "32", label: "compact" },
				{ value: "40", label: "regular" },
				{ value: "48", label: "spacious" },
			],
		},
	];
	protected readonly aligned = [
		"api-gateway",
		"billing-worker",
		"search-indexer",
		"notifications",
	];

	protected readonly schemes = ["light", "dark"];

	protected readonly deployments = [
		{
			service: "api-gateway",
			change: "Raise the idle limit",
			status: "Live",
			color: "success",
			region: "us-east-1",
			duration: "1m 42s",
			requests: "48,210",
		},
		{
			service: "billing-worker",
			change:
				"Retry failed invoice webhooks with exponential backoff, and stop charging twice when the provider times out after accepting the request",
			status: "Failed",
			color: "danger",
			region: "eu-west-2",
			duration: "6m 09s",
			requests: "1,204",
		},
		{
			service: "search-indexer",
			change: "Rebuild the index",
			status: "Running",
			color: "info",
			region: "us-west-2",
			duration: "12m 31s",
			requests: "9,877",
		},
		{
			service: "notifications",
			change: "Batch digest emails",
			status: "Queued",
			color: "warning",
			region: "ap-south-1",
			duration: "0s",
			requests: "0",
		},
		{
			service: "auth",
			change: "Rotate the signing key",
			status: "Live",
			color: "success",
			region: "us-east-1",
			duration: "58s",
			requests: "112,530",
		},
	];

	protected readonly attributes = [
		{
			name: "itx-size",
			values: "sm, md",
			description:
				"Sets the size of the table text, and the row height with it.",
		},
		{
			name: "itx-density",
			values: "compact, regular, spacious",
			description:
				"Sets the row height: 32, 40 or 48px at 16px text, and 28, 36 or 44px at 14px text. Cell padding comes from the row height and the line height, so a cell whose text wraps keeps the same padding above and below it.",
		},
		{
			name: "itx-numeric",
			values: "none",
			description:
				"On a th or td. Aligns the cell to the end and gives its figures equal width.",
		},
	];

	protected readonly budget = [
		{
			group: "Engineering",
			rows: [
				["Salaries", "1,240,000", "1,198,400", "96.6%"],
				["Cloud hosting", "310,000", "342,750", "110.6%"],
				["Software licenses", "86,000", "71,200", "82.8%"],
			],
		},
		{
			group: "Operations",
			rows: [
				["Office leases", "204,000", "204,000", "100.0%"],
				["Travel and conferences", "48,000", "12,380", "25.8%"],
			],
		},
	];

	protected readonly measurements = signal<Measurement[]>([]);

	private readonly injector = inject(Injector);
	private readonly host = inject(ElementRef<HTMLElement>)
		.nativeElement as HTMLElement;

	constructor() {
		const destroyRef = inject(DestroyRef);
		afterNextRender(() => {
			for (const area of this.host.querySelectorAll<HTMLElement>(
				"[interop-scroll-area]",
			))
				bindScrollArea(area);
			this.measure();
			document.fonts?.ready.then(() => this.measure());
			// A narrower page wraps more cells.
			const observer = new ResizeObserver(() => this.measure());
			observer.observe(this.host);
			destroyRef.onDestroy(() => observer.disconnect());
		});
	}

	protected set(key: DialKey, event: Event) {
		const value = (event.target as HTMLInputElement).value;
		this.state.update((state) => ({ ...state, [key]: value }));
		afterNextRender(
			{ read: () => this.measure() },
			{ injector: this.injector },
		);
	}

	private measure() {
		const height = (table: Element, kind: string) => {
			const row = table.querySelector(`tr[data-kind="${kind}"]`);
			return row
				? Math.round(row.getBoundingClientRect().height * 100) / 100
				: null;
		};
		const next = Array.from(
			this.host.querySelectorAll<HTMLElement>("table[data-measure]"),
		).map((table) => {
			const plain = height(table, "plain");
			const control = height(table, "control");
			const target = Number(table.dataset["row"]);
			return {
				table: table.dataset["measure"] ?? "",
				target,
				header: height(table, "header"),
				plain,
				wrapped: height(table, "wrapped"),
				control,
				controlOff: control !== null && plain !== null && control - plain > 0.5,
				plainOff:
					plain === null ? null : Math.round((plain - target) * 100) / 100,
			};
		});
		if (JSON.stringify(next) !== JSON.stringify(this.measurements()))
			this.measurements.set(next);
	}
}
