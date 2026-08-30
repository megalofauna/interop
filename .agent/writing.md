# Interop — Writing

How to write prose in this repo: comments, doc pages, commit bodies, demo copy,
`.agent` cards.

The reader wants to use the system. Tell them how it works.

## Rules

**Write in the present tense about current behavior.** The system does what it
does. How it came to do that belongs in `.agent/records/` or the git log.

**No metaphors.** A token is not a citizen, a wash, a whisper, or a promise.
Say what it is and what it does. Technical terms of art are fine — a border is
a border.

**No "not X, but Y."** State Y. If X needs correcting, correct it in its own
sentence, once.

> Bad: Roles are not solved per surface, they are fixed steps.
> Good: A role is a fixed step.

**No "X, and X is the interesting part."** Do not tell the reader which fact
deserves their attention. Put the important thing first and let it stand.

> Bad: Border sits at step 9, and that is the interesting part.
> Good: Border sits at step 9. At dark layer 2, step 8 measures 2.99:1.

**No verbal convolutions.** One clause per idea. If a sentence needs a dash to
hold a second thought, it is two sentences.

**No throat-clearing.** Cut "it is worth noting", "importantly", "the key
insight is", "what this means is". Start with the fact.

**No self-congratulation and no drama.** The system is not elegant, clever, or
hard-won. It has behavior and constraints.

## Numbers

Give the measurement, not the adjective. "Step 8 measures 2.99:1 at dark layer
2" beats "step 8 is too close at depth."

State the unit and the condition. A ratio needs the pair it was measured
against. A lightness needs the scheme.

## Structure

Lead with what the thing does. Follow with how to use it. Constraints last.

Tables beat paragraphs for anything with more than two variables.

Code blocks show real, copyable code from this repo.

## When history earns its place

Keep a past fact when it stops someone reversing a decision or repeating a
failure that is not obvious from the code.

The `var()` same-element resolution rule in `color.md` is the example. It broke
the elevation system twice. Keep the rule and the reason. Drop the account of
how it was discovered.

Everything else goes in `.agent/records/` and gets linked, not inlined.

## American English

Color, not colour, in prose, comments, and commit messages. Do not mass-rename
existing British spellings; fix them when the line is edited anyway.
