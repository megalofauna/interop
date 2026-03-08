import { InteropActivation } from "./interop-activation.service";
import {
  InteropActivationChain,
  chainInteropActivation,
} from "./interop-activation.builder";

describe("InteropActivationChain", () => {
  let service: InteropActivation;

  beforeEach(() => {
    service = new InteropActivation();
  });

  it("requires a handler before register()", () => {
    const builder = chainInteropActivation(service, "missing-handler");
    expect(() => builder.register()).toThrowError(/handler/i);
  });

  it("registers and triggers a handler via fluent methods", () => {
    const calls: string[] = [];

    const builder = chainInteropActivation<string>(service, "save")
      .withHandler((payload: string) => calls.push(payload))
      .debounce(0)
      .register();

    expect(service.has("save")).toBeTrue();

    builder.trigger("A").trigger("B");
    expect(calls).toEqual(["A", "B"]);

    builder.dispose();
    expect(service.has("save")).toBeFalse();
  });

  it("merges options through fluent helpers and exposes snapshotOptions()", () => {
    const hooks = {
      onStart: jasmine.createSpy("onStart"),
      onEnd: jasmine.createSpy("onEnd"),
      onError: jasmine.createSpy("onError"),
    };

    const builder = chainInteropActivation(service, "options")
      .withOptions({ debounceMs: 50 })
      .throttle(100)
      .once()
      .nonReentrant()
      .hooks(hooks)
      .debug();

    const snapshot = builder.snapshotOptions();

    expect(snapshot).toEqual({
      debounceMs: 50,
      throttleMs: 100,
      once: true,
      reentrant: false,
      onStart: hooks.onStart,
      onEnd: hooks.onEnd,
      onError: hooks.onError,
      debug: true,
    });
  });

  it("re-registers cleanly when register() is called multiple times", () => {
    const firstCalls: string[] = [];
    const secondCalls: string[] = [];

    const builder = chainInteropActivation<string>(service, "swap").withHandler(
      (p: string) => firstCalls.push(p),
    );

    builder.register();
    builder.trigger("one");
    expect(firstCalls).toEqual(["one"]);
    expect(secondCalls).toEqual([]);

    builder
      .withHandler((p: string) => secondCalls.push(p))
      .register()
      .trigger("two");

    service.trigger("swap", "three");

    expect(firstCalls).toEqual(["one"]);
    expect(secondCalls).toEqual(["two", "three"]);
  });

  it("dispose() unregisters the handler", () => {
    const builder = chainInteropActivation(service, "cleanup")
      .withHandler(() => undefined)
      .register();

    expect(service.has("cleanup")).toBeTrue();

    builder.dispose();
    expect(service.has("cleanup")).toBeFalse();
  });

  it("proxies enable()/disable()/cancel() to the underlying service", () => {
    jasmine.clock().install();

    const calls: string[] = [];

    const builder = chainInteropActivation<string>(service, "debounced")
      .withHandler((payload: string) => calls.push(payload))
      .debounce(200)
      .register();

    // Debounce scheduling
    builder.trigger("pending");
    jasmine.clock().tick(100);
    builder.cancel();
    jasmine.clock().tick(200);
    expect(calls).toEqual([]);

    // Disable prevents triggers
    builder.disable().trigger("ignored");
    jasmine.clock().tick(250);
    expect(calls).toEqual([]);

    // Enable and allow execution
    builder.enable().trigger("run");
    jasmine.clock().tick(250);
    expect(calls).toEqual(["run"]);

    jasmine.clock().uninstall();
  });

  it("supports chaining helper factory with explicit typing", () => {
    interface Payload {
      id: number;
    }

    const calls: Payload[] = [];

    const chain: InteropActivationChain<Payload> =
      chainInteropActivation<Payload>(service, "typed")
        .withHandler((payload) => calls.push(payload))
        .register();

    chain.trigger({ id: 1 }).trigger({ id: 2 });
    expect(calls).toEqual([{ id: 1 }, { id: 2 }]);
  });
});
