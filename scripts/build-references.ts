/**
 * Build-time citation extraction.
 *
 * Lifts the `source`/`url`/`construction` front matter out of every
 * `src/content/explain/<id>.en.md` into a small generated module, so the About
 * page's reference list can name all thirty sources without pulling thirty
 * long-form teaching documents into its bundle — those stay lazily loaded, one
 * at a time, by the pattern that needs them.
 *
 * Generated from the explainers rather than maintained by hand, so a citation
 * can never disagree with the one shown inside the pattern itself, and the
 * `construction: original` marker can never appear on the About page for a
 * pattern whose own explanation does not carry it.
 *
 * The output is committed, so `npm run dev` works without a prior build. The
 * rendering itself lives in `render-references.ts`; this file is only the
 * writer, which is what lets the test suite check the committed file against a
 * fresh render without a side effect on import.
 *
 * Run with: npm run refs
 */
import { renderReferencesModule, REFERENCES_FILE } from './render-references';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const out = renderReferencesModule();
writeFileSync(REFERENCES_FILE, out, 'utf-8');
const count = (out.match(/^ {2}"/gm) ?? []).length;
// eslint-disable-next-line no-console
console.log(`wrote ${count} references to ${path.relative(process.cwd(), REFERENCES_FILE)}`);
