import { describe, it, expect } from 'vitest';
import { validate, fitsSheet, type Skeleton } from '../../src/compose/regions';

const OK: Skeleton = {
  id: 'test', artwork: 'bleed', title: 'paired', data: 'hidden', accent: 'rule',
  present: 'as-generated', split: 0.54, axis: 'h', artworkFirst: true,
  margin: { t: 112, r: 96, b: 88, l: 96 }, cover: 1.12, titleSize: 116,
  aspect: { min: 1.15, max: 1.75 }, decoration: { cropMarks: false, verticalCaption: false },
};

describe('validate', () => {
  it('accepts a well-formed skeleton', () => {
    expect(validate(OK)).toEqual([]);
  });

  it('rejects a third ground', () => {
    expect(validate({ ...OK, artwork: 'plate', title: 'banded', present: 'tinted' }))
      .toContain('more than two grounds');
  });

  it('counts an accent ground and a title band as the same field', () => {
    expect(validate({ ...OK, artwork: 'plate', title: 'banded', accent: 'ground', data: 'ruled-boxes' }))
      .toEqual([]);
  });

  it('ties ruled boxes to a banded title', () => {
    expect(validate({ ...OK, data: 'ruled-boxes' })).toContain('ruled-boxes needs a banded title');
  });

  it('refuses a parameter grid with no paper region', () => {
    expect(validate({ ...OK, artwork: 'full', data: 'grid-4' })).toContain('grid-4 needs a paper region');
  });

  it('refuses tinting with no bed to tint', () => {
    expect(validate({ ...OK, artwork: 'full', present: 'tinted' }))
      .toContain('full-bleed artwork has no tint bed');
    expect(validate({ ...OK, artwork: 'column', present: 'tinted' }))
      .toContain('tinted needs a bounded bed');
  });

  it('refuses an accent title on an accent band', () => {
    expect(validate({ ...OK, artwork: 'plate', title: 'banded', accent: 'title' }))
      .toContain('an accent title on an accent band is invisible');
  });

  it('bounds cover and split, exempting column regions from the cover band', () => {
    expect(validate({ ...OK, cover: 1.5 })).toContain('cover outside 1.12-1.32');
    expect(validate({ ...OK, artwork: 'column', axis: 'v', cover: 1.68 })).toEqual([]);
    expect(validate({ ...OK, split: 0.9 })).toContain('split outside 0.2-0.8');
    expect(validate({ ...OK, artwork: 'full', split: 0.9 })).toEqual([]);
  });
});

describe('fitsSheet', () => {
  it('admits only ratios inside the declared range', () => {
    expect(fitsSheet(OK, 1.414)).toBe(true);
    expect(fitsSheet(OK, 1.0)).toBe(false);
    expect(fitsSheet(OK, 0.71)).toBe(false);
  });
});
