import type { Palette } from '../core/svg';

export interface PaletteDef extends Palette { id: string; name: string }

export const PALETTES: PaletteDef[] = [
  { id: 'mono-light', name: 'Mono Light', paper: '#ffffff', ink: '#1c1b22', accent: '#e3261a' },
  { id: 'mono-dark', name: 'Mono Dark', paper: '#17171a', ink: '#ececea', accent: '#e3261a' },
  { id: 'navy-gold', name: 'Navy & Gold', paper: '#131a2b', ink: '#e8dcc0', accent: '#d9a441' },
  { id: 'teal-sand', name: 'Teal & Sand', paper: '#0e3b43', ink: '#f5f0e6', accent: '#d9a441' },
  { id: 'terracotta', name: 'Terracotta', paper: '#f5f0e6', ink: '#1c1b22', accent: '#b5502a' },
  { id: 'sashiko', name: 'Sashiko Indigo', paper: '#1f3a5f', ink: '#f5f0e6', accent: '#d9a441' },
  { id: 'ivory-forest', name: 'Ivory & Forest', paper: '#f5f0e6', ink: '#2f4a3c', accent: '#b5502a' },
  { id: 'paper-cobalt', name: 'Paper & Cobalt', paper: '#ffffff', ink: '#1d3fbf', accent: '#e3261a' },
];

const HEX = /^[0-9a-fA-F]{6}$/;

export interface ColorState { pal?: string; bg?: string; ink?: string; acc?: string }

export function resolvePalette(c: ColorState, theme: 'light' | 'dark'): Palette {
  const fallback = theme === 'dark' ? PALETTES[1]! : PALETTES[0]!;
  const base = PALETTES.find((p) => p.id === c.pal) ?? fallback;
  return {
    paper: c.bg && HEX.test(c.bg) ? '#' + c.bg.toLowerCase() : base.paper,
    ink: c.ink && HEX.test(c.ink) ? '#' + c.ink.toLowerCase() : base.ink,
    accent: c.acc && HEX.test(c.acc) ? '#' + c.acc.toLowerCase() : base.accent,
  };
}
