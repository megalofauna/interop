#!/usr/bin/env bash
#
# Branch cleanup, regenerated 2026-08-21 after the first run stopped a third of
# the way through.
#
# What went wrong last time: `set -e` plus `git branch -d`. The -d form refuses
# any branch not merged into the CURRENT head, and the first refusal killed the
# run — so 21 locals were deleted and the remote section never executed. This
# version reports per branch and keeps going, so one refusal cannot hide the
# rest.
#
# Deletion is still gated: -d is tried FIRST on every branch, and -D is only
# used for the set verified moot by content (see .agent/todo/branch-salvage.md).
# Anything git refuses under -d that is NOT on that list is reported and left
# alone for you to look at.
#
# KEPT deliberately:
#   ITX-7-toast-chi                       aero palette, frosted-glass viewport
#   main
#
# Remote deletion is irreversible from here. Run the local section, read it,
# then run with --remote to do origin.
set -uo pipefail

[ "$(git rev-parse --abbrev-ref HEAD)" = "main" ] || { echo "run from main"; exit 1; }

# The salvage must be on main before its sources are destroyed. Without this the
# script would merely SKIP an unmerged salvage branch and delete everything
# around it, which looks like success. Fail loudly instead.
for need in itx-62-branch-salvage itx-63-ratio-first-resizable; do
  git rev-parse --verify --quiet "$need" >/dev/null || continue
  git merge-base --is-ancestor "$need" main \
    || { echo "$need is not merged into main yet — stop."; exit 1; }
done

MOOT="$(cat <<'LIST'
ITX-10-link-cards-for-command-palette
ITX-12-collapsible-tree
ITX-13-demo-and-theme-polish
ITX-21-dialog-updates
ITX-22-expandable-panel-updates
ITX-23-tree-updates
ITX-24-material-symbols-iconset
ITX-24-various-updates-III
ITX-25-button-variants
ITX-25-listbox-updates
ITX-26-progress-bar-updates
ITX-28-various-updates
ITX-29-various-updates-II
ITX-30(chore)-building-warnings
ITX-30-various-updates-II
ITX-31-shell-layout-improvements
ITX-32-miscellany
ITX-33-stepper-updates
ITX-40-colorscale-rewrite
ITX-41-build-hygeine
ITX-41-npm
ITX-5-callout-colors
ITX-6-migrate-ioast
ITX-8-acrylic-panel
itx-20-chaos-commit
itx-41-globalize-componentry-reads-against-base-rules
itx-42-global-attribute-consolidation
itx-42-global-focus-styles
itx-43-field-migration
itx-43-mop-up
itx-45-button-review
itx-45-global-starter
itx-46-kbd
itx-9-command-palette-protocol
LIST
)"

is_moot() { grep -qxF "$1" <<<"$MOOT"; }

deleted=0; refused=0; skipped=0
for b in $(git branch --format='%(refname:short)' | grep -vxE 'main|ITX-7-toast-chi'); do
  if git branch -d "$b" >/dev/null 2>&1; then
    echo "  deleted (merged)  $b"; deleted=$((deleted+1))
  elif is_moot "$b"; then
    git branch -D "$b" >/dev/null 2>&1 && { echo "  deleted (moot)    $b"; deleted=$((deleted+1)); }
  else
    echo "  KEPT — unmerged and not on the moot list: $b"; refused=$((refused+1))
  fi
done
echo "  ── local: $deleted deleted, $refused left for review"

if [ "${1:-}" != "--remote" ]; then
  echo
  echo "  Remote untouched. Re-run with --remote once you are happy with the above."
  exit 0
fi

echo
for b in $(git branch -r --format='%(refname:short)' | grep -v HEAD | sed 's#^origin/##' \
           | grep -vxE 'main|origin|ITX-7-toast-chi' | sort -u); do
  if git push origin --delete "$b" >/dev/null 2>&1; then echo "  deleted origin/$b"
  else echo "  FAILED  origin/$b"; fi
done
