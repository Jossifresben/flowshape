import { renderSize, physicalSize, type FormatState } from '../poster/formats';

/** The handover authors every constant at A3, 150 dpi: 1240 x 1754 px.
 *
 *  That space is a source of numbers, never a canvas — the real canvas comes
 *  from `renderSize`, which pins the short edge at 600 so stroke weights read
 *  the same across every format (see poster/formats.ts). The distinction
 *  matters because the user picks the format upstream in the playground, and
 *  six of the ten shipped formats are off A3's 1.414 ratio. */
export const REF_SHORT = 1240;
export const REF_LONG = 1754;

export interface Sheet {
  /** Sheet space, short edge 600. */
  w: number;
  h: number;
  /** Reference px -> sheet px. Constant across formats, because the short edge is. */
  unit: number;
  /** h / w. Above 1 portrait, below 1 landscape. Drives which skeletons are offered. */
  ratio: number;
  wmm: number;
  hmm: number;
}

export function sheet(s: FormatState): Sheet {
  const { w, h } = renderSize(s);
  const { wmm, hmm } = physicalSize(s);
  return { w, h, unit: Math.min(w, h) / REF_SHORT, ratio: h / w, wmm, hmm };
}

/** Reference px -> sheet px. */
export function u(sh: Sheet, refPx: number): number {
  return refPx * sh.unit;
}
