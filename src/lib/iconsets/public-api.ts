/*
 * Public API for Interop Iconsets
 */

// Phosphor icon types and registry
export * from "./phosphor/helpers/phosphor-icon.types";
export * from "./phosphor/helpers/phosphor-icon.registry";

// Phosphor icon registration functions
export {
  registerAllPhosphorIcons,
  registerCommonPhosphorIcons,
  registerScopedPhosphorIcons,
  registerGlobalPhosphorIcons,
  registerScopedCommonPhosphorIcons,
  registerScopedAllPhosphorIcons,
  registerPhosphorIcons,
} from "./phosphor/helpers/providers";

// Individual Phosphor icons (re-export from index)
export * from "./phosphor/index";

// Convenience exports for common icons
export { PhUser } from "./phosphor/user";
export { PhHouse } from "./phosphor/house";
export { PhMagnifyingGlass } from "./phosphor/magnifying-glass";
export { PhGear } from "./phosphor/gear";
export { PhPlus } from "./phosphor/plus";
export { PhMinus } from "./phosphor/minus";
export { PhX } from "./phosphor/x";
export { PhCheck } from "./phosphor/check";
export { PhArrowLeft } from "./phosphor/arrow-left";
export { PhArrowRight } from "./phosphor/arrow-right";
export { PhArrowUp } from "./phosphor/arrow-up";
export { PhArrowDown } from "./phosphor/arrow-down";
export { PhHeart } from "./phosphor/heart";
export { PhStar } from "./phosphor/star";
export { PhBell } from "./phosphor/bell";
export { PhEnvelope } from "./phosphor/envelope";
export { PhCalendar } from "./phosphor/calendar";
export { PhClock } from "./phosphor/clock";
export { PhTrash } from "./phosphor/trash";
export { PhCopy } from "./phosphor/copy";
export { PhDownload } from "./phosphor/download";
export { PhUpload } from "./phosphor/upload";
export { PhEye } from "./phosphor/eye";
export { PhEyeSlash } from "./phosphor/eye-slash";
export { PhLock } from "./phosphor/lock";
export { PhLockOpen } from "./phosphor/lock-open";
export { PhInfo } from "./phosphor/info";
export { PhWarning } from "./phosphor/warning";
export { PhQuestion } from "./phosphor/question";
export { PhAcorn } from "./phosphor/acorn";
