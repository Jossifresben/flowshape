import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import '../../src/patterns/index';
import { listPatterns } from '../../src/patterns/registry';
import { parseFrontMatter } from '../../src/content/explain';

const DIR = path.join(process.cwd(), 'src', 'content', 'explain');
const present = new Set(readdirSync(DIR));

describe('explain content', () => {
  // TODO(Task 9): un-skip once every pattern has both an .en.md and an .es.md file.
  // Only phyllotaxis (the worked example) exists so far; this fails for the other 20 by design.
  it.skip('every pattern has an English and a Spanish explanation', () => {
    const missing: string[] = [];
    for (const def of listPatterns()) {
      for (const lang of ['en', 'es']) {
        if (!present.has(`${def.id}.${lang}.md`)) missing.push(`${def.id}.${lang}.md`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('every file has a cited source and the required sections', () => {
    for (const file of [...present].filter((f) => f.endsWith('.md'))) {
      const doc = parseFrontMatter(readFileSync(path.join(DIR, file), 'utf-8'));
      expect(doc.source.length, `${file} source`).toBeGreaterThan(3);
      expect(doc.url, `${file} url`).toMatch(/^https?:\/\//);
      expect(doc.body, `${file} formula`).toContain('## Formula');
      expect(doc.body, `${file} meaning`).toMatch(/## (What it means|Qué significa)/);
      expect(doc.body.length, `${file} body`).toBeGreaterThan(200);
    }
  });
});
