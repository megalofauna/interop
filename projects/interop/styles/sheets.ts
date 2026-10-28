/*
 * Every stylesheet in the library, read as text, keyed by its path in projects/interop. The style
 * guards read their stylesheets from here, and sheets.spec.ts checks this list against interop.css,
 * so a new stylesheet cannot be left out of the guards.
 */

// @ts-expect-error The text loader turns the file into a string.
import stylesReset from '../styles/reset.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stylesSpace from '../styles/space.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stylesTypography from '../styles/typography.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stylesCode from '../styles/code.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stylesRadius from '../styles/radius.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stylesBorder from '../styles/border.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stylesColor from '../styles/color.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stylesTransition from '../styles/transition.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stylesOutline from '../styles/outline.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stylesVisuallyHidden from '../styles/visually-hidden.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stylesFieldset from '../styles/fieldset.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import buttonInteropButtonBase from '../button/interop-button.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import buttonInteropButtonStructure from '../button/interop-button.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import iconInteropIconBase from '../icon/interop-icon.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import iconInteropIconStructure from '../icon/interop-icon.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import badgeInteropBadgeBase from '../badge/interop-badge.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import badgeInteropBadgeStructure from '../badge/interop-badge.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import scrollAreaInteropScrollAreaBase from '../scroll-area/interop-scroll-area.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import scrollAreaInteropScrollAreaStructure from '../scroll-area/interop-scroll-area.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import codeBlockInteropCodeBlockBase from '../code-block/interop-code-block.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import codeBlockInteropCodeBlockStructure from '../code-block/interop-code-block.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import popoverInteropPopoverBase from '../popover/interop-popover.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import popoverInteropPopoverStructure from '../popover/interop-popover.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import groupInteropGroupBase from '../group/interop-group.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import groupInteropGroupStructure from '../group/interop-group.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import tooltipInteropTooltipBase from '../tooltip/interop-tooltip.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import tooltipInteropTooltipStructure from '../tooltip/interop-tooltip.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import sliderInteropSliderBase from '../slider/interop-slider.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import sliderInteropSliderStructure from '../slider/interop-slider.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import progressInteropProgressBase from '../progress/interop-progress.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import progressInteropProgressStructure from '../progress/interop-progress.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import switchInteropSwitchBase from '../switch/interop-switch.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import switchInteropSwitchStructure from '../switch/interop-switch.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import radioGroupInteropRadioGroupBase from '../radio-group/interop-radio-group.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import radioGroupInteropRadioGroupStructure from '../radio-group/interop-radio-group.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import checkboxInteropCheckboxBase from '../checkbox/interop-checkbox.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import checkboxInteropCheckboxStructure from '../checkbox/interop-checkbox.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import tabsInteropTabsBase from '../tabs/interop-tabs.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import tabsInteropTabsStructure from '../tabs/interop-tabs.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import tableInteropTableBase from '../table/interop-table.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import tableInteropTableStructure from '../table/interop-table.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import toolbarInteropToolbarBase from '../toolbar/interop-toolbar.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import toolbarInteropToolbarStructure from '../toolbar/interop-toolbar.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stepsInteropStepsBase from '../steps/interop-steps.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stepsInteropStepsStructure from '../steps/interop-steps.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import tagsInteropTagsBase from '../tags/interop-tags.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import tagsInteropTagsStructure from '../tags/interop-tags.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import fieldInteropFieldBase from '../field/interop-field.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import fieldInteropFieldStructure from '../field/interop-field.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import selectInteropSelectBase from '../select/interop-select.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import selectInteropSelectStructure from '../select/interop-select.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import dialogInteropDialogBase from '../dialog/interop-dialog.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import dialogInteropDialogStructure from '../dialog/interop-dialog.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import treeInteropTreeBase from '../tree/interop-tree.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import treeInteropTreeStructure from '../tree/interop-tree.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import pageNavInteropPageNavBase from '../page-nav/interop-page-nav.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import pageNavInteropPageNavStructure from '../page-nav/interop-page-nav.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import toastInteropToastBase from '../toast/interop-toast.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import toastInteropToastStructure from '../toast/interop-toast.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import calloutInteropCalloutBase from '../callout/interop-callout.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import calloutInteropCalloutStructure from '../callout/interop-callout.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import disclosureInteropDisclosureBase from '../disclosure/interop-disclosure.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import disclosureInteropDisclosureStructure from '../disclosure/interop-disclosure.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stylesSegmented from '../styles/segmented.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stylesCards from '../styles/cards.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stylesChips from '../styles/chips.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stylesUnderscore from '../styles/underscore.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stylesDisclosure from '../styles/disclosure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stylesFlow from '../styles/flow.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import interopCss from '../interop.css' with { loader: 'text' };

