import { describe, it, expect } from 'vitest';
import '../../src/patterns/index';
import { listPatterns } from '../../src/patterns/registry';
import { LANGS, hasParamLabel, paramLabel, patternName, familyLabel, t } from '../../src/i18n';
import { UI } from '../../src/i18n/ui';
import { PATTERN_NAMES, FAMILY_NAMES } from '../../src/i18n/patterns';

// The point of these assertions: registering a pattern, adding a parameter, or
// adding an enum option without translating it must fail CI rather than ship a
// control that silently falls back to a bare uppercased key.

describe('i18n coverage', () => {
  it('names every registered pattern in both languages', () => {
    for (const def of listPatterns()) {
      expect(PATTERN_NAMES[def.id], `missing PATTERN_NAMES entry for '${def.id}'`).toBeTruthy();
      for (const lang of LANGS) {
        expect(patternName(def.id, lang), `empty ${lang} name for '${def.id}'`).not.toBe('');
        expect(patternName(def.id, lang)).not.toBe(def.id);
      }
    }
  });

  it('labels every family present in the registry, in both languages', () => {
    for (const family of new Set(listPatterns().map((p) => p.family))) {
      expect(FAMILY_NAMES[family], `missing FAMILY_NAMES entry for '${family}'`).toBeTruthy();
      for (const lang of LANGS) expect(familyLabel(family, lang)).toBeTruthy();
    }
  });

  it('labels every parameter of every pattern, including hidden and injected ones', () => {
    for (const def of listPatterns()) {
      for (const p of def.params) {
        expect(hasParamLabel(p.label), `no label for '${p.label}' (pattern ${def.id})`).toBe(true);
        for (const lang of LANGS) expect(paramLabel(p.label, lang)).toBeTruthy();
      }
    }
  });

  it('labels every enum option', () => {
    for (const def of listPatterns()) {
      for (const p of def.params) {
        for (const opt of p.options ?? []) {
          expect(hasParamLabel(opt), `no label for option '${opt}' (pattern ${def.id})`).toBe(true);
          for (const lang of LANGS) expect(paramLabel(opt, lang)).toBeTruthy();
        }
      }
    }
  });

  it('labels the four colour controls', () => {
    for (const key of ['color.hue', 'color.chroma', 'color.paperL', 'color.accentShift']) {
      expect(hasParamLabel(key), `no label for '${key}'`).toBe(true);
    }
  });

  it('has a non-empty string for both languages of every chrome key', () => {
    for (const [key, pair] of Object.entries(UI)) {
      expect(pair[0], `empty English string for '${key}'`).not.toBe('');
      expect(pair[1], `empty Spanish string for '${key}'`).not.toBe('');
      for (const lang of LANGS) expect(t(key, lang)).not.toBe(key);
    }
  });

  // The four keys whose Spanish is deliberately identical to the English:
  // 'REC', 'MIC' and 'DEMOS' are the same device abbreviations in both
  // languages, and 'PRESET' is the loanword every Spanish-language audio tool
  // uses. Asserted as an exact list rather than merely tolerated: a NEW
  // untranslated key still fails, and translating one of these four fails too
  // until the list is updated — so the decision stays deliberate.
  const IDENTICAL_BY_DESIGN = ['anim.demos', 'anim.mic', 'anim.preset', 'anim.record'];

  it('actually translates the chrome — Spanish is not a copy of English', () => {
    const identical = Object.entries(UI).filter(([, p]) => p[0] === p[1]);
    expect(identical.map(([k]) => k).sort()).toEqual(IDENTICAL_BY_DESIGN);
  });
});
