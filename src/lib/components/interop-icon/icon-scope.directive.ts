import { Directive, Input, OnInit, inject } from "@angular/core";
import {
  InteropIconDefinition,
  InteropIconRegistry,
} from "../../iconsets/core";

/**
 * Directive to register icons at a DI scope boundary.
 * Icons registered here are available to all child components and override
 * parent-scoped icons with the same name.
 *
 * @example
 * ```html
 * <div iconScope [icons]="[PhUser, PhHome]">
 *   <interop-icon name="ph-user" />
 * </div>
 * ```
 */
@Directive({
  selector: "[iconScope]",
  standalone: true,
  providers: [InteropIconRegistry],
})
export class IconScopeDirective implements OnInit {
  private readonly _registry = inject(InteropIconRegistry);

  /** Icons to register in this scope. */
  @Input() icons: InteropIconDefinition[] = [];

  ngOnInit(): void {
    if (this.icons.length > 0) {
      this._registry.register(this.icons);
    }
  }
}
