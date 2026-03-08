import {
  createActivationHandler,
  composeActivation,
  type ActivationHandler,
} from "./activation";

describe("Activation Utilities", () => {
  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date("2020-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  describe("createActivationHandler", () => {
    it("executes immediately by default", async () => {
      const spy = jasmine.createSpy("handler").and.returnValue(undefined);
      const activate = createActivationHandler(spy);

      activate("payload");
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith("payload");
    });

    it("debounces execution when debounceMs is set", async () => {
      const spy = jasmine.createSpy("handler").and.returnValue(undefined);
      const activate = createActivationHandler(spy, { debounceMs: 250 });

      activate("a");
      jasmine.clock().tick(100);
      activate("b");
      jasmine.clock().tick(100);
      activate("c");

      // Still not called until debounce window elapses
      expect(spy).toHaveBeenCalledTimes(0);

      jasmine.clock().tick(250);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith("c");
    });

    it("can cancel a scheduled debounced execution", async () => {
      const spy = jasmine.createSpy("handler").and.returnValue(undefined);
      const activate = createActivationHandler(spy, { debounceMs: 300 });

      activate("x");
      jasmine.clock().tick(150);
      activate.cancel();
      jasmine.clock().tick(300);

      expect(spy).toHaveBeenCalledTimes(0);
    });

    it("throttles execution when throttleMs is set", async () => {
      const spy = jasmine.createSpy("handler").and.returnValue(undefined);
      const activate = createActivationHandler(spy, { throttleMs: 500 });

      activate("1");
      expect(spy).toHaveBeenCalledTimes(1);
      jasmine.clock().tick(200);
      activate("2");
      // Suppressed due to throttle window
      expect(spy).toHaveBeenCalledTimes(1);

      jasmine.clock().tick(300); // total 500ms passed
      activate("3");
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.calls.mostRecent().args[0]).toBe("3");
    });

    it("debounce and throttle together: schedules once and suppresses too-close runs", async () => {
      const spy = jasmine.createSpy("handler").and.returnValue(undefined);
      const activate = createActivationHandler(spy, {
        debounceMs: 200,
        throttleMs: 300,
      });

      activate("a");
      jasmine.clock().tick(100);
      activate("b");
      jasmine.clock().tick(100);
      activate("c");
      // Debounce window not elapsed yet
      expect(spy).toHaveBeenCalledTimes(0);

      jasmine.clock().tick(200); // debounce fires now with "c"
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.mostRecent().args[0]).toBe("c");

      // Immediately trigger again within throttle window
      activate("d");
      expect(spy).toHaveBeenCalledTimes(1); // suppressed

      jasmine.clock().tick(301);
      activate("e");
      expect(spy).toHaveBeenCalledTimes(1); // debounced
      jasmine.clock().tick(200);
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.calls.mostRecent().args[0]).toBe("e");
    });

    it("prevents reentrant async execution by default", async () => {
      let resolveFn: (() => void) | undefined;
      const asyncHandler = jasmine.createSpy("asyncHandler").and.callFake(
        () =>
          new Promise<void>((resolve) => {
            resolveFn = resolve;
          }),
      );

      const activate = createActivationHandler(asyncHandler, {
        throttleMs: 0,
        debounceMs: 0,
      });

      // First trigger
      activate("first");
      expect(asyncHandler).toHaveBeenCalledTimes(1);

      // While running, second trigger should be ignored (reentrant: false default)
      activate("second");
      expect(asyncHandler).toHaveBeenCalledTimes(1);

      // Finish first execution
      if (resolveFn) {
        resolveFn();
      }

      // Advance microtasks
      await Promise.resolve();

      // Now subsequent trigger is allowed
      activate("third");
      expect(asyncHandler).toHaveBeenCalledTimes(2);
    });

    it("allows reentrant async execution when reentrant=true", async () => {
      let resolveFns: Array<() => void> = [];
      const asyncHandler = jasmine.createSpy("asyncHandler").and.callFake(
        () =>
          new Promise<void>((resolve) => {
            resolveFns.push(resolve);
          }),
      );

      const activate = createActivationHandler(asyncHandler, {
        reentrant: true,
      });

      activate("1");
      activate("2");
      activate("3");

      expect(asyncHandler).toHaveBeenCalledTimes(3);

      // Resolve all
      resolveFns.forEach((fn) => fn());
      await Promise.resolve();

      // Further calls still work
      activate("4");
      expect(asyncHandler).toHaveBeenCalledTimes(4);
    });

    it("honors once=true by disabling after first successful run", async () => {
      const spy = jasmine.createSpy("handler").and.returnValue(undefined);
      const activate = createActivationHandler(spy, { once: true });

      activate("first");
      expect(spy).toHaveBeenCalledTimes(1);
      expect(activate.isEnabled()).toBeFalse();

      // Subsequent triggers ignored
      activate("second");
      expect(spy).toHaveBeenCalledTimes(1);

      // Can be re-enabled manually
      activate.enable();
      expect(activate.isEnabled()).toBeTrue();
      activate("third");
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it("supports lifecycle hooks (onStart, onEnd, onError)", async () => {
      const onStart = jasmine.createSpy("onStart");
      const onEnd = jasmine.createSpy("onEnd");
      const onError = jasmine.createSpy("onError");

      // Success case
      const successHandler = jasmine
        .createSpy("successHandler")
        .and.returnValue("ok");
      const successActivate = createActivationHandler(successHandler, {
        onStart,
        onEnd,
        onError,
      });
      successActivate("payload");
      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onEnd).toHaveBeenCalledWith("ok");
      expect(onError).not.toHaveBeenCalled();

      // Error case
      const errorHandler = jasmine
        .createSpy("errorHandler")
        .and.callFake(() => {
          throw new Error("boom");
        });
      const errorActivate = createActivationHandler(errorHandler, {
        onStart,
        onEnd,
        onError,
      });
      errorActivate("payload2");
      expect(onStart).toHaveBeenCalledTimes(2);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it("disable() prevents future triggers until enable()", () => {
      const spy = jasmine.createSpy("handler").and.returnValue(undefined);
      const activate = createActivationHandler(spy);

      activate("1");
      expect(spy).toHaveBeenCalledTimes(1);

      activate.disable();
      expect(activate.isEnabled()).toBeFalse();

      activate("2");
      expect(spy).toHaveBeenCalledTimes(1);

      activate.enable();
      expect(activate.isEnabled()).toBeTrue();

      activate("3");
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe("composeActivation", () => {
    it("runs handlers sequentially with the same payload", async () => {
      const order: string[] = [];
      const h1: ActivationHandler<string> = (p) => {
        order.push(`h1:${p}`);
      };
      const h2: ActivationHandler<string> = (p) => {
        order.push(`h2:${p}`);
      };
      const composed = composeActivation(h1, h2);

      const result = await composed("X");
      expect(order).toEqual(["h1:X", "h2:X"]);
      expect(result).toBeTrue();
    });

    it("short-circuits if a handler returns false", async () => {
      const order: string[] = [];
      const h1: ActivationHandler<string> = (p) => {
        order.push(`h1:${p}`);
        return false;
      };
      const h2: ActivationHandler<string> = (p) => {
        order.push(`h2:${p}`);
      };
      const composed = composeActivation(h1, h2);

      const result = await composed("Y");
      expect(order).toEqual(["h1:Y"]);
      expect(result).toBeFalse();
    });

    it("propagates errors from handlers", async () => {
      const h1: ActivationHandler<void> = () => {
        throw new Error("bad");
      };
      const h2: ActivationHandler<void> = () => {
        // should not run
        fail("h2 should not be called after error in h1");
      };
      const composed = composeActivation(h1, h2);

      let caught: unknown;
      try {
        await composed();
      } catch (e) {
        caught = e;
      }
      expect(caught instanceof Error).toBeTrue();
      expect((caught as Error).message).toBe("bad");
    });

    it("awaits async handlers in order", async () => {
      const order: string[] = [];
      const h1: ActivationHandler<void> = async () => {
        order.push("h1:start");
        await Promise.resolve();
        order.push("h1:end");
      };
      const h2: ActivationHandler<void> = async () => {
        order.push("h2:start");
        await Promise.resolve();
        order.push("h2:end");
      };

      const composed = composeActivation(h1, h2);

      await composed();

      expect(order).toEqual(["h1:start", "h1:end", "h2:start", "h2:end"]);
    });
  });
});
