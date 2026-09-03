import { describe, expect, it } from 'vitest';
import { videoIdFromHash } from '../../src/ui/video';
import { SHOWCASE_VIDEOS } from '../../src/content/showcase';

/** `#/video/<id>` is the link people share, so the shapes it must and must not
 *  match are a contract, not an implementation detail. */
describe('videoIdFromHash', () => {
  it('reads the id from a video hash', () => {
    expect(videoIdFromHash('#/video/pozas')).toBe('pozas');
    expect(videoIdFromHash('#/video/harmonograph-wide')).toBe('harmonograph-wide');
  });

  it('decodes percent-escapes', () => {
    expect(videoIdFromHash('#/video/a%2Db')).toBe('a-b');
  });

  it('ignores a trailing query or path segment', () => {
    expect(videoIdFromHash('#/video/pozas?lang=es')).toBe('pozas');
    expect(videoIdFromHash('#/video/pozas/extra')).toBe('pozas');
  });

  it('does not match other routes', () => {
    for (const hash of ['#/gallery/videos', '#/video/', '#/video', '#/', '#/p/mystery', '']) {
      expect(videoIdFromHash(hash), `should not match: ${hash}`).toBeNull();
    }
  });

  it('resolves every curated video', () => {
    for (const entry of SHOWCASE_VIDEOS) {
      const id = videoIdFromHash(`#/video/${entry.id}`);
      expect(SHOWCASE_VIDEOS.find((v) => v.id === id)).toBe(entry);
    }
  });
});
