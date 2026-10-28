import { OWNS_ARROW_KEYS } from './focusable';

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

const BUTTONS = ':is(button, summary)[interop-button], button:has(svg[interop-icon])';
const BADGES = '[interop-badge]:not([hidden])';
const LIVE = '[role="status"], [aria-live]';
const INTERACTIVE = 'a[href], button, input, select, textarea, details, [tabindex], [contenteditable]';
const CONTROL_LABELS = 'label:is([interop-switch], [interop-checkbox]), fieldset[interop-radio-group] label:has(> input[type="radio"])';
const GROUPS = 'fieldset:is([interop-radio-group], [interop-checkbox-group])';
const TABLISTS = '[interop-tabs] > [role="tablist"]';
/** Elements that can carry a callout's status word: a visible label, a title, or hidden text. */
const CALLOUT_STATUS =
	':scope > div > :is(small, h1, h2, h3, h4, h5, h6), :scope > div > p:first-child > strong:first-child, [itx-visually-hidden]';
const CARDS = 'fieldset:is([interop-radio-group~="cards"], [interop-checkbox-group~="cards"]) > label';
/** Elements a label may not hold: it allows phrasing content only. */
const BLOCK =
	'address, article, aside, blockquote, details, div, dl, fieldset, figure, footer, form, h1, h2, h3, h4, h5, h6, header, hr, li, main, nav, ol, p, pre, section, table, ul';
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
	'button-icon-square': {
		selector: ':is(button, summary)[interop-button]:not([interop-button~="icon"])',
		check: (button) =>
			button.querySelector('svg[interop-icon]') && !shownText(button).trim()
				? {
						problem: 'This button shows only an icon, but is not marked as an icon button.',
						reason: 'Its padding is sized for text, so it is wider than it is tall.',
						advice: 'Add interop-button="icon", which makes it square at every size.',
					}
				: null,
	},
	'button-activation-guard': {
		selector: '[interop-button]:is([aria-disabled="true"], [aria-busy="true"])',
		check: () =>
			activationGuards > 0
				? null
				: {
						problem: 'This button is aria-disabled or aria-busy, but guardActivation() is not installed.',
						reason:
							'Unlike native disabled, these attributes do not stop clicks, so the button still runs its handlers, submits its form and sends its command.',
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
						advice:
							'Give it text, hidden when it shows a dot: <span interop-badge="dot"><span itx-visually-hidden>New activity</span></span>.',
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
	'badge-live-region-name': {
		selector: `:is(button, a[href], [role="button"], [role="link"]) ${BADGES}:is(${LIVE})`,
		check: () => ({
			problem: 'This badge is a live region inside a control, so its text is left out of the control’s name.',
			reason:
				'Browsers do not include a live region’s text in the name of the control around it, so the control is announced without its count.',
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
	'code-block-scroll-focusable': {
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
						reason:
							'A disabled control cannot take focus, so keyboard users never see the tooltip, and some browsers send it no pointer events either.',
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
						advice:
							'If the tooltip is the only name, make it interop-tooltip="label" and remove the other name. Otherwise remove the tooltip or say something new in it.',
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
						reason:
							'A label tooltip becomes the whole name, so a voice control user who says the visible text cannot reach the control (WCAG 2.5.3).',
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
						reason:
							'A label may hold only inline content. Browsers render it, but the HTML is invalid, and headings or lists inside it are not announced as such.',
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
	'cards-name': {
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
			reason:
				'The browser already reports a native input’s state. aria-checked overrides it and goes stale, e.g. "mixed" after the user checks the box.',
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
	'group-role': {
		selector: 'div[interop-group]:not([role="group"])',
		check: () => ({
			problem: 'This group has no role="group".',
			reason:
				'Without the role, a screen reader does not say the group’s name, and its controls are announced one by one with nothing that joins them.',
			advice:
				'Add role="group" and a name: <div role="group" interop-group aria-label="…">. For one Tab stop and arrow keys, use a toolbar.',
		}),
	},
	'group-label': {
		selector: ':is(div[interop-group][role="group"], fieldset[interop-group])',
		check: (group) =>
			ariaName(group) || group.querySelector(':scope > legend')?.textContent?.trim()
				? null
				: {
						problem: 'This group has no name.',
						reason: 'A screen reader says "group" with nothing to say what the controls are for.',
						advice: group.matches('fieldset')
							? 'Add a <legend> as its first child.'
							: 'Add aria-label="…", or aria-labelledby pointing at a heading.',
					},
	},
	'group-attached-name': {
		selector: '[interop-group~="attached"] > button',
		check: (button) => {
			const name = squash(accessibleName(button));
			const others = Array.from(button.parentElement!.children)
				.filter((sibling) => sibling !== button && sibling.matches('button'))
				.map((sibling) => squash(accessibleName(sibling)));
			const generic = /^(open|toggle|toggle dropdown|dropdown|menu|open menu|more|more options|options|show more|expand)$/.test(name);
			return name && (generic || others.includes(name))
				? {
						problem: generic
							? `This button is named "${name}", which does not say what it is for.`
							: 'This button has the same name as the button it is attached to.',
						reason:
							'A screen reader announces two buttons that look like one. Each needs a name that says what it does and how it relates to the other.',
						advice: 'Name it for its action, e.g. "More save options" beside "Save".',
					}
				: null;
		},
	},
	'radio-group-shared-name': {
		selector: 'fieldset[interop-radio-group]',
		check: (fieldset) => {
			const names = new Set(Array.from(fieldset.querySelectorAll('input[type="radio"]'), (radio) => radio.getAttribute('name') ?? ''));
			return names.size > 1 || names.has('')
				? {
						problem: 'The radios in this group do not all share one name.',
						reason:
							'Radios with the same name are one control: one checked at a time, one tab stop, arrow keys, and required for the group. Without it each radio stands alone.',
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
						advice:
							'For "choose at least one", remove required and check the group: setCustomValidity() on one box, or a validator in your form model.',
					}
				: null;
		},
	},
	'table-name': {
		selector: 'table[interop-table]',
		check: (table) =>
			ariaName(table) || table.querySelector(':scope > caption')?.textContent?.trim()
				? null
				: {
						problem: 'This table has no name.',
						reason: 'A screen reader lists tables by name, and announces this one with nothing to say what it holds.',
						advice: 'Add a <caption> as the table’s first child, or aria-labelledby pointing at a heading.',
					},
	},
	'table-headers': {
		selector: 'table[interop-table]',
		check: (table) =>
			table.querySelector('th')
				? null
				: {
						problem: 'This table has no header cells.',
						reason:
							'Without a <th>, a screen reader reads each cell without saying which column or row it belongs to, and Safari may treat the table as layout.',
						advice: 'Make the header row <th scope="col">, and the cell that names each row <th scope="row">.',
					},
	},
	'table-rowgroup': {
		selector: 'table[interop-table] th[scope="rowgroup"]',
		check: (header) => {
			const row = header.parentElement;
			const group = row?.parentElement;
			return group?.matches('tbody') && group.firstElementChild === row && group.querySelectorAll('th[scope="rowgroup"]').length === 1
				? null
				: {
						problem: 'This group header is not the first row of its own <tbody>.',
						reason: 'A row group header labels every row in its <tbody>, so in a shared <tbody> it labels the rows of later groups too.',
						advice: 'Give each group its own <tbody>, with the group header in its first row.',
					};
		},
	},
	'table-overflow': {
		selector: 'table[interop-table]',
		check: (table) => {
			const container = blockAncestor(table);
			return container && !table.closest('[interop-scroll-area]') && table.getBoundingClientRect().width > container.clientWidth + 1
				? {
						problem: 'This table is wider than its container.',
						reason: 'The page scrolls sideways to show it, so every line of text on the page needs two directions to read (WCAG 1.4.10).',
						advice: 'Wrap it in <div interop-scroll-area aria-labelledby="…"> named by its caption, or shorten what will not wrap.',
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
	'toolbar-role': {
		selector: '[interop-toolbar]:not([role="toolbar"])',
		check: () => ({
			problem: 'This toolbar has no role="toolbar".',
			reason: 'focusgroup="toolbar" gives the role only in browsers that support focusgroup. Elsewhere it is announced as plain content.',
			advice: 'Add role="toolbar".',
		}),
	},
	'toolbar-focusgroup': {
		selector: '[interop-toolbar]:not([focusgroup~="toolbar"])',
		check: () => ({
			problem: 'This toolbar has no focusgroup="toolbar".',
			reason:
				'Browsers with focusgroup move focus between the items only when it is set, and bindToolbar() steps aside for them. The toolbar is then one Tab stop per item.',
			advice: 'Add focusgroup="toolbar".',
		}),
	},
	'toolbar-name': {
		selector: '[role="toolbar"], [interop-toolbar]',
		check: (toolbar) =>
			ariaName(toolbar)
				? null
				: {
						problem: 'This toolbar has no name.',
						reason:
							'A screen reader announces "toolbar" with nothing to say what it acts on. With two toolbars on a page, ARIA requires a name.',
						advice: 'Add aria-label="…", or aria-labelledby pointing at visible text.',
					},
	},
	'toolbar-size': {
		selector: '[interop-toolbar]',
		check: (toolbar) =>
			toolbar.querySelectorAll(INTERACTIVE).length < 3
				? {
						problem: 'This toolbar has fewer than three controls.',
						reason: 'A toolbar hides all but one of its controls from the Tab key. With one or two, that costs more than it saves.',
						advice: 'Remove role="toolbar", focusgroup and interop-toolbar, and leave the buttons as they are.',
					}
				: null,
	},
	'toolbar-button-size': {
		selector: '[interop-toolbar][itx-size] [interop-button][itx-size]',
		check: (button) => ({
			problem: `This button's itx-size="${button.getAttribute('itx-size')}" is ignored.`,
			reason: `Its toolbar sets itx-size="${button.closest('[interop-toolbar]')!.getAttribute('itx-size')}" for every button in it, so the buttons stay one size.`,
			advice: 'Remove itx-size from the button, or change it on the toolbar.',
		}),
	},
	'toolbar-orientation': {
		selector: '[focusgroup~="toolbar"][focusgroup~="block"]:not([aria-orientation="vertical"])',
		check: () => ({
			problem: 'This vertical toolbar has no aria-orientation="vertical".',
			reason: 'Up and Down move focus, but the toolbar is announced as horizontal, so a screen reader user presses Left and Right.',
			advice: 'Add aria-orientation="vertical".',
		}),
	},
	'toolbar-arrow-keys': {
		selector: '[interop-toolbar]',
		check: (toolbar) => {
			const items = Array.from(toolbar.querySelectorAll(INTERACTIVE));
			const owners = items.filter((item) => item.matches(OWNS_ARROW_KEYS));
			return owners.length > 1 || (owners.length === 1 && owners[0] !== items.at(-1))
				? {
						problem: 'A control in this toolbar uses the arrow keys and is not its last item.',
						reason:
							'A text field moves its caret, and radios change their selection, with the same keys that move between toolbar items. Focus cannot leave it with the arrows.',
						advice: 'Put one text field last, and replace radios with buttons using aria-pressed, or move them out of the toolbar.',
					}
				: null;
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
			advice: 'Move it out of the tab list. Put actions beside it.',
		}),
	},
	'tabs-panel': {
		selector: `${TABLISTS} > [role="tab"]`,
		check: (tab) =>
			panelOf(tab)
				? null
				: {
						problem: 'This tab does not control a tab panel.',
						reason:
							'A tab shows its panel through aria-controls. Without one, choosing it shows nothing, and screen readers cannot find its content.',
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
						reason:
							'One tab is always selected, and its panel shown. With none or several, the shown panel and the announced tab disagree.',
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
						reason:
							'The current step, and every completed step before it, are drawn from aria-current="step". With none or several, the indicator and the page disagree.',
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
					reason:
						'A step indicator shows progress. Buttons and tabs in it promise a way to jump between steps that the process does not offer.',
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
						reason:
							'After a step change focus moves to the step’s heading, which says where the user is. Without one, focus has nowhere useful to go.',
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
	'tree-summary-control': {
		selector: 'ul[interop-tree] summary',
		check: (summary) =>
			summary.querySelector('a[href], button, input, select, textarea, [tabindex]')
				? {
						problem: 'This branch’s summary holds a link or a control.',
						reason:
							'The summary is the control that opens the branch. A link or button inside it is a control inside a control: screen readers announce one of them, and a click does both.',
						advice: 'Write the summary as text, and list the branch’s own page as its first child: <li><a href="…">Overview</a></li>.',
					}
				: null,
	},
	'disclosure-summary': {
		selector: 'details[interop-disclosure]',
		check: (details) =>
			details.firstElementChild?.matches('summary')
				? null
				: {
						problem: 'This disclosure has no <summary> as its first child.',
						reason: 'The browser supplies a summary that says "Details", so every disclosure without one reads the same.',
						advice: 'Start the <details> with <summary>, worded as what it shows: <summary>Why can I set bounds in two places?</summary>.',
					},
	},
	'disclosure-summary-role': {
		selector: 'details[interop-disclosure] > summary[role]',
		check: () => ({
			problem: 'This disclosure’s summary has a role.',
			reason:
				'The summary is already the control that opens it. A role replaces that: Safari on macOS then drops its expanded state and any heading inside it.',
			advice: 'Remove the role from the <summary>.',
		}),
	},
	'disclosure-summary-control': {
		selector: 'details[interop-disclosure] > summary',
		check: (summary) =>
			summary.querySelector('a[href], button, input, select, textarea, [tabindex]')
				? {
						problem: 'This disclosure’s summary holds a link or a control.',
						reason:
							'The summary is the control that opens the disclosure. A link or button inside it is a control inside a control: screen readers announce one of them, and a click does both.',
						advice: 'Write the summary as text, and put the link or control in the content.',
					}
				: null,
	},
	'page-nav-name': {
		selector: 'nav[interop-page-nav]',
		check: (nav) =>
			ariaName(nav)
				? null
				: {
						problem: 'This page nav has no name.',
						reason: 'A page usually has more than one navigation landmark, and screen readers list them by name.',
						advice: 'Add aria-label="On this page" to the <nav>.',
					},
	},
	'list-role': {
		selector:
			':is(ul[interop-tags], ol[interop-steps], ul[interop-tree], ul[interop-tree] ul, nav[interop-page-nav] > ul):not([role="list"])',
		check: (list) => ({
			problem: `This ${list.hasAttribute('interop-steps') ? 'step indicator' : list.closest('ul[interop-tree]') ? 'tree list' : list.parentElement?.matches('nav[interop-page-nav]') ? 'page nav list' : 'tag list'} has no role="list".`,
			reason:
				'Safari drops a list’s semantics when its markers are removed, so VoiceOver does not say how many items there are, or which step of how many this is.',
			advice: `Add role="list" to the <${list.tagName.toLowerCase()}>.`,
		}),
	},
	'dialog-name': {
		selector: 'dialog[interop-dialog]',
		check: (dialog) =>
			ariaName(dialog)
				? null
				: {
						problem: dialog.hasAttribute('aria-labelledby')
							? 'This dialog’s aria-labelledby points at nothing with text.'
							: 'This dialog has no name.',
						reason:
							'A screen reader announces a dialog by its name when it opens. Without one, the user hears "dialog" and nothing about what it is for.',
						advice: 'Point aria-labelledby at the dialog’s heading: <dialog aria-labelledby="title"><h2 id="title">…</h2>.',
					},
	},
	'dialog-close': {
		selector: 'dialog[interop-dialog][closedby="none"]',
		check: (dialog) =>
			dialog.querySelector(
				'button:is([command="close"], [command="request-close"], [formmethod="dialog"]), form[method="dialog"] button:not([type="button"], [type="reset"])',
			)
				? null
				: {
						problem: 'This dialog cannot be closed.',
						reason:
							'closedby="none" turns off Escape and clicks outside, and no button inside closes it, so a keyboard user is trapped (WCAG 2.1.2).',
						advice: 'Add a button with command="request-close" or command="close", or a button in <form method="dialog">.',
					},
	},
	'dialog-alert-description': {
		selector: 'dialog[interop-dialog][role="alertdialog"]:not([aria-describedby])',
		check: () => ({
			problem: 'This alert dialog has no description.',
			reason:
				'An alert dialog interrupts with an urgent message. Screen readers read its description with its name, so without one the message itself is not announced.',
			advice: 'Point aria-describedby at the message: <p id="message">…</p>.',
		}),
	},
	'dialog-palette-field': {
		selector: 'dialog[interop-dialog~="palette"]',
		check: (dialog) => {
			const field = dialog.querySelector<HTMLInputElement>(':scope > search input[type="search"]');
			return field && (field.labels?.length || ariaName(field))
				? null
				: {
						problem: field ? 'This palette’s search field has no label.' : 'This palette has no search field.',
						reason:
							'A palette is a search field over its results. The field takes focus when it opens, so its label is the first thing a screen reader says after the dialog’s name.',
						advice:
							'Put a named search field first: <search><input type="search" aria-label="Go to page" placeholder="Go to page" autofocus></search>, or give it a <label>.',
					};
		},
	},
	'slider-name': {
		selector: 'input[type="range"][interop-slider]',
		check: (slider) =>
			(slider as HTMLInputElement).labels?.length || ariaName(slider)
				? null
				: {
						problem: 'This slider has no name.',
						reason: 'A screen reader announces it as "slider" and a number, with nothing to say what the number is.',
						advice: 'Add <label for="…"> with the slider’s id, or aria-label="…".',
					},
	},
	'slider-range': {
		selector: 'input[type="range"][interop-slider]',
		check: (slider) => {
			const { min, max, step, value } = rangeOf(slider as HTMLInputElement);
			if (!(max > min))
				return {
					problem: `This slider’s min (${min}) is not below its max (${max}).`,
					reason: 'The browser cannot move the thumb, so the slider holds one value.',
					advice: 'Set min below max.',
				};
			if (step !== null && !(step > 0))
				return {
					problem: `This slider’s step (${step}) is not a positive number.`,
					reason: 'The browser ignores it and steps by 1.',
					advice: 'Set a positive step, or step="any".',
				};
			if (value !== null && (value < min || value > max))
				return {
					problem: `This slider’s value (${value}) is outside ${min}–${max}.`,
					reason: 'The browser moves it to the nearest end, so the page and the slider disagree about the value.',
					advice: 'Keep the value between min and max.',
				};
			if (step && Math.abs((max - min) / step - Math.round((max - min) / step)) > 1e-9)
				return {
					problem: `This slider’s step (${step}) does not divide ${min}–${max}.`,
					reason: 'The thumb cannot reach max: the last step falls short of it.',
					advice: 'Choose a step that divides max − min, or change max.',
				};
			return null;
		},
	},
	'progress-name': {
		selector: 'progress[interop-progress]',
		check: (progress) =>
			(progress as HTMLProgressElement).labels?.length || ariaName(progress)
				? null
				: {
						problem: 'This progress bar has no name.',
						reason: 'A screen reader announces it as "progress bar" and a percentage, with nothing to say what is in progress.',
						advice: 'Add <label for="…"> with the progress bar’s id, or aria-label="…".',
					},
	},
	'progress-aria': {
		selector: 'progress[interop-progress]',
		check: (progress) => {
			const set = ['role', 'aria-valuenow', 'aria-valuemin', 'aria-valuemax'].filter((name) => progress.hasAttribute(name));
			return set.length
				? {
						problem: `This progress bar sets ${set.join(', ')}.`,
						reason:
							'A <progress> already has the progressbar role and takes its range from value and max. ARIA values override them, so the bar and its announcement can disagree.',
						advice:
							'Remove them. Set value and max, leave value out while the amount is unknown, and use aria-valuetext for words such as "3 of 7 files".',
					}
				: null;
		},
	},
	'toasts-name': {
		selector: '[interop-toasts]',
		check: (region) =>
			ariaName(region)
				? null
				: {
						problem: 'This toast region has no name.',
						reason: 'Screen reader users find toasts through the landmarks list, by the region’s name. Without one it is not a landmark.',
						advice: 'Add aria-label="Notifications".',
					},
	},
	'toasts-popover': {
		selector: '[interop-toasts]:not([popover="manual"])',
		check: (region) => ({
			problem: region.hasAttribute('popover')
				? 'This toast region is a popover that closes by itself.'
				: 'This toast region is not a popover.',
			reason: region.hasAttribute('popover')
				? 'An auto popover closes on any click or Escape elsewhere, taking every toast with it.'
				: 'Without the top layer, an open popover or a select’s picker covers the toasts.',
			advice: 'Add popover="manual".',
		}),
	},
	'toasts-stack': {
		selector: '[interop-toasts]',
		check: (region) =>
			region.querySelectorAll(':scope > [interop-toast]').length > 3
				? {
						problem: 'This toast region holds more than three toasts.',
						reason: 'A stack this tall covers the page, and each toast is easier to miss. Toasts stay until dismissed, so they add up.',
						advice: 'Show one toast for a group of changes ("3 files deleted"), or show the result in the page instead.',
					}
				: null,
	},
	'toast-timeout-ignored': {
		selector: '[interop-toast][data-timeout]',
		check: (item) =>
			item.matches('[itx-color="danger"]') || item.querySelectorAll('button').length > 1
				? {
						problem: `This toast ${item.matches('[itx-color="danger"]') ? 'is danger' : 'has an action'}, so its timeout is ignored.`,
						reason: 'An error or an action that disappears on a timer can be gone before the user reads it or reaches it (WCAG 2.2.1).',
						advice: 'Leave out timeout. The toast stays until the user dismisses it.',
					}
				: null,
	},
	'toast-under-modal': {
		selector: '[interop-toast]',
		check: (item) => {
			const modal = Array.from(item.ownerDocument.querySelectorAll('dialog[open]')).find((dialog) => matchesSafely(dialog, ':modal'));
			return modal && !modal.contains(item)
				? {
						problem: 'This toast is outside the open modal dialog.',
						reason:
							'A modal dialog makes the rest of the page inert. The toast shows over it, but nothing in it can be clicked or focused.',
						advice:
							'Put a <section interop-toasts popover="manual" aria-label="Notifications"> inside the dialog. toast() uses it while the dialog is open.',
					}
				: null;
		},
	},
	'callout-role': {
		selector: '[interop-callout]',
		check: (callout) => {
			const role = callout.getAttribute('role');
			if (role === 'note') return null;
			if (role === 'alert' || role === 'status')
				return {
					problem: `This callout is role="${role}", a live region.`,
					reason:
						'A live region is announced when it appears, so a callout that a router or @if inserts interrupts the reader on every visit. One present at load is not announced at all.',
					advice: 'Use role="note". For a message that appears after an action, use toast() or announce().',
				};
			return {
				problem: 'This callout has no role="note".',
				reason: 'Screen readers that support the note role cannot tell where the callout starts and ends.',
				advice: 'Add role="note".',
			};
		},
	},
	'callout-status': {
		selector: '[interop-callout][itx-color]',
		check: (callout) =>
			callout.querySelector(CALLOUT_STATUS)
				? null
				: {
						problem: 'This callout shows its status by color and icon alone.',
						reason: 'A screen reader reads the text with no word for the status, so "Warning" and "Tip" sound the same.',
						advice: 'Start it with the status word: <small>Warning</small> in small print, or <span itx-visually-hidden>Warning: </span>.',
					},
	},
	'callout-icon': {
		selector: '[interop-callout][itx-color]',
		check: (callout) => {
			const words = Array.from(callout.querySelectorAll(CALLOUT_STATUS));
			if (!words.length || words.some((word) => !word.matches('[itx-visually-hidden]'))) return null;
			if (callout.querySelector(':scope > svg[interop-icon]')) return null;
			return {
				problem: 'This callout’s status word is hidden, and it has no icon.',
				reason: 'A sighted reader sees the status only as the edge color, and in forced colors not at all.',
				advice: 'Keep the status icon, or show the word in small print with <small>.',
			};
		},
	},
	'field-label': {
		selector: ':is(input, textarea)[interop-input], select[interop-select]',
		check: (control) =>
			(control as HTMLInputElement).labels?.length || ariaName(control)
				? null
				: {
						problem: control.hasAttribute('placeholder') ? 'This field has only a placeholder for a label.' : 'This field has no label.',
						reason:
							'Without a label, a screen reader announces only what kind of field it is, and a placeholder disappears as soon as the user types. Two elements with the same id also leave a label pointing at the wrong one.',
						advice: 'Add <label for="…"> with the field’s id, and check that the id is unique.',
					},
	},
	'field-describedby': {
		selector: ':is(input, textarea)[interop-input][aria-describedby], select[interop-select][aria-describedby]',
		check: (control) => {
			const missing = control
				.getAttribute('aria-describedby')!
				.split(/\s+/)
				.filter((id) => id && !control.ownerDocument.getElementById(id));
			return missing.length
				? {
						problem: `aria-describedby points at ${missing.map((id) => `#${id}`).join(', ')}, which does not exist.`,
						reason: 'The hint or error it should read is never announced.',
						advice: 'Give the hint the id that aria-describedby names, or correct the reference.',
					}
				: null;
		},
	},
	'field-number': {
		selector: 'input[interop-input][type="number"]',
		check: () => ({
			problem: 'This field is type="number".',
			reason:
				'Number inputs change value when the page is scrolled over them, drop letters silently, round long numbers, and some voice and screen reader software cannot use them.',
			advice:
				'Use type="text" with inputmode="numeric", or inputmode="decimal" for amounts. Keep type="number" only for values people step through, like a quantity.',
		}),
	},
	'field-autocomplete': {
		selector: 'input[interop-input]:is([type="email"], [type="tel"]):not([autocomplete])',
		check: (input) => ({
			problem: `This ${input.getAttribute('type')} field has no autocomplete attribute.`,
			reason:
				'When a field asks for the user’s own details, autocomplete lets the browser fill it in and tells assistive technology what it is for (WCAG 1.3.5).',
			advice: `Add autocomplete="${input.getAttribute('type')}" if it is the user’s own, or autocomplete="off" if it is someone else’s.`,
		}),
	},
	'field-hint-link': {
		selector: '[interop-hint] a[href]',
		check: () => ({
			problem: 'This hint holds a link.',
			reason:
				'A hint is read as the field’s description, and screen readers do not say that text in a description is a link, or let the user follow it from the field.',
			advice: 'Move the link out of the hint, before the field.',
		}),
	},
	'error-summary-list': {
		selector: '[interop-error-summary]:not(:has(ul))',
		check: () => ({
			problem: 'This error summary has no list.',
			reason: 'bindValidation() fills the summary’s <ul> with a link to each error; without one, the summary shows only its heading.',
			advice: 'Add an empty <ul> after the heading.',
		}),
	},
	'select-option-text': {
		selector: 'select[interop-select] option',
		check: (option) =>
			squash(option.getAttribute('label') ?? '') || squash(spokenText(option))
				? null
				: {
						problem: 'This option has no text.',
						reason:
							'Screen readers read an option’s text, and browsers without customizable select show only its text, so the option is blank to both.',
						advice: 'Give every option text. Hide it visually with itx-visually-hidden if an icon shows instead.',
					},
	},
	'select-multiple': {
		selector: 'select[interop-select][multiple]',
		check: () => ({
			problem: 'This select takes several choices.',
			reason:
				'Keyboard and screen reader users struggle with a multiple select: in testing it reached 25% task success, against 100% for a single select.',
			advice: 'Use a <fieldset interop-checkbox-group> with a checkbox per option.',
		}),
	},
	'button-pressed-value': {
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
/** The nearest ancestor that lays out as a box, skipping inline and display: contents ones, which have no width. */
function blockAncestor(element: Element): Element | null {
	let ancestor = element.parentElement;
	while (ancestor && ['inline', 'contents'].includes(getComputedStyle(ancestor).display)) ancestor = ancestor.parentElement;
	return ancestor;
}

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

/** The text drawn on screen: visually hidden text, hidden elements and icons are left out. */
function shownText(node: Node): string {
	if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
	if (!(node instanceof Element) || node.hasAttribute('hidden') || node.hasAttribute('itx-visually-hidden') || node instanceof SVGElement)
		return '';
	return Array.from(node.childNodes).map(shownText).join('');
}

function visibleText(node: Node): string {
	if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
	// Hidden content is not read, so it names nothing.
	if (!(node instanceof Element) || node.getAttribute('aria-hidden') === 'true' || node.hasAttribute('hidden')) return '';
	// Chrome leaves a status region's text out of the name of the control around it.
	if (node.getAttribute('role') === 'status') return '';
	const label = node.getAttribute('aria-label') ?? (node instanceof HTMLImageElement ? node.alt : null);
	if (label) return ` ${label} `;
	return Array.from(node.childNodes).map(visibleText).join('');
}

/** Whether an element matches a selector this browser may not support, such as :modal in jsdom. */
function matchesSafely(element: Element, selector: string): boolean {
	try {
		return element.matches(selector);
	} catch {
		return false;
	}
}

/** A range input's numbers as written: min and max default to 0 and 100; step and value are null when absent. */
function rangeOf(input: HTMLInputElement): { min: number; max: number; step: number | null; value: number | null } {
	const number = (name: string) => {
		const attribute = input.getAttribute(name);
		return attribute === null || attribute === 'any' ? null : Number(attribute);
	};
	return { min: number('min') ?? 0, max: number('max') ?? 100, step: number('step'), value: number('value') };
}
