import { DestroyRef, Directive, inject, input, output } from "@angular/core";
import { DOCUMENT } from "@angular/common";

/**
 * InteropHotkey — a declarative global keyboard shortcut.
 *
 * Binds a document-level shortcut and emits when it fires. The platform-aware
 * `mod` token resolves to ⌘ (Meta) on Apple platforms and Ctrl elsewhere, so
 * `interopHotkey="mod+k"` is ⌘K on macOS and Ctrl+K on Windows/Linux.
 *
 * The platform has no "keyboard invoker" — invoker commands (`command` /
 * `commandfor`) fire on pointer/activation only — so a keyboard shortcut is
 * inherently JavaScript. This is that one small piece, made reusable: pair it
 * with an element that opens (e.g. a command palette's `.showModal()`).
 *
 * @example
 * ```html
 * <div interopHotkey="mod+k" (hotkey)="palette.open()"></div>
 * ```
 *
 * Spec grammar: `+`-separated modifiers then the key, case-insensitive.
 * Modifiers: `mod` (⌘/Ctrl), `cmd`/`meta`, `ctrl`/`control`, `alt`/`option`,
 * `shift`. Examples: `"mod+k"`, `"ctrl+shift+p"`, `"/"`.
 */
@Directive({
	selector: "[interopHotkey]",
	standalone: true,
})
export class InteropHotkey {
	/** Shortcut spec, e.g. "mod+k". Case-insensitive. */
	readonly hotkey = input.required<string>({ alias: "interopHotkey" });

	/** Fires when the shortcut matches; the (already default-prevented) event
	 * is passed so consumers can inspect it. */
	readonly triggered = output<KeyboardEvent>({ alias: "hotkey" });

	private readonly doc = inject(DOCUMENT);

	constructor() {
		const onKeydown = (event: KeyboardEvent): void => {
			if (this.matches(event)) {
				event.preventDefault();
				this.triggered.emit(event);
			}
		};
		this.doc.addEventListener("keydown", onKeydown);
		inject(DestroyRef).onDestroy(() =>
			this.doc.removeEventListener("keydown", onKeydown),
		);
	}

	private matches(event: KeyboardEvent): boolean {
		const spec = this.hotkey().toLowerCase().trim();
		if (!spec) return false;

		const tokens = spec.split("+").map((t) => t.trim());
		const key = tokens.pop();
		if (!key) return false;

		const want = { meta: false, ctrl: false, alt: false, shift: false };
		for (const mod of tokens) {
			switch (mod) {
				case "mod":
					if (isApplePlatform(this.doc)) want.meta = true;
					else want.ctrl = true;
					break;
				case "cmd":
				case "meta":
					want.meta = true;
					break;
				case "ctrl":
				case "control":
					want.ctrl = true;
					break;
				case "alt":
				case "option":
					want.alt = true;
					break;
				case "shift":
					want.shift = true;
					break;
			}
		}

		return (
			event.metaKey === want.meta &&
			event.ctrlKey === want.ctrl &&
			event.altKey === want.alt &&
			event.shiftKey === want.shift &&
			event.key.toLowerCase() === key
		);
	}
}

function isApplePlatform(doc: Document): boolean {
	const nav = doc.defaultView?.navigator as
		| (Navigator & { userAgentData?: { platform?: string } })
		| undefined;
	if (!nav) return false;
	const platform =
		nav.userAgentData?.platform || nav.platform || nav.userAgent || "";
	return /mac|iphone|ipad|ipod/i.test(platform);
}
