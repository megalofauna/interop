import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	ViewEncapsulation,
	computed,
	effect,
	inject,
	input,
	output,
	signal,
	untracked,
	viewChild,
} from "@angular/core";
import { InteropDialog } from "../interop-dialog/interop-dialog";
import { InteropIcon } from "../interop-icon/interop-icon";
import { InteropKbd } from "../interop-kbd/interop-kbd";
import { provideInteropIcons } from "../../iconsets/core";
import { TablerSearch } from "../../iconsets/tabler";
import {
	interopCollection,
	type InteropCollectionInput,
} from "../../collection/public-api";
import type { CommandItem } from "./interop-command-palette.types";

let paletteSeq = 0;

/**
 * InteropCommandPalette — a ⌘K-style modal command launcher.
 *
 * A modal combobox: native `<dialog>` shell (via the `interop-dialog` host
 * directive — real focus trap, inert background, focus return, ESC/backdrop),
 * an `<input role="combobox">`, and a palette-owned `<ul role="listbox">` with
 * virtual focus (`aria-activedescendant` on the input, `aria-selected` on the
 * active option), plus a polite live region for result-count / empty
 * announcements (WCAG 4.1.3 — the thing cmdk omits).
 *
 * **Controlled by design.** The palette never filters or ranks. The consumer
 * owns filtering/data: bind `(queryChange)`, filter, and feed back `[commands]`
 * as any source shape — array, Promise, Observable, Signal, `{items,loading}` —
 * normalized by `InteropCollection` (loading / empty / async selection handled).
 *
 * `open` is controlled (maps to the dialog's `isOpen`); reset it to `false` in
 * `(closed)`. Running a command self-closes and fires `(command)`.
 *
 * @example
 * ```html
 * <dialog interop-command-palette
 *   [open]="open()" (closed)="open.set(false)"
 *   [commands]="results()" (queryChange)="query.set($event)"
 *   (command)="run($event)"></dialog>
 * ```
 */
@Component({
	selector: "dialog[interop-command-palette]",
	standalone: true,
	imports: [InteropIcon, InteropKbd],
	templateUrl: "./interop-command-palette.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
	providers: [provideInteropIcons(TablerSearch)],
	hostDirectives: [
		{
			directive: InteropDialog,
			inputs: ["isOpen: open", "dismissOnBackdrop", "disableEscape"],
			outputs: ["closed"],
		},
	],
	host: {
		"[attr.aria-label]": "label()",
		"(cancel)": "onCancel($event)",
	},
})
export class InteropCommandPalette {
	private readonly dialog = inject(InteropDialog);
	private readonly hostEl = inject(ElementRef<HTMLDialogElement>);
	private readonly uid = `itx-cmdp-${++paletteSeq}`;

	// ── Inputs ────────────────────────────────────────────────────────────────
	readonly label = input<string>("Command palette");
	readonly placeholder = input<string>("Type a command or search…");
	readonly emptyLabel = input<string>("No results found");
	readonly loadingLabel = input<string>("Loading…");

	/** The (already-filtered) items to show. Any collection source shape. */
	readonly commands = input<InteropCollectionInput<CommandItem>>([]);

	// ── Outputs ─────────────────────────────────────────────────────────────────
	readonly queryChange = output<string>();
	readonly command = output<CommandItem>();

	// ── Collection (async normalization: items/loading/empty/count) ─────────────
	private readonly collection = interopCollection<CommandItem>(this.commands);
	readonly items = this.collection.items;
	readonly loading = this.collection.loading;
	readonly count = this.collection.count;
	readonly isEmpty = computed(
		() => this.collection.isEmpty() && !this.collection.loading(),
	);

	// ── Query + active option ───────────────────────────────────────────────────
	readonly query = signal("");
	private readonly activeIndex = signal(0);

	readonly listboxId = `${this.uid}-listbox`;
	readonly activeId = computed<string | null>(() => {
		const item = this.items()[this.activeIndex()];
		return item ? this.optionId(item) : null;
	});

