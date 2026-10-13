export interface AuditIssue {
	readonly rule: string;
	readonly element: Element;
	/** What is wrong. */
	readonly problem: string;
	/** Why it matters. */
	readonly reason: string;
	/** What to do about it. */
	readonly advice: string;
}

let activationGuards = 0;

/** Called by guardActivation() as it installs and removes itself. */
export function noteActivationGuard(change: 1 | -1): void {
	activationGuards += change;
}

type Rule = (element: Element) => Omit<AuditIssue, 'rule' | 'element'> | null;

const BUTTONS = 'button[interop-button], button:has(svg[interop-icon])';
const BADGES = '[interop-badge]:not([hidden])';
const LIVE = '[role="status"], [aria-live]';
const INTERACTIVE = 'a[href], button, input, select, textarea, details, [tabindex], [contenteditable]';
const CONTROL_LABELS = 'label:is([interop-switch], [interop-checkbox]), fieldset[interop-radio-group] label:has(> input[type="radio"])';
const GROUPS = 'fieldset:is([interop-radio-group], [interop-checkbox-group])';
const TABLISTS = '[interop-tabs] > [role="tablist"]';
const CARDS = 'fieldset:is([interop-radio-group~="cards"], [interop-checkbox-group~="cards"]) > label';
/** Elements a label may not hold: it allows phrasing content only. */
const BLOCK = 'address, article, aside, blockquote, details, div, dl, fieldset, figure, footer, form, h1, h2, h3, h4, h5, h6, header, hr, li, main, nav, ol, p, pre, section, table, ul';
/** Controls a label may not hold besides its own: they would be labeled by it too. */
const LABELABLE = 'button, input, meter, output, progress, select, textarea';

/** The tabs a tab list owns. */
const tabsIn = (tablist: Element) => Array.from(tablist.children).filter((child) => child.getAttribute('role') === 'tab');
/** The panel a tab controls, if it is a tab panel. */
const panelOf = (tab: Element) => {
	const id = tab.getAttribute('aria-controls');
	const panel = id ? tab.ownerDocument.getElementById(id) : null;
	return panel?.getAttribute('role') === 'tabpanel' ? panel : null;
};

