#!/usr/bin/env bash
# Branch cleanup — generated 2026-08-21. REVIEW BEFORE RUNNING.
#
# PRECONDITION: itx-62-branch-salvage must be merged to main first. It carries
# the rescued .agent/imports.md, the resize-aspect-ratio probe, the acrylic
# exploration, and the Tailwind/Material button demo. Deleting the source
# branches before that lands would destroy the originals AND the salvage.
#
# NOT deleted, deliberately:
#   ITX-11-aspect-ratio-first-resizable  local only — [aspectRatio] feature +
#                                        two resizable fixes, never reimplemented
#   ITX-7-toast-chi                      local + origin — aero palette and the
#                                        frosted-glass toast viewport, not on main
#   itx-62-branch-salvage                this work
#   main
set -euo pipefail

command -v git >/dev/null
[ "$(git rev-parse --abbrev-ref HEAD)" = "main" ] || { echo "run from main"; exit 1; }
git merge-base --is-ancestor itx-62-branch-salvage main \
  || { echo "itx-62-branch-salvage is not merged into main yet — stop."; exit 1; }

# ── Local: fully merged into main (30) ──
git branch -d ITX-1-kbd-css-playbook-run
git branch -d ITX-2-figtree-ibm-plex-swap
git branch -d ITX-21-chips
git branch -d ITX-3-command-palette
git branch -d ITX-4-nav-panel-exploration
git branch -d ITX-46-miscellany-III
git branch -d ITX-6-migrate-toast
git branch -d claude/affectionate-mccarthy
git branch -d claude/frosty-kapitsa
git branch -d claude/funny-elbakyan
git branch -d itx-1-make-single-chip-item-parent-agnostic
git branch -d itx-34-field-updates
git branch -d itx-46
git branch -d itx-47-color-token-scoping
git branch -d itx-47-sizing
git branch -d itx-48-line-height-updates
git branch -d itx-48-rig-namespace
git branch -d itx-49-line-height
git branch -d itx-50-miscellany-IV
git branch -d itx-51-button-addons
git branch -d itx-52-accent-facts
git branch -d itx-52-dark-lift
git branch -d itx-54-contrast-audit
git branch -d itx-55-computed-elevation
git branch -d itx-56-unspike-main
git branch -d itx-60-shiki
git branch -d itx-61-stop-gap
git branch -d itx-62-keep-list
git branch -d itx-get-off-my-lawn
git branch -d protocol-content-pipeline

# ── Local: unmerged by SHA, verified moot (34) ──
# -D not -d: these never merged by SHA, only by content.
git branch -D ITX-10-link-cards-for-command-palette
git branch -D ITX-12-collapsible-tree
git branch -D ITX-13-demo-and-theme-polish
git branch -D ITX-21-dialog-updates
git branch -D ITX-22-expandable-panel-updates
git branch -D ITX-23-tree-updates
git branch -D ITX-24-material-symbols-iconset
git branch -D ITX-24-various-updates-III
git branch -D ITX-25-button-variants
git branch -D ITX-25-listbox-updates
git branch -D ITX-26-progress-bar-updates
git branch -D ITX-28-various-updates
git branch -D ITX-29-various-updates-II
git branch -D ITX-30(chore)-building-warnings
git branch -D ITX-30-various-updates-II
git branch -D ITX-31-shell-layout-improvements
git branch -D ITX-32-miscellany
git branch -D ITX-33-stepper-updates
git branch -D ITX-40-colorscale-rewrite
git branch -D ITX-41-build-hygeine
git branch -D ITX-41-npm
git branch -D ITX-5-callout-colors
git branch -D ITX-6-migrate-ioast
git branch -D ITX-8-acrylic-panel
git branch -D itx-20-chaos-commit
git branch -D itx-41-globalize-componentry-reads-against-base-rules
git branch -D itx-42-global-attribute-consolidation
git branch -D itx-42-global-focus-styles
git branch -D itx-43-field-migration
git branch -D itx-43-mop-up
git branch -D itx-45-button-review
git branch -D itx-45-global-starter
git branch -D itx-46-kbd
git branch -D itx-9-command-palette-protocol

# ── Remote (47) ──
git push origin --delete ITX-1-kbd-css-playbook-run
git push origin --delete ITX-10-link-cards-for-command-palette
git push origin --delete ITX-12-collapsible-tree
git push origin --delete ITX-21-chips
git push origin --delete ITX-22-expandable-panel-updates
git push origin --delete ITX-24-various-updates-III
git push origin --delete ITX-25-button-variants
git push origin --delete ITX-25-listbox-updates
git push origin --delete ITX-26-progress-bar-updates
git push origin --delete ITX-28-various-updates
git push origin --delete ITX-29-various-updates-II
git push origin --delete ITX-3-command-palette
git push origin --delete ITX-30(chore)-building-warnings
git push origin --delete ITX-30-various-updates-II
git push origin --delete ITX-31-shell-layout-improvements
git push origin --delete ITX-32-miscellany
git push origin --delete ITX-33-stepper-updates
git push origin --delete ITX-40-colorscale-rewrite
git push origin --delete ITX-41-build-hygeine
git push origin --delete ITX-41-npm
git push origin --delete ITX-46-miscellany-III
git push origin --delete ITX-5-callout-colors
git push origin --delete ITX-6-migrate-ioast
git push origin --delete itx-20-chaos-commit
git push origin --delete itx-34-field-updates
git push origin --delete itx-41-globalize-componentry-reads-against-base-rules
git push origin --delete itx-42-global-attribute-consolidation
git push origin --delete itx-42-global-focus-styles
git push origin --delete itx-43-field-migration
git push origin --delete itx-43-mop-up
git push origin --delete itx-45-button-review
git push origin --delete itx-45-global-starter
git push origin --delete itx-46
git push origin --delete itx-46-kbd
git push origin --delete itx-47-color-token-scoping
git push origin --delete itx-47-sizing
git push origin --delete itx-48-rig-namespace
git push origin --delete itx-49-line-height
git push origin --delete itx-50-miscellany-IV
git push origin --delete itx-51-button-addons
git push origin --delete itx-52-accent-facts
git push origin --delete itx-52-dark-lift
git push origin --delete itx-54-contrast-audit
git push origin --delete itx-56-unspike-main
git push origin --delete itx-60-shiki
git push origin --delete itx-61-stop-gap
git push origin --delete itx-get-off-my-lawn
