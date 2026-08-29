/**
 * Sets the release version in the three files that carry it, so cutting a tag
 * is one command instead of three hand-edits that drift apart.
 *
 *   node scripts/set-version.mjs 1.2.0
 *
 * `.zenodo.json` is deliberately the only place the deposit metadata lives —
 * Zenodo reads it from the repository on each GitHub release — and its prose is
 * kept free of version numbers so it never needs editing here. Only the
 * `version` field changes.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(version ?? '')) {
  console.error('usage: node scripts/set-version.mjs <major.minor.patch>');
  process.exit(1);
}
const today = new Date().toISOString().slice(0, 10);

/** Replace exactly one occurrence, and fail loudly if the anchor moved.
 *  Tests the pattern rather than comparing before/after: re-running with the
 *  version already set is a no-op, not a missing anchor. */
function edit(file, pattern, replacement) {
  const before = readFileSync(file, 'utf-8');
  if (!pattern.test(before)) {
    console.error(`${file}: no match for ${pattern} — the file's shape changed, fix this script`);
    process.exit(1);
  }
  writeFileSync(file, before.replace(pattern, replacement));
  console.log(`  ${file}`);
}

console.log(`setting version ${version} (released ${today})`);
edit('package.json', /"version": "\d+\.\d+\.\d+"/, `"version": "${version}"`);
edit('CITATION.cff', /version: "\d+\.\d+\.\d+"/, `version: "${version}"`);
edit('CITATION.cff', /date-released: "\d{4}-\d{2}-\d{2}"/, `date-released: "${today}"`);
edit('.zenodo.json', /"version": "\d+\.\d+\.\d+"/, `"version": "${version}"`);

// A malformed .zenodo.json is rejected by Zenodo at release time, long after
// the mistake — so it is parsed here, while the fix is still cheap.
JSON.parse(readFileSync('.zenodo.json', 'utf-8'));
console.log('\nnext: commit, then tag v' + version);
