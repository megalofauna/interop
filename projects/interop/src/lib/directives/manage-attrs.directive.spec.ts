import {
	ComponentFixture,
	TestBed,
	fakeAsync,
	tick,
} from "@angular/core/testing";
import { Component, signal } from "@angular/core";
import { ManageAttributesDirective } from "./manage-attrs.directive";
import {
	InteropAttribute,
	SetAttrsConfig,
} from "../services/interop-attribute.service";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SIMPLE_CONFIG: SetAttrsConfig = {
	button: { type: "button" },
};

const ALT_CONFIG: SetAttrsConfig = {
	span: { "aria-hidden": "true" },
};

@Component({
	standalone: true,
	imports: [ManageAttributesDirective],
	template: `
		<div
			[manageAttrs]="config()"
			[override]="override()"
			[observeSubtree]="observeSubtree()"
			[debounceMs]="debounceMs()"
		>
			<button>Child</button>
		</div>
	`,
})
class TestHost {
	config = signal<SetAttrsConfig | null>(SIMPLE_CONFIG);
	override = signal<boolean>(false);
	observeSubtree = signal<boolean | null>(null);
	debounceMs = signal<number>(16);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Collects MutationObserver instances created during a test. */
interface ObserverHandle {
	observe: jasmine.Spy;
	disconnect: jasmine.Spy;
	triggerMutation: () => void;
}

function spyOnMutationObserver(): ObserverHandle[] {
	const handles: ObserverHandle[] = [];

	spyOn(window, "MutationObserver").and.callFake((cb: MutationCallback) => {
		const handle: ObserverHandle = {
			observe: jasmine.createSpy("observe"),
			disconnect: jasmine.createSpy("disconnect"),
			triggerMutation: () => cb([], {} as MutationObserver),
		};
		handles.push(handle);
		return handle as unknown as MutationObserver;
	});

	return handles;
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe("ManageAttributesDirective", () => {
	let fixture: ComponentFixture<TestHost>;
	let host: TestHost;
	let attrsManager: jasmine.SpyObj<InteropAttribute>;

	beforeEach(async () => {
		attrsManager = jasmine.createSpyObj("InteropAttribute", [
			"applyConfig",
			"deriveObserverOptions",
		]);
		attrsManager.deriveObserverOptions.and.returnValue({
			childList: true,
			subtree: false,
		});

		await TestBed.configureTestingModule({
			imports: [TestHost],
			providers: [{ provide: InteropAttribute, useValue: attrsManager }],
		}).compileComponents();

		fixture = TestBed.createComponent(TestHost);
		host = fixture.componentInstance;
		// detectChanges is intentionally deferred to each describe group so that
		// MutationObserver spies can be installed before the effect runs.
	});

	// ── Attribute application ─────────────────────────────────────────────────

	describe("Attribute application", () => {
		beforeEach(() => fixture.detectChanges());

		it("calls applyConfig with the initial config on init", () => {
			expect(attrsManager.applyConfig).toHaveBeenCalledWith(
				jasmine.anything(),
				jasmine.any(HTMLElement),
				SIMPLE_CONFIG,
				{ override: false },
			);
		});

		it("passes a null config through to applyConfig", async () => {
			host.config.set(null);
			fixture.detectChanges();
			await fixture.whenStable();

			expect(attrsManager.applyConfig).toHaveBeenCalledWith(
				jasmine.anything(),
				jasmine.any(HTMLElement),
				null,
				{ override: false },
			);
		});

		it("reapplies when [manageAttrs] changes", async () => {
			host.config.set(ALT_CONFIG);
			fixture.detectChanges();
			await fixture.whenStable();

			expect(attrsManager.applyConfig).toHaveBeenCalledWith(
				jasmine.anything(),
				jasmine.any(HTMLElement),
				ALT_CONFIG,
				jasmine.anything(),
			);
		});

		it("forwards [override]='true' to applyConfig", async () => {
			host.override.set(true);
			fixture.detectChanges();
			await fixture.whenStable();

			expect(attrsManager.applyConfig).toHaveBeenCalledWith(
				jasmine.anything(),
				jasmine.any(HTMLElement),
				jasmine.anything(),
				{ override: true },
			);
		});
	});

	// ── MutationObserver lifecycle ────────────────────────────────────────────

	describe("MutationObserver lifecycle", () => {
		let handles: ObserverHandle[];

		beforeEach(() => {
			handles = spyOnMutationObserver();
			fixture.detectChanges();
		});

		it("creates one observer on init when config is non-null", () => {
			expect(handles.length).toBe(1);
		});

		it("calls observe() on the host element", () => {
			expect(handles[0].observe).toHaveBeenCalledWith(
				jasmine.any(HTMLElement),
				jasmine.objectContaining({ childList: true }),
			);
		});

		it("does not create an observer when config is null", async () => {
			host.config.set(null);
			fixture.detectChanges();
			await fixture.whenStable();

			// Initial observer created, then disconnected; no second observer.
			expect(handles.length).toBe(1);
			expect(handles[0].disconnect).toHaveBeenCalled();
		});

		it("disconnects the previous observer when config changes", async () => {
			host.config.set(ALT_CONFIG);
			fixture.detectChanges();
			await fixture.whenStable();

			expect(handles[0].disconnect).toHaveBeenCalled();
			expect(handles.length).toBe(2);
		});

		it("disconnects the observer on directive destroy", () => {
			fixture.destroy();
			expect(handles[0].disconnect).toHaveBeenCalled();
		});
	});

	// ── observeSubtree resolution ─────────────────────────────────────────────

	describe("observeSubtree resolution", () => {
		let handles: ObserverHandle[];

		beforeEach(() => {
			handles = spyOnMutationObserver();
		});

		it("uses the derived subtree value when [observeSubtree] is null", () => {
			attrsManager.deriveObserverOptions.and.returnValue({
				childList: true,
				subtree: true,
			});
			fixture.detectChanges();

			expect(handles[0].observe).toHaveBeenCalledWith(
				jasmine.anything(),
				jasmine.objectContaining({ subtree: true }),
			);
		});

		it("overrides the derived value when [observeSubtree] is true", () => {
			attrsManager.deriveObserverOptions.and.returnValue({
				childList: true,
				subtree: false,
			});
			host.observeSubtree.set(true);
			fixture.detectChanges();

			expect(handles[0].observe).toHaveBeenCalledWith(
				jasmine.anything(),
				jasmine.objectContaining({ subtree: true }),
			);
		});

		it("overrides the derived value when [observeSubtree] is false", () => {
			attrsManager.deriveObserverOptions.and.returnValue({
				childList: true,
				subtree: true,
			});
			host.observeSubtree.set(false);
			fixture.detectChanges();

			expect(handles[0].observe).toHaveBeenCalledWith(
				jasmine.anything(),
				jasmine.objectContaining({ subtree: false }),
			);
		});
	});

	// ── Debounced reapplication ───────────────────────────────────────────────

	describe("Debounced reapplication from DOM mutations", () => {
		let handles: ObserverHandle[];

		beforeEach(() => {
			handles = spyOnMutationObserver();
			fixture.detectChanges();
			attrsManager.applyConfig.calls.reset();
		});

		it("does not call applyConfig immediately on mutation", fakeAsync(() => {
			handles[0].triggerMutation();
			expect(attrsManager.applyConfig).not.toHaveBeenCalled();
			tick(16);
		}));

		it("calls applyConfig once after the debounce window elapses", fakeAsync(() => {
			handles[0].triggerMutation();
			tick(16);
			expect(attrsManager.applyConfig).toHaveBeenCalledTimes(1);
		}));

		it("coalesces multiple mutations fired within the debounce window", fakeAsync(() => {
			handles[0].triggerMutation();
			tick(8);
			handles[0].triggerMutation();
			tick(8);
			handles[0].triggerMutation();
			tick(16);

			expect(attrsManager.applyConfig).toHaveBeenCalledTimes(1);
		}));

		it("respects a custom [debounceMs] value", fakeAsync(() => {
			host.debounceMs.set(50);
			fixture.detectChanges();
			attrsManager.applyConfig.calls.reset();

			handles[handles.length - 1].triggerMutation();

			tick(49);
			expect(attrsManager.applyConfig).not.toHaveBeenCalled();

			tick(1);
			expect(attrsManager.applyConfig).toHaveBeenCalledTimes(1);
		}));
	});

	// ── Cleanup on destroy ────────────────────────────────────────────────────

	describe("Cleanup on destroy", () => {
		let handles: ObserverHandle[];

		beforeEach(() => {
			handles = spyOnMutationObserver();
			fixture.detectChanges();
			attrsManager.applyConfig.calls.reset();
		});

		it("disconnects the observer when the directive is destroyed", () => {
			fixture.destroy();
			expect(handles[0].disconnect).toHaveBeenCalled();
		});

		it("clears a pending debounce timer so applyConfig is not called after destroy", fakeAsync(() => {
			handles[0].triggerMutation(); // starts the 16ms timer
			fixture.destroy(); // onCleanup should cancel it
			tick(100);
			expect(attrsManager.applyConfig).not.toHaveBeenCalled();
		}));
	});
});
