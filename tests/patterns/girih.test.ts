import { describe, it, expect } from 'vitest';
import { girih } from '../../src/patterns/girih';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(girih, { maxElements: 3 });

describe('girih specifics', () => {
  it('contact angle changes the geometry', () => {
    const base = defaultParams(girih);
    expect(render(girih, { ...base, contactAngle: 30 }, 1)).not.toBe(
      render(girih, { ...base, contactAngle: 72 }, 1),
    );
  });

  it('render mode 1 (ribbons) draws two passes: thick ink then thin paper carving a channel', () => {
    const base = defaultParams(girih);
    const svg = render(girih, { ...base, render: 1, ribbonWidth: 10 }, 1);
    const paths = svg.match(/<path[^>]*>/g) ?? [];
    expect(paths.length).toBe(2);
    expect(paths[0]).toContain('stroke="#000000"');
    expect(paths[0]).toContain('stroke-width="10"');
    expect(paths[1]).toContain('stroke="#ffffff"');
    expect(paths[1]).toContain('stroke-width="4.5"');
  });

  it('render mode 0 output is unaffected by the render/ribbonWidth params existing', () => {
    const base = defaultParams(girih);
    const svg = render(girih, { ...base, render: 0 }, 1);
    const paths = svg.match(/<path[^>]*>/g) ?? [];
    expect(paths.length).toBe(1);
  });
});
