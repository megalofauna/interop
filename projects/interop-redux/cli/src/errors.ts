/**
 * A failure the CLI reports and exits on.
 *
 * - 1: a target file exists without `--force`, or a component name is unknown.
 * - 2: bad usage, or a prompt needed where there is no terminal.
 */
export class CliError extends Error {
	readonly status: 1 | 2;

	constructor(message: string, status: 1 | 2) {
		super(message);
		this.status = status;
	}
}

/** The user cancelled a prompt. Nothing is written. */
export class Cancelled extends Error {}
