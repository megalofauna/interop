import {
	Component,
	ChangeDetectionStrategy,
	computed,
	inject,
	signal,
} from "@angular/core";
import { map, switchMap, throwError, timer } from "rxjs";
import {
	InteropToastViewport,
	InteropToastService,
	InteropButton,
	InteropTable,
	InteropCellDef,
	CodeBlock,
	type CodeFile,
	type TableColumn,
	type ToastPosition,
} from "interop";
import { DemoPage } from "../../components/demo-page/demo-page";
import { DemoSection } from "../../components/demo-section/demo-section";
import { DemoExample } from "../../components/demo-example/demo-example";
import { DemoState } from "../../components/demo-state/demo-state";
import { DemoStateItem } from "../../components/demo-state/demo-state-item";
import { DemoMasthead } from "../../components/demo-masthead/demo-masthead";

type TokenEntry = { property: string; default: string };

interface ApiEntry {
	/** Present because the surface spans a component, a service and a handle. */
	component?: string;
	name: string;
	type: string;
	default: string;
	description: string;
	required?: boolean;
}

interface MethodEntry {
	component: string;
	name: string;
	signature: string;
	returns: string;
	description: string;
}

const POSITIONS: ToastPosition[] = [
	"top-left",
	"top-center",
	"top-right",
	"bottom-left",
	"bottom-center",
	"bottom-right",
];

