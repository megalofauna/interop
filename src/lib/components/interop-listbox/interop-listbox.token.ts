import { InjectionToken } from "@angular/core";

export type SelectControlValue = string | number | boolean;

export interface IInteropListbox {
  isSelected(value: SelectControlValue): boolean;
  isActiveValue(value: SelectControlValue): boolean;
  selectValue(value: SelectControlValue): void;
  setActiveValue(value: SelectControlValue): void;
}

export const INTEROP_LISTBOX_TOKEN = new InjectionToken<IInteropListbox>(
  "InteropListbox",
);
