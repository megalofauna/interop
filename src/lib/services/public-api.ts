/*
 * Public API for Interop Services
 */

export * from "./interop-activation.service";
export * from "./interop-activation.builder";
export * from "./interop-attribute.service";
export * from "./interop-announcer.service";

// Mini-barrel namespace exports
export * as InteropServices from "./services-only";
export * as InteropServicesWithBuilders from "./services-and-builders";
// TODO: Promote these mini-barrels to true secondary entry points via ng-packagr exports.

export const INTEROP_SERVICES_VERSION = "0.1.0";
