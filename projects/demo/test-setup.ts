// jsdom has no layout, so it has no ResizeObserver. The app uses one to close the nav drawer when the sidebar shows; here it observes nothing.
globalThis.ResizeObserver ??= class {
	observe() {}
	unobserve() {}
	disconnect() {}
};
