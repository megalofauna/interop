import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { InteropLayoutDirective } from "./directives/interop-layout";

/**
 * Main module for the Interop Angular library.
 * Provides interoperable components, services, and utilities.
 */
@NgModule({
  declarations: [],
  imports: [CommonModule, InteropLayoutDirective],
  exports: [InteropLayoutDirective],
  providers: [],
})
export class InteropModule {}
