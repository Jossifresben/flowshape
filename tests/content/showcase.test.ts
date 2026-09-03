import { describe, it, expect } from 'vitest';
import { statSync } from 'node:fs';
import path from 'node:path';
import '../../src/patterns/index';
import { decodeState } from '../../src/core/url-state';
import { getPattern } from '../../src/patterns/registry';
import { kindOf } from '../../src/core/saved';
import { SHOWCASE, SHOWCASE_POSTERS, SHOWCASE_VIDEOS } from '../../src/content/showcase';

// `SHOWCASE` (and its poster/video siblings) are hand-written URLs and file
// paths pasted from an address bar or a file system — exactly where a typo
// enters. These assertions exist so a broken entry fails CI rather than
// rendering "Unavailable pattern" or a 404 on the site's shopfront.

const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');

/** A path this test checks against disk must be rooted under `public/`, the
 *  way `renderThumb`/the browser resolves a site-absolute path — never an
 *  arbitrary filesystem path a bad entry could smuggle in. */
function existsUnderPublic(sitePath: string): boolean {
  if (!sitePath.startsWith('/')) return false;
  const stat = statSync(path.join(PUBLIC_DIR, sitePath), { throwIfNoEntry: false });
  return !!stat && stat.isFile() && stat.size > 0;
}

describe('curated showcase', () => {
  it('is non-empty', () => {
    expect(SHOWCASE.length).toBeGreaterThan(0);
  });

  it('decodes every entry', () => {
    for (const entry of SHOWCASE) {
      expect(decodeState(entry.hash), `does not decode: ${entry.hash}`).not.toBeNull();
    }
  });

  it('is a design (#/p/) for every entry, never an animation or poster', () => {
    for (const entry of SHOWCASE) {
      expect(kindOf(entry.hash), `not a design: ${entry.hash}`).toBe('p');
    }
  });

  it('names a registered pattern for every entry', () => {
    for (const entry of SHOWCASE) {
      const state = decodeState(entry.hash);
      const patternId = state?.patternId;
      expect(getPattern(patternId ?? ''), `unregistered pattern '${patternId}' in ${entry.hash}`).toBeDefined();
    }
  });

  it('has no duplicate hashes', () => {
    const hashes = SHOWCASE.map((e) => e.hash);
    expect(new Set(hashes).size).toBe(hashes.length);
  });
});

describe('curated posters', () => {
  // May legitimately be empty — Jossi ships the tab machinery ahead of the
  // content, so these must pass on [] rather than asserting non-emptiness.

  it('decodes every entry', () => {
    for (const entry of SHOWCASE_POSTERS) {
      expect(decodeState(entry.hash), `does not decode: ${entry.hash}`).not.toBeNull();
    }
  });

  it('is a poster (#/c/) for every entry', () => {
    for (const entry of SHOWCASE_POSTERS) {
      expect(kindOf(entry.hash), `not a poster: ${entry.hash}`).toBe('c');
    }
  });

  it('names a registered pattern for every entry', () => {
    for (const entry of SHOWCASE_POSTERS) {
      const state = decodeState(entry.hash);
      const patternId = state?.patternId;
      expect(getPattern(patternId ?? ''), `unregistered pattern '${patternId}' in ${entry.hash}`).toBeDefined();
    }
  });

  it('has no duplicate hashes', () => {
    const hashes = SHOWCASE_POSTERS.map((e) => e.hash);
    expect(new Set(hashes).size).toBe(hashes.length);
  });
});

describe('curated videos', () => {
  // Also may legitimately be empty, same reasoning as posters above.

  // A video may be hosted remotely — the files are ~180 MB at full resolution
  // and live in Cloudflare R2 rather than in this repository. Poster frames
  // stay local: they are small and needed on first paint.
  const isRemote = (src: string): boolean => src.startsWith('https://');

  it('has a src that is either local under /showcase/ or an https URL', () => {
    for (const entry of SHOWCASE_VIDEOS) {
      expect(
        isRemote(entry.src) || entry.src.startsWith('/showcase/'),
        `src is neither https nor under /showcase/: ${entry.src}`,
      ).toBe(true);
    }
  });

  // `id` is what a shared `#/gallery/videos?v=` link carries, so a duplicate
  // would make one video unreachable and a renamed one would break links
  // already in the wild.
  it('has a unique, URL-safe id', () => {
    const seen = new Set<string>();
    for (const entry of SHOWCASE_VIDEOS) {
      expect(entry.id, 'id is empty').toBeTruthy();
      expect(entry.id, `id is not URL-safe: ${entry.id}`).toMatch(/^[a-z0-9][a-z0-9-]*$/);
      expect(seen.has(entry.id), `duplicate video id: ${entry.id}`).toBe(false);
      seen.add(entry.id);
    }
  });

  it('has a poster served locally', () => {
    for (const entry of SHOWCASE_VIDEOS) {
      expect(entry.poster.startsWith('/showcase/'), `poster not under /showcase/: ${entry.poster}`).toBe(true);
    }
  });

  it('has a src ending .mp4 or .webm', () => {
    for (const entry of SHOWCASE_VIDEOS) {
      expect(
        entry.src.endsWith('.mp4') || entry.src.endsWith('.webm'),
        `src is not .mp4 or .webm: ${entry.src}`,
      ).toBe(true);
    }
  });

  it('decodes hash and is an animation (#/a/) where set', () => {
    for (const entry of SHOWCASE_VIDEOS) {
      if (entry.hash === undefined) continue;
      expect(decodeState(entry.hash), `does not decode: ${entry.hash}`).not.toBeNull();
      expect(kindOf(entry.hash), `not an animation: ${entry.hash}`).toBe('a');
    }
  });

  it('has local files that exist on disk', () => {
    for (const entry of SHOWCASE_VIDEOS) {
      // A remote src cannot be checked here without a network call, which a
      // unit test must not make. Its availability is a deploy-time concern.
      if (!isRemote(entry.src)) {
        expect(existsUnderPublic(entry.src), `missing public${entry.src}`).toBe(true);
      }
      expect(existsUnderPublic(entry.poster), `missing public${entry.poster}`).toBe(true);
    }
  });
});
