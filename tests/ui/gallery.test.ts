import { describe, it, expect } from 'vitest';
import '../../src/patterns/index';
import { listPatterns } from '../../src/patterns/registry';
import { NAMES, FAMILY_LABELS } from '../../src/ui/gallery';
import { THUMBS } from '../../src/generated/thumbs';

// These assertions are pure (no DOM needed) but exist specifically so that
// registering a 14th pattern without updating gallery.ts or re-running the
// thumbs build fails CI instead of silently shipping a nameless/thumbless card.

describe('gallery static data', () => {
  it('has a non-empty SVG thumbnail for every registered pattern', () => {
    for (const def of listPatterns()) {
      const svg = THUMBS[def.id];
      expect(svg, `missing THUMBS entry for '${def.id}'`).toBeTruthy();
      expect(svg!.startsWith('<svg'), `THUMBS['${def.id}'] does not start with <svg`).toBe(true);
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
