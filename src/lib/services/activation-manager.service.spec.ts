import { ActivationManagerService } from "./activation-manager.service";
import type { ActivationRegistration } from "./activation-manager.service";

describe("ActivationManagerService", () => {
  let service: ActivationManagerService;

  beforeEach(() => {
    service = new ActivationManagerService();
  });

  describe("basic registry behavior", () => {
    it("registers and triggers a handler by id", () => {
      const calls: any[] = [];
      const reg = service.register("save", (payload: any) => {
        calls.push(payload);
      });

      expect(service.has("save")).toBeTrue();
      service.trigger("save", { id: 1 });
      service.trigger("save", { id: 2 });

      expect(calls).toEqual([{ id: 1 }, { id: 2 }]);

      // Unregister and ensure no further triggers
      reg.unregister();
      expect(service.has("save")).toBeFalse();
      service.trigger("save", { id: 3 });
      expect(calls).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it("replaces an existing handler when registering with the same id", () => {
      const callsA: any[] = [];
      const callsB: any[] = [];

      service.register("action", (p) => callsA.push(p));
      service.trigger("action", "A1");
      expect(callsA).toEqual(["A1"]);

      service.register("action", (p) => callsB.push(p));
      service.trigger("action", "B1");
      service.trigger("action", "B2");

      expect(callsA).toEqual(["A1"]);
      expect(callsB).toEqual(["B1", "B2"]);
    });

    it("listIds reports current registrations", () => {
      service.register("a", () => {});
      service.register("b", () => {});
      service.register("c", () => {});
      expect(service.listIds().sort()).toEqual(["a", "b", "c"]);
    });

    it("unregister() is a no-op when id is missing", () => {
      // No throws, no changes
      expect(service.has("unknown")).toBeFalse();
      service.unregister("unknown");
      expect(service.has("unknown")).toBeFalse();
    });

    it("clear() removes all handlers and cancels scheduled executions", () => {
      const calls: string[] = [];
      const reg = service.register(
        "debounced",
        (p: string) => {
          calls.push(p);
        },
        { debounceMs: 200 },
      );

      // Schedule a debounced call
      reg.instance("x");
      // Clear registry before debounce fires
      service.clear();

      expect(service.listIds()).toEqual([]);
      // Debounced call should have been cancelled
      expect(calls).toEqual([]);
    });
  });

  describe("trigger behavior and runtime controls", () => {
    it("disable() prevents future triggers until enable()", () => {
      const calls: string[] = [];
      const reg = service.register("toggle", (p: string) => calls.push(p));

      service.trigger("toggle", "1");
      expect(calls).toEqual(["1"]);

      service.disable("toggle");
      service.trigger("toggle", "2");
      expect(calls).toEqual(["1"]);

      service.enable("toggle");
      service.trigger("toggle", "3");
      expect(calls).toEqual(["1", "3"]);
    });

    it("cancel() aborts scheduled debounced execution", () => {
      jasmine.clock().install();

      const calls: string[] = [];
      const reg = service.register("debounced", (p: string) => calls.push(p), {
        debounceMs: 300,
      });

      // Schedule and then cancel before window elapses
      service.trigger("debounced", "A");
      jasmine.clock().tick(150);
      service.cancel("debounced");
      jasmine.clock().tick(200);

      expect(calls).toEqual([]);

      // Reschedule and let it fire
      service.trigger("debounced", "B");
      jasmine.clock().tick(350);
      expect(calls).toEqual(["B"]);

      jasmine.clock().uninstall();
    });

    it("honors throttleMs by suppressing rapid triggers", () => {
      jasmine.clock().install();

      const calls: string[] = [];
      service.register("throttled", (p: string) => calls.push(p), {
        throttleMs: 500,
      });

      service.trigger("throttled", "1"); // runs
      expect(calls).toEqual(["1"]);

      jasmine.clock().tick(200);
      service.trigger("throttled", "2"); // suppressed
      expect(calls).toEqual(["1"]);

      jasmine.clock().tick(300); // total 500ms elapsed
      service.trigger("throttled", "3"); // runs
      expect(calls).toEqual(["1", "3"]);

      jasmine.clock().uninstall();
    });

    it("prevents reentrant async execution by default", async () => {
      const resolvers: Array<() => void> = [];
      const calls: string[] = [];

      const reg = service.register(
        "async",
        async (p: string) => {
          calls.push(p);
          await new Promise<void>((resolve) => {
            resolvers.push(resolve);
          });
          calls.push(`${p}:done`);
        },
        { reentrant: false },
      );

      service.trigger("async", "A");
      service.trigger("async", "B"); // should be ignored while A is running

      expect(calls).toEqual(["A"]);

      // Resolve first execution
      resolvers[0]();
      await Promise.resolve(); // flush microtask

      // Now next trigger should be allowed
      service.trigger("async", "C");

      // Resolve second execution
      resolvers[1]();
      await Promise.resolve();

      expect(calls).toEqual(["A", "A:done", "C", "C:done"]);
      // Clean up
      reg.unregister();
    });

    it("allows reentrant async when configured reentrant=true", async () => {
      const calls: string[] = [];
      let resolvers: Array<() => void> = [];

      service.register(
        "async2",
        async (p: string) => {
          calls.push(p);
          await new Promise<void>((resolve) => {
            resolvers.push(resolve);
          });
          calls.push(p + ":done");
        },
        { reentrant: true },
      );

      service.trigger("async2", "X");
      service.trigger("async2", "Y");
      service.trigger("async2", "Z");

      expect(calls).toEqual(["X", "Y", "Z"]);

      // Resolve all
      resolvers.forEach((r) => r());
      await Promise.resolve();

      // All completions should have been recorded
      expect(calls).toEqual(["X", "Y", "Z", "X:done", "Y:done", "Z:done"]);
    });

    it("supports once semantics via options", () => {
      const calls: string[] = [];
      const reg = service.register("once", (p: string) => calls.push(p), {
        once: true,
      });

      service.trigger("once", "A"); // runs
      service.trigger("once", "B"); // ignored
      expect(calls).toEqual(["A"]);

      // Re-enable manually and trigger again
      service.enable("once");
      service.trigger("once", "C");
      expect(calls).toEqual(["A", "C"]);

      // Cleanup
      reg.unregister();
    });
  });

  describe("registration handle", () => {
    it("exposes instance with runtime controls", () => {
      const calls: string[] = [];
      const reg: ActivationRegistration<string> = service.register(
        "ctrl",
        (p) => calls.push(p),
        { debounceMs: 200 },
      );

      // Schedule debounced call
      reg.instance("X");
      expect(reg.instance.isEnabled()).toBeTrue();

      // Cancel scheduled call
      reg.instance.cancel();
      expect(calls).toEqual([]);

      // Disable prevents future triggers
      reg.instance.disable();
      expect(reg.instance.isEnabled()).toBeFalse();

      // Attempt trigger (ignored)
      reg.instance("Y");
      expect(calls).toEqual([]);

      // Enable and trigger
      reg.instance.enable();
      expect(reg.instance.isEnabled()).toBeTrue();
      reg.instance("Z");

      expect(calls).toEqual(["Z"]);

      // Unregister removes from service
      reg.unregister();
      expect(service.has("ctrl")).toBeFalse();
    });
  });
});