const RULES: Record<string, { selector: string; check: Rule }> = {
	'button-name': {
		selector: BUTTONS,
		check: (button) =>
			accessibleName(button)
				? null
				: {
						problem: 'This button has no accessible name.',
						reason: 'A screen reader announces it only as "button", with nothing to say what it does.',
						advice: 'Give it visible text, or aria-label="…" if it shows only an icon.',
					},
	},
	'activation-guard': {
		selector: '[interop-button]:is([aria-disabled="true"], [aria-busy="true"])',
		check: () =>
			activationGuards > 0
				? null
				: {
						problem: 'This button is aria-disabled or aria-busy, but guardActivation() is not installed.',
						reason: 'Unlike native disabled, these attributes do not stop clicks, so the button still runs its handlers, submits its form and sends its command.',
						advice: 'Call guardActivation() once when the app starts.',
					},
	},
	'button-type': {
		selector: 'button[interop-button]:not([type])',
		check: (button) =>
			(button as HTMLButtonElement).form
				? {
						problem: 'This button is inside a form and has no type.',
						reason: 'A button with no type submits its form when pressed.',
						advice: 'Add type="button", or type="submit" if submitting is intended.',
					}
				: null,
	},
	'icon-label-hidden': {
		selector: 'svg[interop-icon]:is([aria-label], [aria-labelledby])[aria-hidden="true"]',
		check: () => ({
			problem: 'This icon has a label but is hidden from assistive technology.',
			reason: 'aria-hidden="true" removes the icon and its label, so the label is never announced.',
			advice: 'Remove aria-hidden, or remove the label if the icon is decorative.',
		}),
	},
	'icon-label-repeated': {
		selector: 'button svg[interop-icon]:is([aria-label], [aria-labelledby]):not([aria-hidden="true"])',
		check: (icon) => {
			const button = icon.closest('button')!;
			const text = Array.from(button.childNodes)
				.filter((node) => node !== icon)
				.map(visibleText)
				.join('')
				.trim();
			return text
				? {
						problem: 'This icon has a label inside a button that already has text.',
						reason: 'The button is announced with both, e.g. "Copy Copy".',
						advice: 'Remove the icon’s label. It is hidden automatically without one.',
					}
				: null;
		},
	},
	'badge-text': {
		selector: BADGES,
		check: (badge) =>
			spokenText(badge)
				? null
				: {
						problem: 'This badge has no text for assistive technology.',
						reason: 'A dot or an empty badge says nothing to a screen reader user, so whatever it marks is lost.',
						advice: 'Give it text, hidden when it shows a dot: <span interop-badge="dot"><span itx-visually-hidden>New activity</span></span>.',
					},
	},
	'badge-count-label': {
		selector: BADGES,
		check: (badge) =>
			/^[\d\s.,+]+$/.test(spokenText(badge))
				? {
						problem: 'This badge shows a count, but nothing says what it counts.',
						reason: 'A screen reader reads the bare number, e.g. "Inbox 3".',
						advice: 'Set [label], e.g. { one: "unread message", other: "unread messages" }, or put hidden text beside the number.',
					}
				: null,
	},
	'badge-announcement': {
		selector: `${BADGES}:is(:has(> [aria-hidden="true"]), [interop-badge~="dot"])`,
		check: (badge) =>
			/\d/.test(spokenText(badge)) && !badge.matches(LIVE) && !badge.querySelector(LIVE)
				? {
						problem: 'Changes to this count are not announced.',
						reason: 'A screen reader user hears the new count only when they come back to the badge.',
						advice: 'If they need to hear changes as they happen, set [announce]="true". If not, this badge is fine as it is.',
					}
				: null,
	},
	'badge-live-region-name': {
		selector: `:is(button, a[href], [role="button"], [role="link"]) ${BADGES}:is(${LIVE})`,
		check: () => ({
			problem: 'This badge is a live region inside a control, so its text is left out of the control’s name.',
			reason: 'Browsers do not include a live region’s text in the name of the control around it, so the control is announced without its count.',
			advice: 'Remove role="status" from the badge. To announce changes, set [announce]="true", which keeps the count in the name.',
		}),
	},
	'code-block-name': {
		selector: 'figure[interop-code-block]',
		check: (figure) =>
			ariaName(figure) || figure.querySelector(':scope > figcaption')?.textContent?.trim()
				? null
				: {
						problem: 'This code block has no name.',
						reason: 'A screen reader announces it only as "figure", with nothing to say what the code is.',
						advice: 'Give it a caption, e.g. caption="badge.ts", or register its language with a label.',
					},
	},
	'code-scroll-focusable': {
		selector: 'pre:is([interop-code-block] > pre, :has(> code[class*="language-"])):not([tabindex])',
		check: (pre) =>
			pre.scrollWidth > pre.clientWidth || pre.scrollHeight > pre.clientHeight
				? {
						problem: 'This code scrolls, but the keyboard cannot reach it.',
						reason: 'Safari does not focus a scrolling element on its own, so keyboard users cannot scroll to the rest of the code.',
						advice: 'Add tabindex="0" to the <pre> while it overflows. InteropCodeBlock does this for you.',
					}
				: null,
	},
	'tooltip-interactive': {
		selector: `[interop-tooltip]:has(${INTERACTIVE})`,
		check: () => ({
			problem: 'This tooltip holds a link, button or other control.',
			reason: 'A tooltip closes when focus leaves its trigger, so keyboard and screen reader users can never reach what is inside it.',
			advice: 'Keep the tooltip to text. Put controls in a popover opened by a button.',
		}),
	},
	'tooltip-trigger-disabled': {
		selector: ':disabled:is([aria-labelledby], [aria-describedby])',
		check: (trigger) =>
			tooltipsOf(trigger, 'aria-labelledby').length || tooltipsOf(trigger, 'aria-describedby').length
				? {
						problem: 'This control has a tooltip but is disabled.',
						reason: 'A disabled control cannot take focus, so keyboard users never see the tooltip, and some browsers send it no pointer events either.',
						advice: 'Use aria-disabled="true" with guardActivation() instead of disabled.',
					}
				: null,
	},
	'tooltip-repeats-name': {
		selector: '[aria-describedby]',
		check: (trigger) => {
			const name = accessibleName(trigger).toLowerCase();
			return name && tooltipsOf(trigger, 'aria-describedby').some((tooltip) => tooltip.textContent?.trim().toLowerCase() === name)
				? {
						problem: 'This tooltip repeats the name of the control it describes.',
						reason: 'A screen reader reads the name and then the description, so it says the same thing twice.',
						advice: 'If the tooltip is the only name, make it interop-tooltip="label" and remove the other name. Otherwise remove the tooltip or say something new in it.',
					}
				: null;
		},
	},
	'tooltip-label-in-name': {
		selector: '[aria-labelledby]',
		check: (trigger) => {
			const text = squash(spokenText(trigger));
			return text && tooltipsOf(trigger, 'aria-labelledby').length && !squash(ariaName(trigger)).includes(text)
				? {
						problem: 'This control’s label tooltip replaces its visible text with different words.',
						reason: 'A label tooltip becomes the whole name, so a voice control user who says the visible text cannot reach the control (WCAG 2.5.3).',
						advice: 'Use a describing tooltip, interop-tooltip without "label", or start the tooltip with the visible text.',
					}
				: null;
		},
	},
	'control-name': {
		selector: CONTROL_LABELS,
		check: (label) => {
			const input = label.querySelector(':scope > input');
			return spokenText(label) || (input && ariaName(input))
				? null
				: {
						problem: 'This control’s label has no text.',
						reason: 'A screen reader announces only "checkbox", "switch" or "radio button", with nothing to say what it controls.',
						advice: 'Put the text inside the label, after the input: <label interop-checkbox><input type="checkbox"> Accept terms</label>.',
					};
		},
	},
	'control-label-block': {
		selector: CONTROL_LABELS,
		check: (label) =>
			label.querySelector(BLOCK)
				? {
						problem: 'This control’s label holds block content, such as a div, p, list or heading.',
						reason: 'A label may hold only inline content. Browsers render it, but the HTML is invalid, and headings or lists inside it are not announced as such.',
						advice: 'Use spans and other inline elements. A card template stacks them for you.',
					}
				: null,
	},
	'control-label-control': {
		selector: CONTROL_LABELS,
		check: (label) => {
			const own = label.querySelector(':scope > input');
			return Array.from(label.querySelectorAll(LABELABLE)).some((element) => element !== own)
				? {
						problem: 'This control’s label holds another control, such as a button or input.',
						reason: 'A label names every control inside it, so both get the same name, and a click on the label may reach the wrong one.',
						advice: 'Move the other control out of the label, beside the card or the group.',
					}
				: null;
		},
	},
	'card-name': {
		selector: CARDS,
		check: (label) => {
			const input = label.querySelector(':scope > input');
			const parts = Array.from(label.children).filter((child) => child !== input && visibleText(child).trim());
			return input && parts.length > 1 && !input.hasAttribute('aria-labelledby')
				? {
						problem: 'This card’s whole text is its name.',
						reason: 'A screen reader reads every part of the card as the option’s name, on every arrow press.',
						advice: 'Point aria-labelledby on the input at the title, and aria-describedby at the rest.',
					}
				: null;
		},
	},
	'control-aria-checked': {
		selector: 'input:is([type="checkbox"], [type="radio"])[aria-checked]',
		check: () => ({
			problem: 'This checkbox or radio has aria-checked.',
			reason: 'The browser already reports a native input’s state. aria-checked overrides it and goes stale, e.g. "mixed" after the user checks the box.',
			advice: 'Remove aria-checked. For a mixed checkbox, set the indeterminate property: [indeterminate]="…" in Angular.',
		}),
	},
	'group-name': {
		selector: GROUPS,
		check: (fieldset) =>
			ariaName(fieldset) || fieldset.querySelector(':scope > legend')?.textContent?.trim()
				? null
				: {
						problem: 'This group has no legend.',
						reason: 'A screen reader announces the options without the question they answer.',
						advice: 'Add a <legend> as the fieldset’s first child, e.g. <legend>Shipping</legend>.',
					},
	},
	'radio-group-shared-name': {
		selector: 'fieldset[interop-radio-group]',
		check: (fieldset) => {
			const names = new Set(Array.from(fieldset.querySelectorAll('input[type="radio"]'), (radio) => radio.getAttribute('name') ?? ''));
			return names.size > 1 || names.has('')
				? {
						problem: 'The radios in this group do not all share one name.',
						reason: 'Radios with the same name are one control: one checked at a time, one tab stop, arrow keys, and required for the group. Without it each radio stands alone.',
						advice: 'Give every radio the same name="…". Angular’s formControlName does not set it, so add name as well.',
					}
				: null;
		},
	},
	'radio-group-options': {
		selector: 'fieldset[interop-radio-group]',
		check: (fieldset) =>
			fieldset.querySelectorAll('input[type="radio"]').length < 2
				? {
						problem: 'This radio group has fewer than two radios.',
						reason: 'A radio cannot be unchecked once checked, so a single radio is a choice the user cannot take back.',
						advice: 'Add the other options, or use a checkbox for a single yes or no.',
					}
				: null,
	},
	'checkbox-group-required': {
		selector: 'fieldset[interop-checkbox-group]',
		check: (fieldset) => {
			const boxes = Array.from(fieldset.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
			return boxes.length > 1 && boxes.every((box) => box.required)
				? {
						problem: 'Every checkbox in this group is required.',
						reason: 'required on a checkbox means that box must be checked, so the form will not submit until all of them are.',
						advice: 'For "choose at least one", remove required and check the group: setCustomValidity() on one box, or a validator in your form model.',
					}
				: null;
		},
	},
	'tabs-name': {
		selector: TABLISTS,
		check: (tablist) =>
			ariaName(tablist)
				? null
				: {
						problem: 'This tab list has no name.',
						reason: 'A screen reader announces "tab list" with nothing to say what the tabs are for.',
						advice: 'Add aria-label="…" to the tab list, or aria-labelledby pointing at a heading.',
					},
	},
	'tabs-empty': {
		selector: TABLISTS,
		check: (tablist) =>
			tabsIn(tablist).length
				? null
				: {
						problem: 'This tab list has no tabs.',
						reason: 'A tab list must own tabs. An empty one is announced as a control with nothing in it.',
						advice: 'Render the tab list only when it has tabs.',
					},
	},
	'tabs-children': {
		selector: `${TABLISTS} > :not([role="tab"])`,
		check: () => ({
			problem: 'This element is inside a tab list but is not a tab.',
			reason: 'A tab list may own only tabs. Anything else is skipped by the arrow keys, or announced as part of the tabs.',
			advice: 'Move it out of the tab list. Put actions in a toolbar beside it.',
		}),
	},
	'tabs-panel': {
		selector: `${TABLISTS} > [role="tab"]`,
		check: (tab) =>
			panelOf(tab)
				? null
				: {
						problem: 'This tab does not control a tab panel.',
						reason: 'A tab shows its panel through aria-controls. Without one, choosing it shows nothing, and screen readers cannot find its content.',
						advice: 'Set aria-controls to the id of a role="tabpanel" element.',
					},
	},
	'tabs-selected': {
		selector: TABLISTS,
		check: (tablist) =>
			tabsIn(tablist).filter((tab) => tab.getAttribute('aria-selected') === 'true').length === 1 || !tabsIn(tablist).length
				? null
				: {
						problem: 'This tab list does not have exactly one selected tab.',
						reason: 'One tab is always selected, and its panel shown. With none or several, the shown panel and the announced tab disagree.',
						advice: 'Mark one tab aria-selected="true" in the markup, and call bindTabs() to keep it so.',
					},
	},
	'tabs-panel-hidden': {
		selector: `${TABLISTS} > [role="tab"]:not([aria-selected="true"])`,
		check: (tab) => {
			const panel = panelOf(tab);
			return panel && !panel.hasAttribute('hidden')
				? {
						problem: 'The panel of an unselected tab is not hidden.',
						reason: 'Every panel shows at once until the tabs bind, and screen readers read panels that are not selected.',
						advice: 'Write hidden="until-found" on every panel but the selected one, so the page renders right before bindTabs() runs.',
					}
				: null;
		},
	},
	'steps-name': {
		selector: 'ol[interop-steps]',
		check: (list) =>
			ariaName(list)
				? null
				: {
						problem: 'This step indicator has no name.',
						reason: 'A screen reader announces a list of steps with nothing to say what process they belong to.',
						advice: 'Add aria-label="…" to the list, e.g. aria-label="Application progress".',
					},
	},
	'steps-current': {
		selector: 'ol[interop-steps]',
		check: (list) =>
			list.querySelectorAll(':scope > li[aria-current="step"]').length === 1
				? null
				: {
						problem: 'This step indicator does not mark exactly one current step.',
						reason: 'The current step, and every completed step before it, are drawn from aria-current="step". With none or several, the indicator and the page disagree.',
						advice: 'Mark the current step <li aria-current="step">, and only that one.',
					},
	},
	'steps-control': {
		selector: 'ol[interop-steps] > li',
		check: (step) => {
			const current = step.parentElement!.querySelector(':scope > li[aria-current="step"]');
			const future = current ? current.compareDocumentPosition(step) & Node.DOCUMENT_POSITION_FOLLOWING : 0;
			if (step.querySelector('button, [role="tab"], [role="button"]'))
				return {
					problem: 'This step holds a button or a tab.',
					reason: 'A step indicator shows progress. Buttons and tabs in it promise a way to jump between steps that the process does not offer.',
					advice: 'Link back to a completed step with <a href>. To move between sections in any order, use tabs.',
				};
			return future && step.querySelector('a[href]')
				? {
						problem: 'A future step links ahead.',
						reason: 'A later step depends on the ones before it, so a link to it skips steps the user has not done.',
						advice: 'Link only completed steps.',
					}
				: null;
		},
	},
	'steps-form-heading': {
		selector: 'form[interop-steps-form] > fieldset',
		check: (step) =>
			step.querySelector('legend, h1, h2, h3, h4, h5, h6')?.textContent?.trim()
				? null
				: {
						problem: 'This step has no legend or heading.',
						reason: 'After a step change focus moves to the step’s heading, which says where the user is. Without one, focus has nowhere useful to go.',
						advice: 'Start the step with a <legend>, e.g. <legend><h2>Address (step 2 of 3)</h2></legend>.',
					},
	},
	'steps-form-hidden': {
		selector: 'form[interop-steps-form] > fieldset:is([disabled], [hidden="until-found"])',
		check: (step) => ({
			problem: step.hasAttribute('disabled') ? 'This step is disabled.' : 'This step is hidden until found.',
			reason: step.hasAttribute('disabled')
				? 'A disabled fieldset leaves its values out of the submission.'
				: 'Find-in-page would reveal a step the user has not reached.',
			advice: 'Hide a step with plain hidden. bindSteps() shows and hides them for you.',
		}),
	},
	'tags-remove-name': {
		selector: 'ul[interop-tags] > li > button',
		check: (button) => {
			const tag = button.parentElement!;
			const text = squash(
				Array.from(tag.childNodes)
					.filter((node) => !(node instanceof HTMLButtonElement) && !(node instanceof HTMLInputElement))
					.map(visibleText)
					.join(''),
			);
			return text && !squash(accessibleName(button)).includes(text)
				? {
						problem: 'This remove button’s name does not say which tag it removes.',
						reason: 'Every tag’s button is announced the same, e.g. "Remove, button", so a screen reader user cannot tell them apart.',
						advice: 'Name it for its tag: <span itx-visually-hidden>Remove Football</span>, or aria-label="Remove Football".',
					}
				: null;
		},
	},
	'tags-list-role': {
		selector: 'ul[interop-tags]:not([role="list"])',
		check: () => ({
			problem: 'This tag list has no role="list".',
			reason: 'Safari drops a list’s semantics when its markers are removed, so VoiceOver does not say how many tags there are.',
			advice: 'Add role="list" to the <ul>.',
		}),
	},
	'dialog-name': {
		selector: 'dialog[interop-dialog]',
		check: (dialog) =>
			ariaName(dialog)
				? null
				: {
						problem: dialog.hasAttribute('aria-labelledby') ? 'This dialog’s aria-labelledby points at nothing with text.' : 'This dialog has no name.',
						reason: 'A screen reader announces a dialog by its name when it opens. Without one, the user hears "dialog" and nothing about what it is for.',
						advice: 'Point aria-labelledby at the dialog’s heading: <dialog aria-labelledby="title"><h2 id="title">…</h2>.',
					},
	},
	'dialog-close': {
		selector: 'dialog[interop-dialog][closedby="none"]',
		check: (dialog) =>
			dialog.querySelector('button:is([command="close"], [command="request-close"], [formmethod="dialog"]), form[method="dialog"] button:not([type="button"], [type="reset"])')
				? null
				: {
						problem: 'This dialog cannot be closed.',
						reason: 'closedby="none" turns off Escape and clicks outside, and no button inside closes it, so a keyboard user is trapped (WCAG 2.1.2).',
						advice: 'Add a button with command="request-close" or command="close", or a button in <form method="dialog">.',
					},
	},
	'dialog-alert-description': {
		selector: 'dialog[interop-dialog][role="alertdialog"]:not([aria-describedby])',
		check: () => ({
			problem: 'This alert dialog has no description.',
			reason: 'An alert dialog interrupts with an urgent message. Screen readers read its description with its name, so without one the message itself is not announced.',
			advice: 'Point aria-describedby at the message: <p id="message">…</p>.',
		}),
	},
	'select-option-text': {
		selector: 'select[interop-select] option',
		check: (option) =>
			squash(option.getAttribute('label') ?? '') || squash(spokenText(option))
				? null
				: {
						problem: 'This option has no text.',
						reason: 'Screen readers read an option’s text, and browsers without customizable select show only its text, so the option is blank to both.',
						advice: 'Give every option text. Hide it visually with itx-visually-hidden if an icon shows instead.',
					},
	},
	'select-multiple': {
		selector: 'select[interop-select][multiple]',
		check: () => ({
			problem: 'This select takes several choices.',
			reason: 'Keyboard and screen reader users struggle with a multiple select: in testing it reached 25% task success, against 100% for a single select.',
			advice: 'Use a <fieldset interop-checkbox-group> with a checkbox per option.',
		}),
	},
	'pressed-value': {
		selector: '[interop-button][aria-pressed]',
		check: (button) =>
			['true', 'false', 'mixed'].includes(button.getAttribute('aria-pressed')!)
				? null
				: {
						problem: `aria-pressed="${button.getAttribute('aria-pressed')}" is not a value assistive technology understands.`,
						reason: 'Only "true", "false" and "mixed" mean anything, so the toggle state is lost.',
						advice: 'Use aria-pressed="true" or "false".',
					},
	},
};

/** Every issue under `root`. Elements carrying `itx-audit-ignore` skip the rules it names, or all rules when empty. */
export function auditInterop(root: ParentNode = document): AuditIssue[] {
	const issues: AuditIssue[] = [];
	for (const [rule, { selector, check }] of Object.entries(RULES)) {
		for (const element of Array.from(root.querySelectorAll(selector))) {
			if (ignored(element, rule)) continue;
			const issue = check(element);
			if (issue) issues.push({ rule, element, ...issue });
		}
	}
	return issues;
}

let stopWatching: (() => void) | null = null;

/**
 * Audits the page now and after every change, and warns once per issue per element. Turned off
 * by `<html itx-audit="off">`. Returns a function that stops watching.
 */
export function watchInterop(root: Document = document): () => void {
	if (stopWatching) return stopWatching;
	if (typeof MutationObserver === 'undefined' || auditOff(root)) return () => {};

	console.info(
		'Interop is checking this page for accessibility problems while the app runs in development mode. ' +
			'To turn this off, add itx-audit="off" to the <html> element.',
	);

	const warned = new WeakMap<Element, Set<string>>();
	let scheduled = false;
	const run = () => {
		scheduled = false;
		if (auditOff(root)) return;
		for (const issue of auditInterop(root)) {
			const rules = warned.get(issue.element) ?? new Set<string>();
			if (rules.has(issue.rule)) continue;
			rules.add(issue.rule);
			warned.set(issue.element, rules);
			console.warn(`Interop · ${issue.rule}\n${issue.problem}\n${issue.reason}\n${issue.advice}`, issue.element);
		}
	};
	const schedule = () => {
		if (scheduled) return;
		scheduled = true;
		setTimeout(run);
	};

	const observer = new MutationObserver(schedule);
	observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true });
	schedule();

	stopWatching = () => {
		observer.disconnect();
		stopWatching = null;
	};
	return stopWatching;
}