@Component({
	selector: "toast-page",
	standalone: true,
	imports: [
		InteropToastViewport,
		InteropButton,
		InteropTable,
		InteropCellDef,
		CodeBlock,
		DemoPage,
		DemoSection,
		DemoExample,
		DemoState,
		DemoStateItem,
		DemoMasthead,
	],
	templateUrl: "./toast-page.html",
	styleUrl: "./toast-page.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastPage {
	protected readonly toast = inject(InteropToastService);

	/** Live count of toasts in service state — including any past `maxVisible`. */
	protected readonly toastCount = this.toast.count;

	/** Live status-palette preview — drives `itx-status-palette` on the viewport. */
	readonly palette = signal<"seventies" | "eighties">("seventies");
	readonly palettes = [
		{ id: "seventies", label: "70s — earthy" },
		{ id: "eighties", label: "80s — OS" },
	] as const;

	/** Bound to the viewport's `position` input. */
	readonly position = signal<ToastPosition>("bottom-right");
	readonly positions = POSITIONS;

	/** Bound to the viewport's `maxVisible` input. */
	readonly maxVisible = signal(3);
	readonly maxVisibleChoices = [1, 3, 5];

	/** How many of the queued toasts the viewport actually renders. */
	protected readonly renderedCount = computed(() =>
		Math.min(this.toastCount(), this.maxVisible()),
	);

	/** Lifecycle readouts for the state panels. */
	readonly lastDismissReason = signal("—");
	readonly lastAction = signal("—");

	// ── Usage ────────────────────────────────────────────────────────────

	showBasic(): void {
		this.toast.success("Docking request approved. Bay 3 is yours.");
	}

	showDescription(): void {
		this.toast.info("Cargo manifest updated", {
			description: "47 items verified against the bill of lading.",
		});
	}

	showAction(): void {
		const ref = this.toast.show("Crate jettisoned", {
			description: "Manifest entry 12 removed.",
			action: {
				label: "Undo",
				id: "undo",
				altText: "Open the manifest and restore entry 12",
			},
		});
		ref.onAction().subscribe((id) => this.lastAction.set(id));
		ref
			.afterDismissed()
			.subscribe((reason) => this.lastDismissReason.set(reason));
	}

	// ── Types ────────────────────────────────────────────────────────────

	showDefault(): void {
		this.toast.show("Telemetry sync complete.");
	}

	showSuccess(): void {
		this.toast.success("Docking request approved. Bay 3 is yours.");
	}

	showError(): void {
		this.toast.error("Hull breach detected. Emergency bulkhead engaged.");
	}

	showWarning(): void {
		this.toast.warning("Fuel reserves below 20%. Plot a course to the depot.");
	}

	showInfo(): void {
		this.toast.info("Cargo manifest updated. 47 items verified.");
	}

	showLoading(): void {
		this.toast.loading("Spinning up the reactor…");
	}

	// ── Async ────────────────────────────────────────────────────────────

	observeSuccess(): void {
		this.toast.observe(
			timer(2000).pipe(map(() => ({ name: "manifest.csv" }))),
			{
				loading: "Uploading manifest…",
				success: (res) => `Uploaded ${res.name}`,
				error: (err) => `Upload failed: ${(err as Error).message}`,
			},
		);
	}

	observeFailure(): void {
		this.toast.observe(
			timer(2000).pipe(
				switchMap(() => throwError(() => new Error("Relay timeout"))),
			),
			{
				loading: "Contacting relay…",
				success: "Relay acknowledged",
				error: (err) => `Failed: ${(err as Error).message}`,
			},
		);
	}

	promiseExample(): void {
		const work = new Promise<number>((resolve) =>
			setTimeout(() => resolve(47), 2000),
		);
		this.toast.promise(work, {
			loading: "Counting crates…",
			success: (n) => `${n} crates accounted for`,
			error: "Count aborted",
		});
	}

	// ── Lifecycle ────────────────────────────────────────────────────────

	showPersistent(): void {
		const ref = this.toast.show("This one waits for you.", {
			duration: 0,
			description: "duration: 0 means no timer — so a close button appears.",
		});
		ref
			.afterDismissed()
			.subscribe((reason) => this.lastDismissReason.set(reason));
	}

	showDismissibleSuccess(): void {
		const ref = this.toast.success("Forced a close button on a 6s toast.", {
			dismissible: true,
		});
		ref
			.afterDismissed()
			.subscribe((reason) => this.lastDismissReason.set(reason));
	}

	showThenDismiss(): void {
		const ref = this.toast.info("Self-destructing in 1.5s (programmatic).");
		ref
			.afterDismissed()
			.subscribe((reason) => this.lastDismissReason.set(reason));
		setTimeout(() => ref.dismiss(), 1500);
	}

	dismissAll(): void {
		this.toast.dismissAll();
	}

	// ── Stack ────────────────────────────────────────────────────────────

	fillStack(): void {
		for (let i = 1; i <= 5; i++) {
			this.toast.info(`Signal ${i} of 5 received.`, { duration: 0 });
		}
	}

	// ── Code snippets ────────────────────────────────────────────────────

	readonly setupHtml = `<!-- app.html — one viewport for the whole app -->
<router-outlet />
<interop-toast-viewport />`;

	readonly setupTs = `private readonly toast = inject(InteropToastService);

showBasic(): void {
  this.toast.success("Docking request approved. Bay 3 is yours.");
}`;

	readonly setupFiles = computed<CodeFile[]>(() => [
		{ label: "app.html", language: "html", code: this.setupHtml },
		{ label: "component.ts", language: "ts", code: this.setupTs },
	]);

	readonly descriptionCode = `this.toast.info("Cargo manifest updated", {
  description: "47 items verified against the bill of lading.",
});`;

	readonly actionCode = `const ref = this.toast.show("Crate jettisoned", {
  description: "Manifest entry 12 removed.",
  action: {
    label: "Undo",
    id: "undo",
    // Describes another route to the same outcome, for AT users.
    altText: "Open the manifest and restore entry 12",
  },
});

ref.onAction().subscribe((id) => {
  if (id === "undo") this.restoreCrate();
});`;

	readonly typesCode = `this.toast.show("Telemetry sync complete.");          // default
this.toast.success("Docking request approved.");
this.toast.error("Hull breach detected.");            // duration 0
this.toast.warning("Fuel reserves below 20%.");       // duration 0
this.toast.info("Cargo manifest updated.");
this.toast.loading("Spinning up the reactor…");       // duration 0`;

	readonly observeCode = `this.toast.observe(
  this.http.post<UploadResult>("/api/manifest", body),
  {
    loading: "Uploading manifest…",
    success: (res) => \`Uploaded \${res.name}\`,
    error: (err) => \`Upload failed: \${err.message}\`,
  },
  // 'unsubscribe' cancels the request if the user dismisses the toast.
  { cancelBehavior: "detach" },
);`;

	readonly promiseCode = `this.toast.promise(countCrates(), {
  loading: "Counting crates…",
  success: (n) => \`\${n} crates accounted for\`,
  error: "Count aborted",
});`;

	readonly lifecycleCode = `// No timer, so a close button is added automatically.
const ref = this.toast.show("This one waits for you.", { duration: 0 });

// Force a close button onto a toast that would otherwise expire silently.
this.toast.success("Saved", { dismissible: true });

ref.afterDismissed().subscribe((reason) => {
  // 'timeout' | 'dismissed' | 'programmatic' | 'swipe' | 'action'
  console.log(reason);
});

ref.dismiss();          // reason: 'programmatic'
this.toast.dismissAll(); // clears everything, including 'prevent' toasts`;

	readonly placementHtml = `<interop-toast-viewport
  [position]="position()"
  [maxVisible]="maxVisible()"
/>`;

	readonly placementTs = `readonly position = signal<ToastPosition>("bottom-right");
readonly maxVisible = signal(3);`;

	readonly placementFiles = computed<CodeFile[]>(() => [
		{ label: "template.html", language: "html", code: this.placementHtml },
		{ label: "component.ts", language: "ts", code: this.placementTs },
	]);

	readonly configCode = `// app.config.ts — every value is optional.
providers: [
  {
    provide: INTEROP_TOAST_CONFIG,
    useValue: {
      position: "top-right",
      duration: 8000,
      maxVisible: 5,
    } satisfies Partial<InteropToastConfig>,
  },
];`;

	// ── Keyboard notes (in-section, attached to what they explain) ────────

	// ── CSS tokens ───────────────────────────────────────────────────────

	tokenColumns: TableColumn<TokenEntry>[] = [
		{ key: "property", label: "Property" },
		{ key: "default", label: "Default" },
	];

	tokenEntries: TokenEntry[] = [
		// Viewport
		{ property: "--itx-toast-z-index", default: "9999" },
		{ property: "--itx-toast-gap", default: "var(--itx-spacing-3) — 12px" },
		{ property: "--itx-toast-offset", default: "var(--itx-spacing-4) — 16px" },
		{
			property: "--itx-toast-width",
			default: "18rem — 288px (22rem / 352px above 99rem)",
		},
		{
			property: "--itx-toast-max-width",
			default: "calc(var(--itx-toast-width) + 2 * var(--itx-toast-offset))",
		},
		// Item container
		{ property: "--itx-toast-background", default: "var(--itx-surface-above)" },
		{ property: "--itx-toast-foreground", default: "var(--itx-contrast-6)" },
		{ property: "--itx-toast-border-width", default: "0px" },
		{ property: "--itx-toast-border-color", default: "var(--itx-contrast-3)" },
		{
			property: "--itx-toast-border-radius",
			default: "var(--itx-radius-none) — 0",
		},
		{ property: "--itx-toast-accent-width", default: "3px" },
		{ property: "--itx-toast-accent-color", default: "var(--itx-contrast-3)" },
		{ property: "--itx-toast-padding", default: "var(--itx-spacing-4) — 16px" },
		{
			property: "--itx-toast-item-gap",
			default: "var(--itx-spacing-4) — 16px",
		},
		{ property: "--itx-toast-shadow", default: "var(--itx-shadow-md)" },
		// Typography
		{ property: "--itx-toast-font-size", default: "0.875rem — 14px" },
		{
			property: "--itx-toast-line-height",
			default: "1.2857 — 18px on 14px",
		},
		{ property: "--itx-toast-message-font-weight", default: "600" },
		{
			property: "--itx-toast-description-font-size",
			default: "0.875rem — 14px",
		},
		{
			property: "--itx-toast-description-margin-block-start",
			default: "var(--itx-spacing-0) — 0",
		},
		{ property: "--itx-toast-description-opacity", default: "1" },
		// Motion
		{
			property: "--itx-toast-enter-duration",
			default: "var(--itx-duration-base) — 200ms",
		},
		{
			property: "--itx-toast-enter-easing",
			default: "var(--itx-easing-decelerate) — cubic-bezier(0, 0, 0.2, 1)",
		},
		// Action button
		{
			property: "--itx-toast-actions-gap",
			default: "var(--itx-spacing-2) — 8px",
		},
		{
			property: "--itx-toast-action-padding-block",
			default: "var(--itx-spacing-2) — 8px",
		},
		{
			property: "--itx-toast-action-padding-inline",
			default: "var(--itx-spacing-3) — 12px",
		},
		{ property: "--itx-toast-action-border-width", default: "1px" },
		{
			property: "--itx-toast-action-border-color",
			default: "var(--itx-contrast-3)",
		},
		{
			property: "--itx-toast-action-border-radius",
			default: "var(--itx-radius-none) — 0",
		},
		{ property: "--itx-toast-action-font-size", default: "0.875rem — 14px" },
		{ property: "--itx-toast-action-font-weight", default: "400" },
		{
			property: "--itx-toast-action-background-hover",
			default: "var(--itx-contrast-1)",
		},
		// Close button
		{
			property: "--itx-toast-close-size",
			default: "var(--itx-spacing-8) — 32px",
		},
		{
			property: "--itx-toast-close-border-radius",
			default: "var(--itx-radius-none) — 0",
		},
		{ property: "--itx-toast-close-opacity", default: "1" },
		{ property: "--itx-toast-close-opacity-hover", default: "1" },
		{
			property: "--itx-toast-close-background-hover",
			default: "var(--itx-contrast-1)",
		},
		// Focus
		{ property: "--itx-toast-focus-width", default: "2px" },
		{
			property: "--itx-toast-focus-color",
			default: "var(--itx-colorway-solid)",
		},
		{
			property: "--itx-toast-focus-offset",
			default: "2px — the toast item itself",
		},
		{
			property: "--itx-toast-focus-offset-tight",
			default: "1px — buttons inside the panel",
		},
	];

	// ── API ──────────────────────────────────────────────────────────────

	apiColumns: TableColumn<ApiEntry>[] = [
		{ key: "component", label: "Component", sticky: true },
		{ key: "name", label: "Input" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	apiEntries: ApiEntry[] = [
		{
			component: "interop-toast-viewport",
			name: "position",
			type: "ToastPosition | undefined",
			default: "undefined",
			description:
				"Corner the stack is anchored to. Falls back to INTEROP_TOAST_CONFIG, then 'bottom-right'.",
		},
		{
			component: "interop-toast-viewport",
			name: "maxVisible",
			type: "number | undefined",
			default: "undefined",
			description:
				"How many toasts render at once — the most recent N. Older toasts stay in service state and start their timer when they become visible. Falls back to config, then 3.",
		},
		{
			component: "interop-toast-viewport",
			name: "hotkey",
			type: "string | undefined",
			default: "undefined",
			description:
				"Global shortcut that moves focus into the toast region. Modifiers plus a KeyboardEvent.code, e.g. 'alt+KeyT'. Falls back to config, then 'alt+KeyT'.",
		},
	];

	methodColumns: TableColumn<MethodEntry>[] = [
		{ key: "component", label: "Class", sticky: true },
		{ key: "name", label: "Member" },
		{ key: "signature", label: "Signature" },
		{ key: "returns", label: "Returns" },
		{ key: "description", label: "Description" },
	];

	methodEntries: MethodEntry[] = [
		{
			component: "InteropToastService",
			name: "show()",
			signature: "(message: string, options?: InteropToastOptions)",
			returns: "InteropToastHandle",
			description:
				"Show a toast. Type defaults to 'default' unless options.type says otherwise.",
		},
		{
			component: "InteropToastService",
			name: "success()",
			signature: "(message, options?: Omit<InteropToastOptions, 'type'>)",
			returns: "InteropToastHandle",
			description:
				"Success toast. Auto-dismisses after the configured duration.",
		},
		{
			component: "InteropToastService",
			name: "error()",
			signature: "(message, options?)",
			returns: "InteropToastHandle",
			description:
				"Error toast. Duration resolves to 0 and role becomes 'alert' — it persists until dismissed.",
		},
		{
			component: "InteropToastService",
			name: "warning()",
			signature: "(message, options?)",
			returns: "InteropToastHandle",
			description: "Warning toast. Duration resolves to 0.",
		},
		{
			component: "InteropToastService",
			name: "info()",
			signature: "(message, options?)",
			returns: "InteropToastHandle",
			description: "Info toast. Auto-dismisses after the configured duration.",
		},
		{
			component: "InteropToastService",
			name: "loading()",
			signature: "(message, options?)",
			returns: "InteropToastHandle",
			description:
				"Loading toast. Duration resolves to 0; dismissible unless cancelBehavior is 'prevent'.",
		},
		{
			component: "InteropToastService",
			name: "observe()",
			signature:
				"(source$: Observable<T>, messages: ToastAsyncMessages<T>, options?)",
			returns: "InteropToastHandle",
			description:
				"Starts as 'loading', then updates itself to 'success' or 'error' from the stream. Honours cancelBehavior on dismissal.",
		},
		{
			component: "InteropToastService",
			name: "promise()",
			signature:
				"(promise: Promise<T>, messages: ToastAsyncMessages<T>, options?)",
			returns: "InteropToastHandle",
			description:
				"As observe(), for a Promise. Nothing to cancel, so 'unsubscribe' has no effect here.",
		},
		{
			component: "InteropToastService",
			name: "dismiss()",
			signature: "(id: string)",
			returns: "void",
			description: "Dismiss one toast by id with reason 'programmatic'.",
		},
		{
			component: "InteropToastService",
			name: "dismissAll()",
			signature: "()",
			returns: "void",
			description:
				"Dismiss every active toast with reason 'programmatic' — which is the only reason that clears a 'prevent' toast.",
		},
		{
			component: "InteropToastService",
			name: "count",
			signature: "Signal<number>",
			returns: "number",
			description:
				"Toasts currently in state, including any beyond maxVisible that are not rendered.",
		},
		{
			component: "InteropToastHandle",
			name: "id",
			signature: "readonly id: string",
			returns: "string",
			description: "Unique identifier for this toast.",
		},
		{
			component: "InteropToastHandle",
			name: "dismiss()",
			signature: "()",
			returns: "void",
			description: "Dismiss this toast with reason 'programmatic'.",
		},
		{
			component: "InteropToastHandle",
			name: "update()",
			signature:
				"(patch: { message?, description?, type?, action?, duration?, dismissible? })",
			returns: "void",
			description:
				"Patch the toast in place after creation — how observe() and promise() transition state.",
		},
		{
			component: "InteropToastHandle",
			name: "afterDismissed()",
			signature: "()",
			returns: "Observable<ToastDismissReason>",
			description:
				"Emits 'timeout' | 'dismissed' | 'programmatic' | 'swipe' | 'action', then completes.",
		},
		{
			component: "InteropToastHandle",
			name: "onAction()",
			signature: "()",
			returns: "Observable<string>",
			description:
				"Emits action.id (or the label, if no id) when the action button is clicked. Completes on dismissal.",
		},
	];

	optionColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Option" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	optionEntries: ApiEntry[] = [
		{
			name: "type",
			type: "'default' | 'success' | 'error' | 'warning' | 'info' | 'loading'",
			default: "'default'",
			description:
				"Sets the data-type variant, and for 'error' switches the ARIA role to 'alert'.",
		},
		{
			name: "description",
			type: "string",
			default: "undefined",
			description:
				"Second line below the message. Same size as the message; only the weight differs.",
		},
		{
			name: "duration",
			type: "number",
			default: "6000 (0 for error / warning / loading)",
			description:
				"Auto-dismiss delay in ms. 0 or Infinity means no timer. An explicit value always wins.",
		},
		{
			name: "action",
			type: "ToastAction",
			default: "undefined",
			description:
				"{ label, id?, altText? }. Clicking the button emits onAction() and dismisses the toast with reason 'action'.",
		},
		{
			name: "dismissible",
			type: "boolean | 'auto'",
			default: "'auto'",
			description:
				"'auto' shows a close button only when the toast will not leave on its own — so a plain 6s success toast has none.",
		},
		{
			name: "cancelBehavior",
			type: "'unsubscribe' | 'detach' | 'prevent'",
			default: "'detach'",
			description:
				"For observe()/promise(): 'detach' lets the work finish, 'unsubscribe' cancels the subscription, 'prevent' blocks user dismissal while loading.",
		},
		{
			name: "data",
			type: "unknown",
			default: "undefined",
			description: "Arbitrary payload carried on the toast state.",
		},
	];

	configColumns: TableColumn<ApiEntry>[] = [
		{ key: "name", label: "Key" },
		{ key: "type", label: "Type" },
		{ key: "default", label: "Default" },
		{ key: "description", label: "Description" },
	];

	configEntries: ApiEntry[] = [
		{
			name: "duration",
			type: "number",
			default: "6000",
			description: "Auto-dismiss delay for types that do not force 0.",
		},
		{
			name: "position",
			type: "ToastPosition",
			default: "'bottom-right'",
			description: "Default corner for every viewport below this provider.",
		},
		{
			name: "maxVisible",
			type: "number",
			default: "3",
			description: "Default number of simultaneously rendered toasts.",
		},
		{
			name: "hotkey",
			type: "string",
			default: "'alt+KeyT'",
			description: "Shortcut that moves focus into the toast region.",
		},
		{
			name: "swipeDismiss",
			type: "boolean",
			default: "true",
			description: "Enable the pointer swipe-to-dismiss gesture.",
		},
		{
			name: "swipeThreshold",
			type: "number",
			default: "50",
			description:
				"Distance in px past which a swipe dismisses. A fast flick dismisses below it on velocity alone.",
		},
		{
			name: "gap",
			type: "number",
			default: "14",
			description:
				"Not read — spacing between toasts comes from --itx-toast-gap.",
		},
		{
			name: "pauseOnHover",
			type: "boolean",
			default: "true",
			description: "Not read — pausing on hover is currently unconditional.",
		},
		{
			name: "pauseOnFocusWithin",
			type: "boolean",
			default: "true",
			description: "Not read — pausing on focus is currently unconditional.",
		},
		{
			name: "pauseOnDocumentHidden",
			type: "boolean",
			default: "true",
			description:
				"Not read — pausing on a hidden document is currently unconditional.",
		},
		{
			name: "expandOnHover",
			type: "boolean",
			default: "true",
			description:
				"Not read — the expanded state is tracked but not yet styled.",
		},
	];
}