/** The stylesheets, in interop.css order; reset.css, which is opt-in, first. */
export const sheets: Record<string, string> = {
	'styles/reset.css': stylesReset,
	'styles/space.css': stylesSpace,
	'styles/typography.css': stylesTypography,
	'styles/code.css': stylesCode,
	'styles/radius.css': stylesRadius,
	'styles/border.css': stylesBorder,
	'styles/color.css': stylesColor,
	'styles/transition.css': stylesTransition,
	'styles/outline.css': stylesOutline,
	'styles/visually-hidden.css': stylesVisuallyHidden,
	'styles/fieldset.css': stylesFieldset,
	'button/interop-button.base.css': buttonInteropButtonBase,
	'button/interop-button.structure.css': buttonInteropButtonStructure,
	'icon/interop-icon.base.css': iconInteropIconBase,
	'icon/interop-icon.structure.css': iconInteropIconStructure,
	'badge/interop-badge.base.css': badgeInteropBadgeBase,
	'badge/interop-badge.structure.css': badgeInteropBadgeStructure,
	'scroll-area/interop-scroll-area.base.css': scrollAreaInteropScrollAreaBase,
	'scroll-area/interop-scroll-area.structure.css': scrollAreaInteropScrollAreaStructure,
	'code-block/interop-code-block.base.css': codeBlockInteropCodeBlockBase,
	'code-block/interop-code-block.structure.css': codeBlockInteropCodeBlockStructure,
	'popover/interop-popover.base.css': popoverInteropPopoverBase,
	'popover/interop-popover.structure.css': popoverInteropPopoverStructure,
	'group/interop-group.base.css': groupInteropGroupBase,
	'group/interop-group.structure.css': groupInteropGroupStructure,
	'tooltip/interop-tooltip.base.css': tooltipInteropTooltipBase,
	'tooltip/interop-tooltip.structure.css': tooltipInteropTooltipStructure,
	'slider/interop-slider.base.css': sliderInteropSliderBase,
	'slider/interop-slider.structure.css': sliderInteropSliderStructure,
	'progress/interop-progress.base.css': progressInteropProgressBase,
	'progress/interop-progress.structure.css': progressInteropProgressStructure,
	'switch/interop-switch.base.css': switchInteropSwitchBase,
	'switch/interop-switch.structure.css': switchInteropSwitchStructure,
	'radio-group/interop-radio-group.base.css': radioGroupInteropRadioGroupBase,
	'radio-group/interop-radio-group.structure.css': radioGroupInteropRadioGroupStructure,
	'checkbox/interop-checkbox.base.css': checkboxInteropCheckboxBase,
	'checkbox/interop-checkbox.structure.css': checkboxInteropCheckboxStructure,
	'tabs/interop-tabs.base.css': tabsInteropTabsBase,
	'tabs/interop-tabs.structure.css': tabsInteropTabsStructure,
	'table/interop-table.base.css': tableInteropTableBase,
	'table/interop-table.structure.css': tableInteropTableStructure,
	'toolbar/interop-toolbar.base.css': toolbarInteropToolbarBase,
	'toolbar/interop-toolbar.structure.css': toolbarInteropToolbarStructure,
	'steps/interop-steps.base.css': stepsInteropStepsBase,
	'steps/interop-steps.structure.css': stepsInteropStepsStructure,
	'tags/interop-tags.base.css': tagsInteropTagsBase,
	'tags/interop-tags.structure.css': tagsInteropTagsStructure,
	'field/interop-field.base.css': fieldInteropFieldBase,
	'field/interop-field.structure.css': fieldInteropFieldStructure,
	'select/interop-select.base.css': selectInteropSelectBase,
	'select/interop-select.structure.css': selectInteropSelectStructure,
	'dialog/interop-dialog.base.css': dialogInteropDialogBase,
	'dialog/interop-dialog.structure.css': dialogInteropDialogStructure,
	'tree/interop-tree.base.css': treeInteropTreeBase,
	'tree/interop-tree.structure.css': treeInteropTreeStructure,
	'page-nav/interop-page-nav.base.css': pageNavInteropPageNavBase,
	'page-nav/interop-page-nav.structure.css': pageNavInteropPageNavStructure,
	'toast/interop-toast.base.css': toastInteropToastBase,
	'toast/interop-toast.structure.css': toastInteropToastStructure,
	'callout/interop-callout.base.css': calloutInteropCalloutBase,
	'callout/interop-callout.structure.css': calloutInteropCalloutStructure,
	'disclosure/interop-disclosure.base.css': disclosureInteropDisclosureBase,
	'disclosure/interop-disclosure.structure.css': disclosureInteropDisclosureStructure,
	'styles/segmented.css': stylesSegmented,
	'styles/cards.css': stylesCards,
	'styles/chips.css': stylesChips,
	'styles/underscore.css': stylesUnderscore,
	'styles/disclosure.css': stylesDisclosure,
	'styles/flow.css': stylesFlow,
};

/** interop.css itself, for checking the list against it. */
export const bundle: string = interopCss;

/** Every stylesheet's text, in order, as one string. */
export const allCss = (): string => Object.values(sheets).join('\n');
