/**
 * Terminal prompts, on `@clack/prompts`. Commands receive an `Ask` so they can run, and be
 * tested, without a terminal.
 */

import * as clack from '@clack/prompts';

import { Cancelled } from './errors.ts';

export interface Choice<T extends string> {
	readonly value: T;
	readonly label?: string;
	readonly hint?: string;
	readonly disabled?: boolean;
}

export interface Ask {
	intro(title: string): void;
	outro(message: string): void;
	success(message: string): void;
	error(message: string): void;
	select<T extends string>(message: string, choices: readonly Choice<T>[]): Promise<T>;
	multiselect<T extends string>(message: string, choices: readonly Choice<T>[], initial: readonly T[]): Promise<T[]>;
}

function settled<T>(value: T | symbol): T {
	if (clack.isCancel(value)) throw new Cancelled();
	return value as T;
}

function options<T extends string>(choices: readonly Choice<T>[]) {
	return choices.map((c) => ({
		value: c.value,
		label: c.label ?? c.value,
		...(c.hint ? { hint: c.hint } : {}),
		...(c.disabled ? { disabled: true } : {}),
	})) as clack.Option<T>[];
}

export const terminal: Ask = {
	intro: (title) => clack.intro(title),
	outro: (message) => clack.outro(message),
	success: (message) => clack.log.success(message),
	error: (message) => clack.log.error(message),
	async select<T extends string>(message: string, choices: readonly Choice<T>[]) {
		return settled<T>(await clack.select<T>({ message, options: options(choices) }));
	},
	async multiselect<T extends string>(message: string, choices: readonly Choice<T>[], initial: readonly T[]) {
		return settled<T[]>(
			await clack.multiselect<T>({ message, options: options(choices), initialValues: [...initial], required: true }),
		);
	},
};
