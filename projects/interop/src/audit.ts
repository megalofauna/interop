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
	const labelledby = element.getAttribute('aria-labelledby');
	if (labelledby) {
		const text = labelledby
			.split(/\s+/)
			.map((id) => element.ownerDocument.getElementById(id)?.textContent ?? '')
			.join(' ')
			.trim();
		if (text) return text;
	}
	const label = element.getAttribute('aria-label')?.trim();
	if (label) return label;
	const text = Array.from(element.childNodes).map(visibleText).join('').trim();
	if (text) return text;
	return element.getAttribute('title')?.trim() ?? '';
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
