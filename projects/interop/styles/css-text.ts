/**
 * A declaration's value as one line, so a value the formatter wrapped across lines reads the same as
 * one written on a single line: `max(\n\t0px,\n\t…\n)` becomes `max(0px, …)`.
 */
export const oneLine = (value: string): string => value.replace(/\s+/g, ' ').replace(/\(\s/g, '(').replace(/\s\)/g, ')').trim();
