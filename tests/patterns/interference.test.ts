import { describe, it, expect } from 'vitest';
import { interference } from '../../src/patterns/interference';
import { standardPatternTests, render, SIZE } from './harness';
import { defaultParams, generateSafe } from '../../src/patterns/registry';

standardPatternTests(interference, { maxElements: 145 });

/** All [x, y] vertex pairs of one rendered line's path, in row order
 *  top-to-bottom (paths are emitted in that order by `generate`). */
function linePoints(params: Record<string, number>, seed: number): [number, number][][] {
  const node = generateSafe(interference, params, seed, SIZE);
  const ds = node.children.filter((c) => c.tag === 'path').map((c) => String(c.attrs['d'] ?? ''));
  return ds.map((d) => [...d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])] as [number, number]));
}

/** True if any pair of vertically-adjacent lines actually crosses — the
 *  sign of (yA − yB) flips somewhere along the sampled x's, which is a
 *  literal geometric crossing, not just "gets close". */
function hasCrossing(lines: [number, number][][]): boolean {
  for (let i = 0; i < lines.length - 1; i++) {
    const a = lines[i]!, b = lines[i + 1]!;
    let sign: number | null = null;
    for (let s = 0; s < a.length; s++) {
      const diff = a[s]![1] - b[s]![1];
      if (diff === 0) continue;
      const cur = Math.sign(diff);
      if (sign !== null && cur !== sign) return true;
      sign = cur;
    }
  }
  return false;
}

describe('interference specifics', () => {
  it('emits exactly `lines` paths', () => {
    const p = defaultParams(interference);
    const svg = render(interference, p, 1);
    const paths = svg.match(/<path[^>]*>/g) ?? [];
    expect(paths).toHaveLength(p['lines']!);
  });

  it('the dramatic-register default is not clamped below the crossing threshold', () => {
    // The whole spec point: at defaults, displacement must be large enough
    // that neighbouring lines actually cross (the braided-caustic look),
    // not just neat parallel waves that never touch.
    const lines = linePoints(defaultParams(interference), 1);
    expect(hasCrossing(lines)).toBe(true);
  });

  it('loop closes byte-identical at phase 1 (phase 1 ≡ phase 0, bit for bit)', () => {
    const base = defaultParams(interference);
    const a = render(interference, { ...base, phase: 0 }, 3);
    const b = render(interference, { ...base, phase: 1 }, 3);
    expect(a).toBe(b);
  });

  it('degeneracy corner: minimum separation still keeps sources distinct, not concentric rings', () => {
    const sepMin = interference.params.find((pd) => pd.key === 'separation')!.min;
    expect(sepMin).toBeGreaterThan(0); // the structural floor itself
    const p = { ...defaultParams(interference), separation: sepMin };
    const svg = render(interference, p, 1);
    expect(svg).not.toContain('NaN');
    expect(svg).not.toContain('Infinity');
    // Still a genuine two-source fringe field, not degenerated into a
    // uniform look: separation must still visibly change the render.
    const atMax = render(interference, { ...defaultParams(interference), separation: interference.params.find((pd) => pd.key === 'separation')!.max }, 1);
    expect(svg).not.toBe(atMax);
  });

  it('degeneracy corner: maximum amplitude renders cleanly and crosses hard', () => {
    const ampMax = interference.params.find((pd) => pd.key === 'amplitude')!.max;
    const p = { ...defaultParams(interference), amplitude: ampMax };
    const svg = render(interference, p, 1);
    expect(svg).not.toContain('NaN');
    expect(svg).not.toContain('Infinity');
    expect(hasCrossing(linePoints(p, 1))).toBe(true);
  });

  it('the calm register (few lines, low amplitude, same off-canvas geometry) is reachable without special-casing', () => {
    // Same defaults (separation/frequency), just lines and amplitude
    // dropped — the off-canvas source placement alone is what keeps this
    // from ever reading as a bullseye, dramatic or calm.
    const p = { ...defaultParams(interference), lines: 40, amplitude: 20 };
    const svg = render(interference, p, 1);
    expect(svg).not.toContain('NaN');
    const paths = svg.match(/<path[^>]*>/g) ?? [];
    expect(paths).toHaveLength(40);
    expect(hasCrossing(linePoints(p, 1))).toBe(false); // calm ≠ dramatic: no crossing here
  });

  it('is deterministic across repeated calls (explicit, beyond the standard invariant)', () => {
    const p = defaultParams(interference);
    expect(render(interference, p, 11)).toBe(render(interference, p, 11));
  });

  it('detune breaks equal-k without breaking 1-periodicity (k2/k1 = 1 + detune)', () => {
    const base = { ...defaultParams(interference), detune: 0 };
    const detuned = { ...defaultParams(interference), detune: 0.3 };
    expect(render(interference, base, 5)).not.toBe(render(interference, detuned, 5));
    // Both must still close the loop byte-identically at phase 1.
    for (const p of [base, detuned]) {
      const a = render(interference, { ...p, phase: 0 }, 5);
      const b = render(interference, { ...p, phase: 1 }, 5);
      expect(a).toBe(b);
    }
  });
});
