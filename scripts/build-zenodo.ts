/**
 * Build-time write of the Zenodo deposit's citation block.
 *
 * Rewrites `.zenodo.json` so its `related_identifiers` carry one `cites` entry
 * per DOI named in the explain front matter, leaving every other field of the
 * deposit untouched. The rendering itself lives in `render-zenodo.ts`; this
 * file is only the writer, which is what lets the test suite check the
 * committed file against a fresh render without a side effect on import.
 *
 * Run with: npm run zenodo
 */
import { renderZenodoJson, citedDois, ZENODO_FILE } from './render-zenodo';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const out = renderZenodoJson();
writeFileSync(ZENODO_FILE, out, 'utf-8');
// eslint-disable-next-line no-console
console.log(
  `wrote ${citedDois().length} cited DOIs to ${path.relative(process.cwd(), ZENODO_FILE)}`,
);