	private readonly inputEl =
		viewChild<ElementRef<HTMLInputElement>>("inputEl");

	// ── Live-region announcement (WCAG 4.1.3) ───────────────────────────────────
	readonly announcement = computed<string>(() => {
		if (this.loading()) return this.loadingLabel();
		const n = this.count();
		if (n === 0) return this.emptyLabel();
		return `${n} result${n === 1 ? "" : "s"} available`;
	});

	constructor() {
		// Fresh open: clear query + reset active to the first item.
		effect(
			() => {
				if (this.dialog.isOpen()) {
					untracked(() => {
						this.query.set("");
						this.activeIndex.set(0);
						const el = this.inputEl()?.nativeElement;
						if (el) el.value = "";
					});
				}
			},
			{ allowSignalWrites: true },
		);

		// Keep the active index valid as items stream in. Default to the first
		// item — this is the async-selection guarantee (survives streaming
		// results), the exact case cmdk #280 fails.
		effect(
			() => {
				const n = this.items().length;
				untracked(() => {
					const i = this.activeIndex();
					if (n === 0 || i >= n || i < 0) this.activeIndex.set(0);
				});
			},
			{ allowSignalWrites: true },
		);
	}

	// ── Option identity / active state ──────────────────────────────────────────
	optionId(item: CommandItem): string {
		return `${this.uid}-opt-${item.id}`;
	}

	isActive(item: CommandItem): boolean {
		return this.items()[this.activeIndex()]?.id === item.id;
	}

	// ── Input handling ──────────────────────────────────────────────────────────
	onInput(value: string): void {
		this.query.set(value);
		this.activeIndex.set(0);
		this.queryChange.emit(value);
	}

	onKeydown(event: KeyboardEvent): void {
		switch (event.key) {
			case "ArrowDown":
				event.preventDefault();
				this.move(1);
				break;
			case "ArrowUp":
				event.preventDefault();
				this.move(-1);
				break;
			case "Home":
				event.preventDefault();
				this.setActive(0);
				break;
			case "End":
				event.preventDefault();
				this.setActive(this.items().length - 1);
				break;
			case "Enter":
				event.preventDefault();
				this.runActive();
				break;
		}
	}

	/**
	 * Two-stage Escape, handled on the native `<dialog>` `cancel` event (where
	 * preventDefault actually suppresses the close, unlike keydown): with text in
	 * the field, clear it and stay open; otherwise let interop-dialog close.
	 */
	onCancel(event: Event): void {
		if (this.query()) {
			event.preventDefault();
			this.clearQuery();
		}
	}

	private move(delta: number): void {
		const n = this.items().length;
		if (n === 0) return;
		let next = this.activeIndex() + delta;
		if (next < 0) next = n - 1; // wrap
		else if (next >= n) next = 0;
		this.setActive(next);
	}

	private setActive(index: number): void {
		const n = this.items().length;
		if (n === 0) return;
		this.activeIndex.set(Math.min(Math.max(index, 0), n - 1));
		this.scrollActiveIntoView();
	}

	private clearQuery(): void {
		this.query.set("");
		this.activeIndex.set(0);
		const el = this.inputEl()?.nativeElement;
		if (el) el.value = "";
		this.queryChange.emit("");
	}

	// ── Activation ──────────────────────────────────────────────────────────────
	runActive(): void {
		this.activate(this.items()[this.activeIndex()]);
	}

	onOptionClick(item: CommandItem, index: number): void {
		this.activeIndex.set(index);
		this.activate(item);
	}

	onOptionHover(index: number): void {
		this.activeIndex.set(index);
	}

	private activate(item: CommandItem | undefined): void {
		if (!item || item.disabled) return;
		this.command.emit(item);
		// Self-close through the native dialog; interop-dialog emits (closed),
		// the consumer resets [open] to false.
		this.hostEl.nativeElement.close();
	}

	private scrollActiveIntoView(): void {
		queueMicrotask(() => {
			const id = this.activeId();
			if (id) document.getElementById(id)?.scrollIntoView({ block: "nearest" });
		});
	}
}
