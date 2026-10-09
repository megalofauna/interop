import type { Blueprint } from '../system/blueprint.ts';
import { badge } from './badge.blueprint.ts';
import { button } from './button.blueprint.ts';
import { visuallyHidden } from './visually-hidden.blueprint.ts';

export const BLUEPRINTS: readonly Blueprint[] = [badge, button, visuallyHidden];
