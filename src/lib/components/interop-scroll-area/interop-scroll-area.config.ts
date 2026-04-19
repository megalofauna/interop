import { InjectionToken } from '@angular/core';

export interface InteropScrollAreaConfig {
  orientation: 'vertical' | 'horizontal' | 'both';
  showShadows: boolean;
  shadowThreshold: number;
  overscrollBehavior: 'contain' | 'auto' | 'none';
}

export const INTEROP_SCROLL_AREA_DEFAULTS: InteropScrollAreaConfig = {
  orientation: 'vertical',
  showShadows: true,
  shadowThreshold: 60,
  overscrollBehavior: 'contain',
};

export const INTEROP_SCROLL_AREA_CONFIG = new InjectionToken<Partial<InteropScrollAreaConfig>>(
  'INTEROP_SCROLL_AREA_CONFIG',
  { providedIn: 'root', factory: () => ({}) },
);
