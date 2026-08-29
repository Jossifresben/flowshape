import { describe, it, expect } from 'vitest';
import '../../src/patterns/index';
import { getPattern, listPatterns } from '../../src/patterns/registry';
import { PRESETS_BY_PATTERN, type AnimPreset } from '../../src/anim/presets';

describe('anim presets', () => {
  it('every registered pattern has at least one preset', () => {
    for (const def of listPatterns()) {
      expect(PRESETS_BY_PATTERN[def.id]?.length, def.id).toBeGreaterThanOrEqual(1);
    }
  });
  it('every preset references only real params with legal shapes', () => {
    for (const [pid, presets] of Object.entries(PRESETS_BY_PATTERN)) {
      const def = getPattern(pid);
      expect(def, pid).toBeDefined();
      for (const pre of presets) {
        expect(pre.label.en.length).toBeGreaterThan(0);
        expect(pre.label.es.length).toBeGreaterThan(0);
        for (const r of pre.routes) {
          const pd = def!.params.find((p) => p.key === r.param);
          expect(pd, `${pid}/${pre.id}: ${r.param}`).toBeDefined();
          expect(['float', 'int']).toContain(pd!.kind);
          expect(Math.abs(r.depth)).toBeLessThanOrEqual(1);
        }
        if (def!.heavy) expect(pre.routes.length, `${pid} is heavy`).toBe(0);
        const ev = pre.event;
        if (ev) {
          expect(ev.everyBeats).toBeGreaterThanOrEqual(1);
          if (ev.kind === 'flip') expect(def!.params.find((p) => p.key === ev.param)?.kind).toBe('bool');
          if (ev.kind === 'step') {
            const pd = def!.params.find((p) => p.key === ev.param);
            expect(pd, `${pid}/${pre.id}: step ${ev.param}`).toBeDefined();
            expect(['int', 'float', 'enum']).toContain(pd!.kind);
          }
          if (ev.kind === 'reseed') expect(def!.usesSeed, `${pid}: reseed needs usesSeed`).toBe(true);
        }
      }
    }
  });
  it('heavy patterns always carry an event (their only animation channel)', () => {
    for (const def of listPatterns().filter((d) => d.heavy)) {
      for (const pre of PRESETS_BY_PATTERN[def.id]!) expect(pre.event, def.id).toBeDefined();
    }
  });
});

/**
 * Two presets on the same pattern have to be two animations.
 *
 * A preset is a param set, a sign per route, and an event. When two of them
 * agree on all three, the only thing left between them is which feature drives
 * which param — and that is not a difference you can see. The features are
 * AGC-normalized per band, so on most music they ride one envelope together;
 * swapping `level` for `bass` on a route changes the numbers by a few percent
 * and nothing else. delaunay shipped that way: mesh and scatter both drove
 * points, vertexSize and strokeWidth upward on the same 8-beat reseed, their
 * param vectors never parted by more than 3.7% of a range under a shared
 * envelope, and they were reported as indistinguishable in the stage.
 *
 * The signature below is deliberately coarse — it is a check for identical
 * design, not for similar depths. Two presets that differ in which params they
 * route, in the direction they push one, or in what their event does, pass.
 */
const signature = (pre: AnimPreset): string => JSON.stringify({
  routes: pre.routes.map((r) => `${r.param}${r.depth < 0 ? '-' : '+'}`).sort(),
  event: pre.event ?? null,
});

/**
 * Pairs allowed to stay twinned, with the divergence that justifies the
 * exemption — measured across a shared-envelope feature trajectory as the max
 * distance between the two param vectors, in fractions of a param range.
 *
 * Empty, and it should stay that way. Three pairs were in here when the rule
 * was written: delaunay mesh/scatter (0.037 apart), fabric weave/ripple
 * (0.065) and voronoi cells/breathe (0.077). All three were split instead, and
 * now measure 0.83, 0.51 and 0.34 — against 0.49 for harmonograph
 * pulse/breathe, which was the most distinct pair in the table before.
 */
const KNOWN_TWINS: Record<string, string> = {};

describe('presets are distinguishable from each other', () => {
  it('no two presets of a pattern are the same animation', () => {
    const twins: string[] = [];
    for (const [pid, presets] of Object.entries(PRESETS_BY_PATTERN)) {
      for (let i = 0; i < presets.length; i++) {
        for (let j = i + 1; j < presets.length; j++) {
          const a = presets[i]!, b = presets[j]!;
          const key = `${pid}/${a.id}+${b.id}`;
          if (signature(a) === signature(b) && !KNOWN_TWINS[key]) twins.push(`${key}: ${signature(a)}`);
        }
      }
    }
    expect(twins).toEqual([]);
  });

  it('every exempted pair is real and still twinned', () => {
    for (const key of Object.keys(KNOWN_TWINS)) {
      const [pid, pair] = key.split('/') as [string, string];
      const [ida, idb] = pair.split('+') as [string, string];
      const presets = PRESETS_BY_PATTERN[pid];
      const a = presets?.find((p) => p.id === ida);
      const b = presets?.find((p) => p.id === idb);
      expect(a, key).toBeDefined();
      expect(b, key).toBeDefined();
      // If one gets fixed, its entry has to go — an exemption that no longer
      // describes anything is a note nobody will ever act on.
      expect(signature(a!), `${key} is no longer twinned; drop the exemption`).toBe(signature(b!));
    }
  });
});
