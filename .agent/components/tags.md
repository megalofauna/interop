# Tags — Mental Model Card

Tags are values the user can remove: applied filters, or the entries of a tag
input. Research: [prompts/CHIPS-REVIEW.md](../../prompts/CHIPS-REVIEW.md).

A tag that cannot be removed is a badge (`<span interop-badge>`). A chip you
select is a checkbox or a radio: the `chips` template in
[control.md](control.md). An action chip is `button[interop-button]`.

## Files

```
projects/interop/tags/
  interop-tags.structure.css   the list, the pill, the remove button; names list at the top
  interop-tags.base.css        token values and size steps
  tags.ts                      InteropTags, InteropTagInput directives
  public-api.ts
projects/interop/src/bind-tags.ts   bindTags(), bindTagInput(), framework-free
```

The demo page is `projects/demo/src/app/components/tags/`.

## Markup

```html
<label for="tag-entry">Skills</label>
<ul interop-tags role="list" aria-label="Skills">
  <li>
    Angular
    <button type="button"><span itx-visually-hidden>Remove Angular</span><svg interop-icon name="tabler-x"></svg></button>
    <input type="hidden" name="skills" value="Angular">
  </li>
</ul>
<input id="tag-entry" type="text" list="skill-options" aria-describedby="tag-hint">
<p id="tag-hint">Press Enter to add a skill.</p>
<p role="status" itx-visually-hidden></p>
```

| Part | Rule |
|---|---|
| List | `ul[interop-tags]` with `role="list"`: Safari drops a list's semantics when its markers are removed |
| Tag | An `li`: its text, a `<button type="button">`, and a hidden input when the value submits with a form |
| Remove button | Named for its tag: "Remove Angular". A generic "Remove" is the same for every tag. At least 24px square |
| Order | The tags come before the input. Tested this way round, people found and removed tags most reliably (98% success, Higley) |
| Keyboard | Every remove button is a tab stop. No arrow keys, no Delete or Backspace on a tag |
| Suggestions | `<datalist>` on the input. A combobox is a separate component |

## Behavior

`bindTags(list, { fallback, status, removed })`:

- The consumer removes the tag. When the removed tag held focus, focus moves to
  the remove button now at its place, else the one before, else `fallback`
  (given `tabindex="-1"` if it needs one). Without this, focus falls to the page.
- With `status`, a `role="status"` element, each removal is announced:
  "Angular removed", or `removed(text)` for translations. Opt-in.

`bindTagInput(input, { list, required, tags })`:

- Enter with text fires `interop-tags-add` on the input, detail `{ value }`, and
  stops the form submitting. The consumer adds the tag. `preventDefault()` on the
  event rejects the value, e.g. a duplicate, and keeps it in the field.
- Enter during IME composition is left alone. Commas do not add a tag: they are
  unreliable on Android keyboards and can be part of a value.
- Backspace in the empty field moves focus to the last remove button. It
  deletes nothing.
- With `required`, a message, the field is invalid while the list is empty.
- It calls `bindTags()` on the list with the input as `fallback`, unless `tags`
  is `false`.

Both only listen and set attributes, focus and the status text. The consumer
renders every tag, so they work with Angular's `@for`.

In Angular, `InteropTags` on `ul[interop-tags]` (inputs `fallback`, `status`,
`removed`) binds the list, and `InteropTagInput` on `input[interop-tag-input]`
(inputs `tags`, `tagsRequired`) binds the field with `tags: false`, so the list
is bound once. The inputs are not named `list` and `required`: those are the
input element's own attributes, and `list` names its datalist.

Tested in Chrome: focus after removal, the announcement, the heading fallback,
adding, rejecting a duplicate, Backspace, the required message, and submitting
the hidden inputs.

## Look

| Size | Pill height | Remove button | Text |
|---|---|---|---|
| `sm` | 24px | 24px | `caption` |
| default | 32px | 24px | `p-sm` |
| `lg` | 40px | 32px | `p` |

| Token | Default |
|---|---|
| `--itx-tags-gap` | `--itx-space-2` |
| `--itx-tags-tag-min-block-size`, `-tag-padding-inline`, `-tag-column-gap` | `--itx-space-8`, `--itx-space-3`, `--itx-space-1` |
| `--itx-tags-tag-font-size`, `-tag-line-height` | the `p-sm` role |
| `--itx-tags-tag-color`, `-tag-background-color` | neutral-900/50, neutral-100/800 |
| `--itx-tags-tag-border-width`, `-tag-border-color`, `-tag-border-radius` | 1px, neutral-300/700, full |
| `--itx-tags-button-size`, `-button-inset`, `-button-border-radius` | `--itx-space-6`, `--itx-space-1`, full |
| `--itx-tags-button-background-color-hover` | neutral-300/600 |
| `--itx-tags-button-cursor[-disabled]`, `-button-opacity-disabled` | default, not-allowed, 0.5 |

## Dev audit rules

| Rule | Flags |
|---|---|
| `tags-remove-name` | A remove button whose name does not include its tag's text |
| `tags-list-role` | A tag list without `role="list"` |

## Not built

Listbox, grid or toolbar roles; arrow keys between tags; Delete or Backspace on
a tag; editable tags; tags inside the text field; a form value accessor; a
combobox; splitting pasted text.
