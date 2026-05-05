import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	computed,
	effect,
	input,
	output,
	viewChild,
} from "@angular/core";
import { InteropButton, InteropIcon, provideInteropIcons } from "interop";
import { TablerEraser } from "interop/lib/iconsets/tabler/outline/tabler-eraser";

export interface TerminalEntry {
	text: string;
	/** Epoch ms timestamp. When provided, a relative delta prefix is shown. */
	time?: number;
}

interface DisplayEntry {
	text: string;
	delta: string | null;
}

@Component({
	selector: "itx-terminal",
	standalone: true,
	imports: [InteropButton, InteropIcon],
	providers: [provideInteropIcons(TablerEraser)],
	templateUrl: "./terminal.html",
	styleUrl: "./terminal.css",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		"[class.itx-term--scan-lines]": "scanLines()",
		"[class.itx-term--active]": "entries().length > 0",
	},
})
export class Terminal {
	readonly entries = input<TerminalEntry[]>([]);
	readonly maxEntries = input<number>(200);
	readonly prompt = input<string>("›");
	readonly scanLines = input<boolean>(false);
	readonly reset = output<void>();

	private readonly scrollEl = viewChild<ElementRef<HTMLElement>>("scrollEl");

	readonly displayEntries = computed<DisplayEntry[]>(() => {
		const all = this.entries();
		const capped =
			all.length > this.maxEntries() ? all.slice(-this.maxEntries()) : all;

		const firstTime = capped[0]?.time;
		return capped.map((entry) => ({
			text: entry.text,
			delta:
				entry.time != null && firstTime != null
					? formatDelta(entry.time - firstTime)
					: null,
		}));
	});

	constructor() {
		effect(() => {
			const len = this.entries().length;
			const el = this.scrollEl()?.nativeElement;
			if (el && len > 0) {
				queueMicrotask(() => {
					el.scrollTop = el.scrollHeight;
				});
			}
		});
	}
}

function formatDelta(ms: number): string {
	return `+${(ms / 1000).toFixed(1)}s`;
}
