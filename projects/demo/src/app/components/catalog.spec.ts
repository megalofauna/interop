import { catalog, usedBy, type CatalogEntry } from "./catalog";

const entries: readonly CatalogEntry[] = catalog;
const slugs = entries.map((entry) => entry.slug);

describe("catalog", () => {
	it("has unique slugs and titles", () => {
		expect(new Set(slugs).size).toBe(slugs.length);
		expect(new Set(entries.map((entry) => entry.title)).size).toBe(
			entries.length,
		);
	});

	it("uses kebab-case slugs", () => {
		expect(slugs.filter((slug) => !/^[a-z]+(-[a-z]+)*$/.test(slug))).toEqual(
			[],
		);
	});

	it("is in alphabetical order by title", () => {
		const titles = entries.map((entry) => entry.title);
		expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
	});

	it("builds only from pages it lists, never from itself", () => {
		const broken = entries.flatMap((entry) =>
			(entry.builtFrom ?? [])
				.filter((slug) => slug === entry.slug || !slugs.includes(slug))
				.map((slug) => `${entry.slug} → ${slug}`),
		);
		expect(broken).toEqual([]);
	});

	it("gives every entry a one-sentence summary", () => {
		expect(
			entries
				.filter((entry) => !/^[A-Z].*\.$/.test(entry.summary))
				.map((entry) => entry.slug),
		).toEqual([]);
	});

	it("derives used by from built from", () => {
		expect(usedBy("disclosure").map((entry) => entry.slug)).toEqual([
			"accordion",
		]);
	});
});
