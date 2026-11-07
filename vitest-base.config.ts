import { defineConfig } from "vitest/config";

/*
 * Read by `ng test` for both projects (`runnerConfig: true` in angular.json).
 *
 * The Angular builder runs test files without isolation by default, so files in one worker share a
 * global environment, and a global one file defines (a stub, a custom element, an installed guard)
 * reaches the next. Which files share a worker depends on the machine's core count, so a leak
 * failed in CI and passed locally. With isolation, each file starts from a fresh environment.
 */
export default defineConfig({
	test: {
		isolate: true,
	},
});
