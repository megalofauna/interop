# Machine-readable component docs — a considered opinion

**Status:** proposal, not built. Written 2026-08-13.

The question: we maintain mental model cards (MMCs) in `.agent/components/`.
Should we surface them to the people using Interop — human or agent — and if
so, as a copy button, a download, or an API?

Short answer: **yes for agents, no in that form, and not from that source.**
The useful artefact is a generated per-component markdown file at a stable URL.
The MMCs are the wrong content to put in it, and the reason why is the whole
argument.

---

## 1. The MMCs are maintainer docs, and publishing them would be a category error

It is tempting to treat the MMCs as documentation that happens to live in an odd
folder. They are not. Read what is actually in `button.md`:

- the two-layer split between `InteropButton` and `InteropButtonActivation`, and
  **why** the split exists (bundle cost)
- the `var()` resolution gotcha, framed as a general lesson for future editors
- a **"Known gaps"** section naming arrays that are stale and a README that is
  out of sync
- "Things to know when editing"
- as of this week, `Removed: InteropButtonPrefix/Suffix` and an instruction not
  to reintroduce them by analogy with `InteropField`

Every one of those is written for someone **changing** the component. Several
would actively mislead a consumer: a "known gaps" list reads as a defect
disclosure, and a note about a directive we deleted is noise to somebody who
never knew it existed.

So the MMCs should stay where they are. They are already optimally placed for
their audience — a coding agent working *inside this repo*, which finds them via
`CLAUDE.md` and the `.agent/` convention. That is a solved problem. The unsolved
one is different.

## 2. The real gap is machine-addressability, not availability

There are two audiences and they want different things.

A **human consumer** wants to see the thing work, then copy a snippet. The demo
site already serves that well: live examples, a token table, an API table, prose
that explains the non-obvious lever. Adding a "copy the docs" button to that page
helps a human who *already knows the resource exists* and is *already on the
right page* — a narrow win with a low ceiling.

An **agent** writing code against Interop wants the contract: what attributes
exist, what tokens exist, what the accessibility rules are, what the constraints
are. It wants that as text, in one fetch, without executing JavaScript. Today it
cannot have it. The demo is an Angular SPA — fetching a component page returns an
empty document. (We know this precisely, because the Carbon borrow workflow
documents hitting exactly this problem on `carbondesignsystem.com` and routes
around it by reading GitHub raw files instead. We have imposed on others the
thing we route around ourselves.)

That is the gap worth closing, and it is not "make the docs available" — they are
available. It is **make them addressable**.

## 3. Why a URL beats a copy button or a download

| Form | What it costs | Ceiling |
|---|---|---|
| Copy button | A component, per page | Human, already on the page, already knows to click |
| Download | A component + a file on disk | Worse — the agent still has to be told where the file went |
| **Stable URL** | A build step | Any agent given "use Interop" can discover and fetch it |

A per-component markdown at a predictable path — `/components/button.md` — plus
an `/llms.txt` index at the root, means an agent handed nothing but the site can
walk from root to contract in two fetches. No scraping, no JS, no token-heavy
HTML. It is cacheable, diffable in review, and works for humans too: `curl` it,
or read it in a browser.

`llms.txt` is an emerging convention rather than a standard, which is a fine
reason to keep the format boring and the content honest, and a bad reason to
wait.

## 4. The condition — it has to be generated, or it will rot

This is the part I would not compromise on.

The repo already carries several documentation surfaces:

- the demo pages (examples, token tables, API tables)
- the MMCs in `.agent/`
- three component `README.md` files — one of which `button.md` records as
  **out of sync** with the code
- ~~`npm run docs` → typedoc + mkdocs~~ — removed. The MkDocs site deployed to
  GitHub Pages via a workflow that uploaded a directory MkDocs never wrote
  (`docs/site`, while `site_dir` was `site`), and whose path filter watched a
  `src/**` that does not exist in this workspace — so the generated API pages
  had stopped regenerating on merge. It was a documentation surface that had
  quietly stopped being derived, which is precisely the failure this document
  argues against.

That is three, and one is already documented as lying. A fourth hand-maintained
surface would be actively harmful: it would drift, and unlike a demo example —
which breaks *visibly* when it goes stale — a prose contract fails silently and
confidently, which is the worst possible failure mode for something an agent
trusts.

So the endpoint must be **derived**, never authored. The natural source is the
demo page, because it is the surface that already fails loudly:

```
component metadata (catalog)  ─┐
demo page prose + examples     ├─→  /components/<name>.md  ─→ /llms.txt
token table + API table       ─┘
```

If a token is renamed and the demo table is not updated, the demo page shows the
wrong default and someone notices. The generated markdown inherits that property
for free. The MMC does not have it and never will, because nothing renders it.

## 5. What I would not do

**Do not publish the MMCs.** Wrong audience, wrong content, and they contain
statements about internal history that would need re-litigating for every
release.

**Do not hand-write a second contract.** See section 4.

**Do not build this before deciding what the consumer contract *is*.** That is
the actual open question, and it is a design decision rather than an
implementation one: what does a consumer need to know about a component, in what
order, and what do we deliberately leave out? The demo pages imply an answer
already — masthead lead, examples with prose, token table, API table, the
accessibility rule that needs stating — but it has never been written down as a
contract, and generating from an unstated contract just moves the ambiguity
downstream.

## 6. Recommendation

1. Write down the consumer contract — one page, the section list above, agreed.
2. Add a build step that emits `/components/<name>.md` from the catalog + demo
   page sources, and an `/llms.txt` index.
3. Leave the MMCs exactly where they are.
4. Revisit the copy button afterwards. Once a canonical text form exists, "copy
   this component's docs" becomes a one-line link to the `.md` rather than a
   bespoke serialiser, and the cost of adding it drops to near zero.

Step 1 is the one that needs a human. Steps 2–4 are mechanical once it exists.

## 7. Does this actually benefit users?

Honestly: **not much today, and a lot on a two-year view.**

Interop's own strategic note says Angular is a waystation and the destination is
framework-portability. A component library whose contract is only expressible as
an Angular demo page is one that is hard to move. A per-component text contract —
attributes, tokens, semantics, constraints — is the framework-independent
description of the component. Writing it down is useful for agents now, and it is
the same artefact a future web-component implementation would have to satisfy.

That, more than agent ergonomics, is why I would do it.
