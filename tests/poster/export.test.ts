// tests/poster/export.test.ts
import { describe, it, expect } from 'vitest';
import { toSvgString, exportFilename, pixelDimensions } from '../../src/poster/export';
import { el } from '../../src/core/svg';

const pal = { paper: '#101010', ink: '#eeeeee', accent: '#ff0000' };
const node = el('svg', { viewBox: '0 0 600 849' }, [el('circle', { cx: 1, cy: 2, r: 3, fill: 'ink' })]);

describe('toSvgString', () => {
  it('carries the viewBox and physical size in mm', () => {
    const out = toSvgString(node, pal, { wmm: 297, hmm: 420 });
    expect(out.startsWith('<svg')).toBe(true);
    expect(out).toContain('viewBox="0 0 600 849"');
    expect(out).toContain('width="297mm"');
    expect(out).toContain('height="420mm"');
    expect(out).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(out).toContain('#eeeeee');
  });

  it('does not double-add attributes it already has', () => {
    const out = toSvgString(node, pal, { wmm: 297, hmm: 420 });
    expect(out.match(/viewBox=/g)!.length).toBe(1);
    expect(out.match(/width=/g)!.length).toBe(1);
  });
});

describe('pixelDimensions', () => {
  it('computes pixels from physical size and dpi, capped on the long edge', () => {
    expect(pixelDimensions({ wmm: 297, hmm: 420 }, 300)).toEqual({ w: 3508, h: 4961 });
    expect(pixelDimensions({ wmm: 297, hmm: 420 }, 150)).toEqual({ w: 1754, h: 2480 });
    const huge = pixelDimensions({ wmm: 610, hmm: 914 }, 1200);
    expect(Math.max(huge.w, huge.h)).toBeLessThanOrEqual(12000);
    expect(huge.w / huge.h).toBeCloseTo(610 / 914, 2);
  });
});

describe('exportFilename', () => {
  it('builds a descriptive name', () => {
    expect(exportFilename('coulomb', 1, 'a3', 'png')).toBe('flowshape-coulomb-1-a3.png');
    expect(exportFilename('voxel', 95500, 'custom', 'svg')).toBe('flowshape-voxel-95500-custom.svg');
  });
});
