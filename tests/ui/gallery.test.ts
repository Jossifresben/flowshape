import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import '../../src/patterns/index';
import { listPatterns } from '../../src/patterns/registry';
import { NAMES, FAMILY_LABELS } from '../../src/ui/gallery';

// These assertions exist specifically so that registering a 14th pattern
// without updating gallery.ts or re-running the thumbs build fails CI
// instead of silently shipping a nameless/thumbless card.

const THUMBS_DIR = path.join(__dirname, '..', '..', 'public', 'thumbs');

describe('gallery static data', () => {
  it('has a non-empty SVG thumbnail file for every registered pattern', () => {
    for (const def of listPatterns()) {
      const thumbPath = path.join(THUMBS_DIR, `${def.id}.svg`);
      const stat = statSync(thumbPath, { throwIfNoEntry: false });
      expect(stat, `missing public/thumbs/${def.id}.svg`).toBeTruthy();
      expect(stat!.size, `public/thumbs/${def.id}.svg is empty`).toBeGreaterThan(0);

      const contents = readFileSync(thumbPath, 'utf-8');
      expect(contents.startsWith('<svg'), `public/thumbs/${def.id}.svg does not start with <svg`).toBe(
        true,
      );
    }
  });

  it('has a display name for every registered pattern', () => {
    for (const def of listPatterns()) {
      expect(NAMES[def.id], `missing NAMES entry for '${def.id}'`).toBeTruthy();
    }
  });

  it('has a family label for every family present in the registry', () => {
    const families = new Set(listPatterns().map((p) => p.family));
    for (const family of families) {
      expect(FAMILY_LABELS[family], `missing FAMILY_LABELS entry for '${family}'`).toBeTruthy();
    }
  });
});
