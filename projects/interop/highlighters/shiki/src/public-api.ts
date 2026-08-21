export * from "./shiki-highlighter";
/*
 * Exported so a hand-rolled highlighter can borrow the repair without
 * duplicating the maths. The Protocol docs build their own slim shiki core to
 * avoid the wasm engine, and they have the same problem this solves.
 */
export { liftContrast, contrastOf } from "./contrast";
