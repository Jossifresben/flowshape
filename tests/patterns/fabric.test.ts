import { describe, it, expect } from 'vitest';
import { fabric } from '../../src/patterns/fabric';
import { standardPatternTests, render } from './harness';
import { defaultParams } from '../../src/patterns/registry';

standardPatternTests(fabric, { maxElements: 9000 });

describe('fabric specifics', () => {
  const base = defaultParams(fabric);
  const gridSize = base['gridSize']!;

  it('dots mode emits gridSize^2 circles', () => {
    const svg = render(fabric, { ...base, mode: 0 }, 1);
    const circles = (svg.match(/<circle/g) ?? []).length;
    expect(circles).toBe(gridSize * gridSize);
  });

  it('mesh mode emits 2*gridSize paths and no circles', () => {
    const svg = render(fabric, { ...base, mode: 1 }, 1);
    const paths = (svg.match(/<path/g) ?? []).length;
    const circles = (svg.match(/<circle/g) ?? []).length;
    expect(paths).toBe(2 * gridSize);
    expect(circles).toBe(0);
  });
});
