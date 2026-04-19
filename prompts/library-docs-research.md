# Library Documentation Research Prompt

Use this prompt when evaluating how to structure, design, or improve the Interop
documentation site — or any component library's doc infrastructure.

Replace `[LIBRARY]` with the library name before executing.

---

## Prompt

Research what developers expect, love, hate, and wish for in UI component library
documentation for `[LIBRARY]`. Structure the output in four sections:

### 1. Table stakes — what every component page needs

What sections and content patterns have become baseline expectations across respected
libraries? Survey Radix UI, shadcn/ui, Angular Material, PrimeNG, Chakra UI, Headless UI,
Ant Design, and Material Design. What do all of them have? What structure do they converge
on for individual component pages?

### 2. Pain points — what developers hate in existing docs

Search developer discussions (r/webdev, r/angular, r/frontend, Hacker News, dev.to) for
real opinions: "what makes library documentation bad", "component library docs frustrations",
"what I wish library docs had". Look for patterns across multiple sources. Include specific
quotes or paraphrased developer opinions where you find them. Do not rely on marketing copy.

### 3. Wishlist — differentiators most libraries don't provide

What do developers say they wish existed but rarely find? Think: per-component
accessibility tables, design token documentation, interactive prop playgrounds,
recipe examples, per-component changelogs, migration guides, AI/LLM-friendly
output, design handoff links.

### 4. Framework-specific patterns — what changes for `[LIBRARY]`'s target ecosystem

For Angular specifically: module vs. standalone import docs, signal API documentation,
ControlValueAccessor integration examples, OnPush + SSR notes, content projection
documentation, reactive vs. template-driven form examples. How do Angular-specific
libraries (PrimeNG, Angular Material, Angular CDK) handle these? What gaps exist
in the ecosystem that `[LIBRARY]` could fill?

---

## Summary format

Return findings as a structured markdown report:
- Prioritized list of table-stakes sections (in the order they should appear on a page)
- Top 10 pain points with evidence
- Wishlist items ranked by frequency of mention and implementation feasibility
- Angular-specific checklist with "covered by library X" or "gap in ecosystem" notes

---

## What this informs

Results feed directly into the documentation site architecture:
- Which `doc-*` components to build first
- What data shapes the API / token / keyboard tables need
- What content authors must write for every component page
- What differentiators to invest in vs. defer

---

*Saved: 2026-03-13. Replace `[LIBRARY]` before executing.*
