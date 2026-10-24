/*
 * Public API Surface of interop
 */

export { announce, type AnnounceOptions } from './announce';
export { auditInterop, watchInterop, watchInteropInDevMode, type AuditIssue } from './audit';
export { bindCharacterCount, type CharacterCountOptions } from './bind-character-count';
export { bindDrawer } from './bind-drawer';
export { bindFilter, type FilterOptions } from './bind-filter';
export { bindPasswordToggle } from './bind-password-toggle';
export { bindPendingAction } from './bind-pending-action';
export { bindRadioHomeEnd } from './bind-radio-home-end';
export { bindScrollArea } from './bind-scroll-area';
export { bindSegmentedFit } from './bind-segmented-fit';
export { bindSelectAll } from './bind-select-all';
export { bindShortcut } from './bind-shortcut';
export { bindSlider, paintSlider, type SliderOptions } from './bind-slider';
export { bindSteps, type StepsChangeDetail, type StepsOptions } from './bind-steps';
export { bindTabs, type TabsChangeDetail, type TabsOptions } from './bind-tabs';
export { bindTargetCurrent } from './bind-target-current';
export { bindTagInput, bindTags, type TagAddDetail, type TagInputOptions, type TagsOptions } from './bind-tags';
export { bindToolbar } from './bind-toolbar';
export { bindTooltip } from './bind-tooltip';
export {
	bindValidation,
	defaultValidationMessages,
	type ValidationMessage,
	type ValidationOptions,
	type ValidityKey,
} from './bind-validation';
export { guardActivation } from './guard-activation';
export { bindToasts, toast, type ToastColor, type ToastOptions } from './toast';
export { scopeSelectAll } from './scope-select-all';
export { splitLines } from './split-lines';
export { getIcon, registerIcons, type IconDefinition, type IconPath } from './icon-registry';
