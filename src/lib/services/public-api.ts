/*
 * Public API for Interop Services
 */

// Export services here as they are created
export * from "./interop-collection.service";
export * from "./interop-activation.service";
export * from "./interop-activation.builder";
export * from "./interop-attribute.service";

// Mini-barrel namespace exports
export * as InteropServices from "./services-only";
export * as InteropServicesWithBuilders from "./services-and-builders";
// TODO: Promote these mini-barrels to true secondary entry points via ng-packagr exports.

// Future services:
// export * from './interop-data.service';
// export * from './interop-state.service';

export const INTEROP_SERVICES_VERSION = "0.1.0";
