import { describe, it, expect } from 'vitest';
import '../../src/patterns/index';
import { shareTargetFor } from '../../src/ui/share';

const ORIGIN = 'https://flowshape.art/';

describe('shareTargetFor', () => {
  it('shares a design under its own name', () => {
    const href = `${ORIGIN}#/p/timestable?v=1&seed=71203`;
    expect(shareTargetFor(href, 'en')).toEqual({ title: 'Times-Table Chords · 71203', url: href });
  });

  it('shares an animation and a poster the same way', () => {
    expect(shareTargetFor(`${ORIGIN}#/a/timestable?v=1&seed=7`, 'en').title).toBe('Times-Table Chords · 7');
    expect(shareTargetFor(`${ORIGIN}#/c/timestable?v=1&seed=7`, 'en').title).toBe('Times-Table Chords · 7');
  });

  it('shares the site from the gallery, the about page and the saved page', () => {
    for (const route of ['', '#/', '#/about', '#/saved']) {
      expect(shareTargetFor(ORIGIN + route, 'en').title).toBe('flowshape.art');
    }
  });

  it('shares the exact URL it was given, fragment and all', () => {
    const href = `${ORIGIN}#/p/timestable?v=1&seed=71203&hue=30&lang=es`;
    expect(shareTargetFor(href, 'es').url).toBe(href);
  });

  it('translates a creation title', () => {
    const href = `${ORIGIN}#/p/timestable?v=1&seed=7`;
    expect(shareTargetFor(href, 'es').title).not.toBe(shareTargetFor(href, 'en').title);
  });
});
