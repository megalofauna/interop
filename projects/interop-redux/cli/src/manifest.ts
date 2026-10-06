/** The CLI's view of the system. It reads nothing else the build writes. */

import { readFile } from 'node:fs/promises';

export interface ManifestToken {
	readonly name: string;
	readonly category: string;
	readonly type: string;
	readonly syntax: string;
	readonly description: string;
	readonly element?: string;
	readonly state?: string;
	/** The base token a state token falls back to. Present on state tokens only. */
	readonly base?: string;
	readonly enumValues?: readonly string[];
	readonly value?: string;
}

export interface ManifestScope {
	readonly scope: string;
	readonly name?: string;
	readonly selector: string;
	readonly themeLayer: string;
	readonly declarations: readonly { readonly token: string; readonly value: string }[];
}

export interface ManifestComponent {
	readonly selector: string;
	readonly themeable: boolean;
	readonly states: readonly string[];
	readonly tokens: readonly ManifestToken[];
	readonly scopes: readonly ManifestScope[];
}

export interface Manifest {
	readonly schema: number;
	/** Category order, used to group tokens. */
	readonly categories: readonly string[];
	readonly components: Readonly<Record<string, ManifestComponent>>;
}

/** The generator's output, beside this package. */
export const MANIFEST = new URL('../../src/generated/manifest.json', import.meta.url);

export async function loadManifest(url: URL = MANIFEST): Promise<Manifest> {
	return JSON.parse(await readFile(url, 'utf8')) as Manifest;
}

/** The candidate within a third of the name's length in edits, if any. */
export function closest(name: string, candidates: readonly string[]): string | undefined {
	const limit = Math.max(2, Math.floor(name.length / 3));
	let best: { candidate: string; distance: number } | undefined;
	for (const candidate of candidates) {
		const distance = editDistance(name, candidate);
		if (distance <= limit && (!best || distance < best.distance)) best = { candidate, distance };
	}
	return best?.candidate;
}

function editDistance(a: string, b: string): number {
	let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
	for (let i = 1; i <= a.length; i++) {
		const current = [i];
		for (let j = 1; j <= b.length; j++) {
			const substitution = previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1);
			current[j] = Math.min(previous[j]! + 1, current[j - 1]! + 1, substitution);
		}
		previous = current;
	}
	return previous[b.length]!;
}
