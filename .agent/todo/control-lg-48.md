# Control heights — check whether `lg` should be 48px instead of 56px

**Raised:** 2026-11-04, from the table lab (`/labs/table`).

The table prefers 48px over 56px as its spacious row at 16px text. Its row
heights are 32, 40 and 48px at 16px text, and 28, 36 and 44px at 14px text, so
the small size is 4px shorter at every density.

The playbook sets every control's `lg` step to 56px (decided 2026-10-14), so
controls line up in a row at 32, 40 and 56. A 48px table row does not line up
with an `lg` control.

## To look into

Whether the components below can use 48px, so the table and controls share one
ladder.

| Component | Token at 56px |
|---|---|
| Button | `--itx-button-min-block-size` |
| Field and select | `--itx-field-min-block-size` |
| Tabs | `--itx-tabs-tab-min-block-size` |
| Segmented look | `--itx-segmented-block-size` |
| Checkbox | `--itx-checkbox-min-block-size` |
| Radio group | `--itx-radio-group-label-min-block-size` |
| Switch | `--itx-switch-min-block-size` |

The progress ring is also 56px at `lg`, but it is an indicator, so it is outside
this question.

Changing the step also changes the playbook's size rule, and any spec or demo
that states 56px.
