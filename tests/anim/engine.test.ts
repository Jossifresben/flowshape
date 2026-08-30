import { describe, it, expect } from 'vitest';
import '../../src/patterns/index';
import { getPattern, defaultParams } from '../../src/patterns/registry';
import { BeatClock, phaseAt, frameParams } from '../../src/anim/engine';
import { PRESETS_BY_PATTERN } from '../../src/anim/presets';
import { ZERO_FRAME } from '../../src/audio/features';

describe('BeatClock', () => {
  const clock = new BeatClock([0.5, 1.0, 1.5, 2.0]);
  it('counts beats at or before t', () => {
    expect(clock.beatIndex(0.1)).toBe(-1);
    expect(clock.beatIndex(0.5)).toBe(0);
    expect(clock.beatIndex(1.49)).toBe(1);
    expect(clock.beatIndex(99)).toBe(3);
  });
  it('reports the next beat or null', () => {
    expect(clock.nextBeat(0.6)).toBe(1.0);
    expect(clock.nextBeat(2.0)).toBeNull();
  });
});

describe('phaseAt', () => {
  it('wraps in [0,1) and follows tempo when known', () => {
    expect(phaseAt(0, null)).toBe(0);
    expect(phaseAt(10, null)).toBeCloseTo(0.5, 5); // 0.05 cps free-run
    expect(phaseAt(8, 120)).toBeCloseTo(0, 5);     // 120bpm → 1 cycle per 16 beats = 8 s
    expect(phaseAt(12, 120)).toBeCloseTo(0.5, 5);
  });
});

describe('frameParams', () => {
  const def = getPattern('flowfield')!;
  const preset = PRESETS_BY_PATTERN['flowfield']![0]!; // reseed every 8 beats
  const base = { def, baseParams: defaultParams(def), baseSeed: 5, preset, intensity: 1 };

  it('is deterministic', () => {
    const f = { ...ZERO_FRAME, bass: 0.6 };
    const a = frameParams({ ...base, features: f, phase: 0.2, beatIndex: 3 });
    expect(a).toEqual(frameParams({ ...base, features: f, phase: 0.2, beatIndex: 3 }));
  });
  it('keeps the seed within an event window and changes it across windows', () => {
    const at = (beat: number) => frameParams({ ...base, features: ZERO_FRAME, phase: 0, beatIndex: beat }).seed;
    expect(at(-1)).toBe(5);
    expect(at(0)).toBe(5);
    expect(at(7)).toBe(at(0));
    expect(at(8)).not.toBe(at(7));
    expect(at(15)).toBe(at(8));
  });
  // Any step preset with a from/to sub-range serves as the fixture; it is
  // scanned for rather than named, because which patterns step is a design
  // decision that moves (maurer stepped once, and stopped — its structure IS
  // the visitor's design). Driven off the preset's own spec rather than
  // hard-coded numbers, so a recalibration doesn't silently stop testing.
  const stepFixture = (() => {
    for (const [pattern, presets] of Object.entries(PRESETS_BY_PATTERN)) {
      for (const preset of presets) {
        const ev = preset.event;
        if (ev?.kind === 'step' && ev.from !== undefined && getPattern(pattern)) {
          return { def: getPattern(pattern)!, preset };
        }
      }
    }
    throw new Error('no step preset with a sub-range left to test');
  })();

  it('step events start from the base value, cycle the range and wrap', () => {
    const { def: sdef, preset: spreset } = stepFixture;
    const ev = spreset.event!;
    const steps = ev.steps!;
    const pd = sdef.params.find((p) => p.key === ev.param)!;
    // pd.min is outside the from..to sub-range (asserted below), so a base
    // parked there can never be mistaken for a stepped value.
    const baseVal = pd.min;
    const at = (beat: number) =>
      frameParams({ def: sdef, baseParams: { ...defaultParams(sdef), [ev.param!]: baseVal }, baseSeed: 1, preset: spreset, intensity: 1, features: ZERO_FRAME, phase: 0, beatIndex: beat }).params[ev.param!];
    expect(at(0)).toBe(baseVal);                        // home window IS the design
    expect(at(0)).toBe(at(ev.everyBeats - 1));          // holds inside a window
    expect(at(0)).not.toBe(at(ev.everyBeats));          // moves across windows
    expect(at(0)).toBe(at(ev.everyBeats * (steps + 1)));// wraps after home + steps
  });
  it('a step with from/to stays inside that sub-range, not the param range', () => {
    const { def: sdef, preset: spreset } = stepFixture;
    const ev = spreset.event!;
    const seen: number[] = [];
    // Window 0 is the visitor's own value; the traversal is windows 1..steps.
    for (let k = 1; k <= ev.steps!; k++) {
      seen.push(frameParams({ def: sdef, baseParams: defaultParams(sdef), baseSeed: 1, preset: spreset, intensity: 1, features: ZERO_FRAME, phase: 0, beatIndex: k * ev.everyBeats }).params[ev.param!]!);
    }
    expect(Math.min(...seen)).toBe(ev.from);
    expect(Math.max(...seen)).toBe(ev.to);
    const pd = sdef.params.find((p) => p.key === ev.param)!;
    expect(Math.min(...seen)).toBeGreaterThan(pd.min);  // the degenerate end is never visited
    expect(Math.max(...seen)).toBeLessThanOrEqual(pd.max);
  });
  it('injects phase for usesPhase patterns and omits it otherwise', () => {
    const h = getPattern('harmonograph')!;
    const hp = PRESETS_BY_PATTERN['harmonograph']![0]!;
    const out = frameParams({ def: h, baseParams: defaultParams(h), baseSeed: 1, preset: hp, intensity: 1, features: ZERO_FRAME, phase: 0.4, beatIndex: 0 });
    expect(out.params['phase']).toBe(0.4);
    // truchet stands for the non-adopters: a tiling with no time axis of its
    // own, so the engine must not hand it one.
    const t = getPattern('truchet')!;
    const tp = PRESETS_BY_PATTERN['truchet']![0]!;
    const tf = frameParams({ def: t, baseParams: defaultParams(t), baseSeed: 1, preset: tp, intensity: 1, features: ZERO_FRAME, phase: 0.4, beatIndex: 0 });
    expect('phase' in tf.params).toBe(false);
  });
});
