/*
 * Public API Surface of interop
 */

export { auditInterop, watchInterop, watchInteropInDevMode, type AuditIssue } from './audit';
export { bindPendingAction } from './bind-pending-action';
export { bindRadioHomeEnd } from './bind-radio-home-end';
export { bindScrollArea } from './bind-scroll-area';
export { bindSelectAll } from './bind-select-all';
export { bindSteps, type StepsChangeDetail, type StepsOptions } from './bind-steps';
export { bindTabs, type TabsChangeDetail, type TabsOptions } from './bind-tabs';
export { bindTooltip } from './bind-tooltip';
export { guardActivation } from './guard-activation';
export { scopeSelectAll } from './scope-select-all';
export { splitLines } from './split-lines';
export { getIcon, registerIcons, type IconDefinition, type IconPath } from './icon-registry';
