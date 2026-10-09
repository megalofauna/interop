/*
 * Public API for Interop Composites
 *
 * Composites are higher-order assemblies that coordinate multiple Interop
 * components (and, where needed, additional structural HTML/CSS/JS) into a
 * single pattern. Unlike components — which map to one semantic element —
 * a composite's parts stand on their own; the composite arranges them.
 *
 * Dependency direction is one-way: composites import components; components
 * must never import composites.
 */

export * from "./code-block/public-api";
export * from "./inline-code/public-api";
export * from "./page-nav/public-api";
export * from "./terminal/public-api";