declare const ngDevMode: unknown;

/** Starts the audit in an Angular development build. Production builds remove it. */
export function watchInteropInDevMode(): void {
	if (typeof ngDevMode !== 'undefined' && ngDevMode) watchInterop();
}

function auditOff(root: Document): boolean {
	return root.documentElement.getAttribute('itx-audit') === 'off';
}

function ignored(element: Element, rule: string): boolean {
	const value = element.getAttribute('itx-audit-ignore');
	if (value === null) return false;
	const rules = value.trim().split(/\s+/).filter(Boolean);
	return rules.length === 0 || rules.includes(rule);
}

/** A simplified accessible name: aria-labelledby, aria-label, visible text, then title. */
function accessibleName(element: Element): string {
	const name = ariaName(element);
	if (name) return name;
	const text = Array.from(element.childNodes).map(visibleText).join('').trim();
	if (text) return text;
	return element.getAttribute('title')?.trim() ?? '';
}

/** The name from aria-labelledby or aria-label alone. */
function ariaName(element: Element): string {
	const labelledby = element.getAttribute('aria-labelledby');
	if (labelledby) {
		const text = labelledby
			.split(/\s+/)
			.map((id) => element.ownerDocument.getElementById(id)?.textContent ?? '')
			.join(' ')
			.trim();
		if (text) return text;
	}
	return element.getAttribute('aria-label')?.trim() ?? '';
}

/** Lowercase, with runs of white space as one space. */
function squash(text: string): string {
	return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** The tooltips an element references through `relation`. */
function tooltipsOf(element: Element, relation: 'aria-labelledby' | 'aria-describedby'): HTMLElement[] {
	return (element.getAttribute(relation) ?? '')
		.split(/\s+/)
		.map((id) => (id ? element.ownerDocument.getElementById(id) : null))
		.filter((target): target is HTMLElement => !!target?.matches('[interop-tooltip]'));
}

/** The text assistive technology reads inside an element. */
function spokenText(element: Element): string {
	return Array.from(element.childNodes).map(visibleText).join('').trim();
}

function visibleText(node: Node): string {
	if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
	if (!(node instanceof Element) || node.getAttribute('aria-hidden') === 'true') return '';
	// Chrome leaves a status region's text out of the name of the control around it.
	if (node.getAttribute('role') === 'status') return '';
	const label = node.getAttribute('aria-label') ?? (node instanceof HTMLImageElement ? node.alt : null);
	if (label) return ` ${label} `;
	return Array.from(node.childNodes).map(visibleText).join('');
}
