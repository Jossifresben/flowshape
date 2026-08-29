import type { Presentation } from './colorways';

export type ArtworkMode = 'bleed' | 'column' | 'plate' | 'full';
export type TitleMode = 'paired' | 'stacked' | 'split' | 'banded';
export type DataMode = 'grid-4' | 'label-pair' | 'ruled-boxes' | 'hidden';
export type AccentMode = 'rule' | 'numeral' | 'code' | 'title' | 'ground' | 'none';

export interface Margin { t: number; r: number; b: number; l: number }

/** A layout, as data. Nothing outside `skeletons.ts` may branch on `id`. */
export interface Skeleton {
  id: string;
  artwork: ArtworkMode;
  title: TitleMode;
  data: DataMode;
  accent: AccentMode;
  present: Presentation;
  /** Fraction of the split axis. Ignored when `artwork` is 'full'. */
  split: number;
  /** 'h' = a horizontal boundary (stacked). 'v' = a vertical one (columns). */
  axis: 'h' | 'v';
  /** Artwork takes the leading side of the split — top for 'h', left for 'v'. */
  artworkFirst: boolean;
  /** Reference px. */
  margin: Margin;
  /** Artwork scale in cover regions. */
  cover: number;
  /** Reference px, before any overflow step-down. */
  titleSize: number;
  /** The layout is invalid for a pattern whose name will not fit one line. */
  oneLineTitle?: boolean;
  /** Legal sheet ratio (h / w). Above 1 portrait, below 1 landscape. */
  aspect: { min: number; max: number };
  decoration: { cropMarks: boolean; verticalCaption: boolean };
  /** A second accent mark offered as a browsable variant. */
  altAccent?: AccentMode;
  /** 3d's gradient over full-bleed artwork. Not optional where it is declared. */
  scrim?: boolean;
}

/**
 * Every constraint the handover states in prose, as one predicate.
 * Returns the violations; empty means legal.
 */
export function validate(s: Skeleton): string[] {
  const bad: string[] = [];

  // A ground is a full colour field. The sheet is always one. The accent field
  // is at most one more — and an accent ground and a title band are the *same*
  // field, which is why 4b is legal with both. A tint bed is another. Three
  // fields on one sheet is out of spec, always (handover section 2).
  const accentField = s.accent === 'ground' || s.title === 'banded';
  const fields = 1 + (accentField ? 1 : 0) + (s.present === 'tinted' ? 1 : 0);
  if (fields > 2) bad.push('more than two grounds');

  if (s.data === 'ruled-boxes' && s.title !== 'banded') bad.push('ruled-boxes needs a banded title');
  if (s.data === 'grid-4' && s.artwork === 'full') bad.push('grid-4 needs a paper region');
  if (s.artwork === 'full' && s.present === 'tinted') bad.push('full-bleed artwork has no tint bed');
  if (s.artwork === 'full' && accentField) bad.push('full-bleed artwork leaves no room for an accent field');
  if (s.accent === 'title' && s.title === 'banded') bad.push('an accent title on an accent band is invisible');
  if (s.present === 'tinted' && s.artwork !== 'plate' && s.artwork !== 'bleed') {
    bad.push('tinted needs a bounded bed');
  }
  // Column regions scale hard on one axis by design (handover section 4's fit
  // rules put 4d at ~168% width), so they sit outside the cover band.
  if (s.artwork !== 'plate' && s.artwork !== 'column' && (s.cover < 1.12 || s.cover > 1.32)) {
    bad.push('cover outside 1.12-1.32');
  }
  if (s.artwork !== 'full' && (s.split < 0.2 || s.split > 0.8)) bad.push('split outside 0.2-0.8');
  if (!(s.aspect.min > 0 && s.aspect.min < s.aspect.max)) bad.push('empty aspect range');
  if (s.altAccent !== undefined && s.altAccent === s.accent) bad.push('alt accent duplicates the base accent');
  return bad;
}

/** Whether this layout is offered for a sheet of the given ratio. */
export function fitsSheet(s: Skeleton, ratio: number): boolean {
  return ratio >= s.aspect.min && ratio <= s.aspect.max;
}
