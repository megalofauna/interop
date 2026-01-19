#!/usr/bin/env node
/**
 * Codemod: Rewrite CSS custom properties to use the --ntr-* prefix.
 *
 * What it does:
 * - Rewrites definitions like `--foo-bar: ...;` to `--ntr-bar: ...;` if prefix !== 'ntr'
 * - Rewrites usages like `var(--foo-bar)` to `var(--ntr-bar)` if prefix !== 'ntr'
 *
 * Notes:
 * - Keeps the suffix (the part after the first dash) intact, only normalizes the library prefix.
 * - Processes .css and .scss files by default.
 * - Supports dry-run and backup modes.
 *
 * Usage:
 *   node interop/tools/codemods/rename-css-vars.js
 *   node interop/tools/codemods/rename-css-vars.js --paths src lib projects
 *   node interop/tools/codemods/rename-css-vars.js --dry-run
 *   node interop/tools/codemods/rename-css-vars.js --backup
 *
 * Options:
 *   --paths <dir...>   Space-separated directories to scan (default: ["src", "lib", "projects"])
 *   --dry-run          Print planned changes without writing files
 *   --backup           Write a .bak copy before modifying a file
 *
 * Limitations:
 * - Only rewrites variables that follow the pattern `--<prefix>-<suffix>`.
 * - Leaves `--ntr-*` variables unchanged.
 * - Does not attempt semantic mapping; it purely normalizes the prefix to `ntr`.
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_DIRS = ['src', 'lib', 'projects'];
const VALID_EXTS = new Set(['.css', '.scss']);
const EXCLUDE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.cache'
]);

const args = process.argv.slice(2);
const opts = parseArgs(args);

main().catch((err) => {
  console.error('[rename-css-vars] Fatal error:', err);
  process.exit(1);
});

async function main() {
  const roots = opts.paths.length ? opts.paths : DEFAULT_DIRS;
  const existingRoots = roots
    .map((p) => path.resolve(process.cwd(), p))
    .filter((p) => fs.existsSync(p) && fs.statSync(p).isDirectory());

  if (existingRoots.length === 0) {
    console.error('[rename-css-vars] No valid directories found to process.');
    console.error('Checked:', roots.join(', '));
    process.exit(2);
  }

  const files = [];
  for (const root of existingRoots) {
    walk(root, (filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (VALID_EXTS.has(ext)) {
        files.push(filePath);
      }
    });
  }

  if (files.length === 0) {
    console.log('[rename-css-vars] No CSS/SCSS files found.');
    return;
  }

  let changedFiles = 0;
  let totalChanges = 0;

  for (const file of files) {
    const original = fs.readFileSync(file, 'utf8');
    const { updated, count } = rewriteCssCustomProperties(original);

    if (count > 0) {
      changedFiles += 1;
      totalChanges += count;

      if (opts.dryRun) {
        console.log(`\n[DRY RUN] ${path.relative(process.cwd(), file)}: ${count} change(s)`);
        printDiff(original, updated);
      } else {
        if (opts.backup) {
          const backupPath = `${file}.bak`;
          fs.writeFileSync(backupPath, original, 'utf8');
        }
        fs.writeFileSync(file, updated, 'utf8');
        console.log(`${path.relative(process.cwd(), file)}: ${count} change(s)`);
      }
    }
  }

  console.log(`\n[rename-css-vars] Completed. Files changed: ${changedFiles}. Total changes: ${totalChanges}.`);
}

/**
 * Parse CLI args into options.
 */
function parseArgs(argv) {
  const opts = {
    paths: [],
    dryRun: false,
    backup: false,
  };

  let i = 0;
  while (i < argv.length) {
    const token = argv[i];
    if (token === '--paths') {
      i++;
      // Collect subsequent non-flag tokens as paths
      while (i < argv.length && !argv[i].startsWith('--')) {
        opts.paths.push(argv[i]);
        i++;
      }
      continue;
    }
    if (token === '--dry-run') {
      opts.dryRun = true;
      i++;
      continue;
    }
    if (token === '--backup') {
      opts.backup = true;
      i++;
      continue;
    }
    // Unknown token; skip
    i++;
  }
  return opts;
}

/**
 * Recursively walk a directory, invoking cb(filePath) for each file.
 */
function walk(dir, cb) {
  const entries = safeReadDir(dir);
  for (const entry of entries) {
    const full = path.join(dir, entry);
    let stat;
    try {
      stat = fs.statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      const base = path.basename(full);
      if (EXCLUDE_DIRS.has(base)) continue;
      walk(full, cb);
    } else if (stat.isFile()) {
      cb(full);
    }
  }
}

function safeReadDir(dir) {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

/**
 * Rewrite CSS custom properties and var() usages to the --ntr-* prefix.
 *
 * Strategy:
 * - Definitions:
 *   Match lines with `--<prefix>-<suffix>:` where prefix != 'ntr'
 *   Replace with `--ntr-<suffix>:`
 *
 * - Usages:
 *   Match `var(--<prefix>-<suffix>...)` where prefix != 'ntr'
 *   Replace with `var(--ntr-<suffix>...)`
 *
 * Returns updated content and change count.
 */
function rewriteCssCustomProperties(content) {
  let count = 0;
  let updated = content;

  // Definition rewriting:
  // Matches: start of line (optional spaces), then --<prefix>-<suffix>:, where prefix != ntr
  // Use a negative lookahead to avoid matching ntr- prefixed properties.
  const defRegex = /(^\s*--(?!ntr-)([a-z0-9]+)-([a-z0-9-]+)\s*:)/gim;
  updated = updated.replace(defRegex, (m, full, prefix, suffix) => {
    count++;
    const replacement = full.replace(`--${prefix}-${suffix}`, `--ntr-${suffix}`);
    return replacement;
  });

  // Usage rewriting:
  // Matches: var(--<prefix>-<suffix>[,|)]...), where prefix != ntr
  // We preserve any fallback `, value)` or closing `)`
  const useRegex = /var\(\s*--(?!ntr-)([a-z0-9]+)-([a-z0-9-]+)\s*([,)])/gim;
  updated = updated.replace(useRegex, (m, prefix, suffix, tail) => {
    count++;
    return `var(--ntr-${suffix}${tail}`;
  });

  return { updated, count };
}

/**
 * Print a minimal diff between original and updated strings.
 * This is a line-wise display showing only changed lines.
 */
function printDiff(original, updated) {
  const origLines = original.split(/\r?\n/);
  const updLines = updated.split(/\r?\n/);

  const maxLen = Math.max(origLines.length, updLines.length);
  for (let i = 0; i < maxLen; i++) {
    const o = origLines[i] ?? '';
    const u = updLines[i] ?? '';
    if (o !== u) {
      const lineNo = String(i + 1).padStart(4, ' ');
      console.log(`${lineNo} - ${o}`);
      console.log(`${lineNo} + ${u}`);
    }
  }
}
