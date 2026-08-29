import type { Skeleton } from './regions';

/**
 * The eight layouts drawn and approved in the handover, as records.
 *
 * Split points are fractions, not pixels. The handover gives both — 944px and
 * 53.8% for 3a — and only the fraction survives a format change, which matters
 * because the user picks the format upstream and six of the ten shipped
 * formats are off A3's 1.414 ratio.
 *
 * `aspect` is what keeps a layout honest across formats: a 53.8% horizontal
 * split on a square sheet leaves a slab far wider than it is tall and the
 * title/description proportion breaks, so 3a simply is not offered there.
 */
export const SKELETONS: Skeleton[] = [
  // 3a — Bleed & slab. Artwork on ink up top, paper caption slab below.
  {
    id: '3a', artwork: 'bleed', title: 'paired', data: 'hidden', accent: 'rule',
    present: 'as-generated', split: 0.538, axis: 'h', artworkFirst: true,
    margin: { t: 112, r: 96, b: 88, l: 96 }, cover: 1.12, titleSize: 116,
    aspect: { min: 1.15, max: 1.75 },
    decoration: { cropMarks: false, verticalCaption: false },
    altAccent: 'none',
  },
  // 3b — Plate. Inverted artwork on a paper plate, full accent ground.
  // The one place a saturated field is allowed; do not add a second.
  {
    id: '3b', artwork: 'plate', title: 'stacked', data: 'label-pair', accent: 'ground',
    present: 'inverted', split: 0.60, axis: 'h', artworkFirst: true,
    margin: { t: 88, r: 80, b: 80, l: 80 }, cover: 1.0, titleSize: 104,
    aspect: { min: 0.70, max: 1.75 },
    decoration: { cropMarks: false, verticalCaption: false },
  },
  // 3c — Catalogue. The most information-dense; exercises every data slot.
  {
    id: '3c', artwork: 'bleed', title: 'split', data: 'grid-4', accent: 'code',
    present: 'as-generated', split: 0.56, axis: 'h', artworkFirst: false,
    margin: { t: 88, r: 88, b: 60, l: 88 }, cover: 1.18, titleSize: 128,
    aspect: { min: 1.20, max: 1.75 },
    decoration: { cropMarks: false, verticalCaption: false },
    altAccent: 'rule',
  },
  // 3d — Full field. Highest impact, highest risk across seeds.
  {
    id: '3d', artwork: 'full', title: 'paired', data: 'label-pair', accent: 'rule',
    present: 'as-generated', split: 0.5, axis: 'h', artworkFirst: true,
    margin: { t: 88, r: 88, b: 80, l: 88 }, cover: 1.32, titleSize: 132,
    aspect: { min: 0.60, max: 2.00 },
    decoration: { cropMarks: false, verticalCaption: false },
    scrim: true,
  },
  // 4a — Register. The quiet option: no accent at all, proving the system
  // reads without one. Keep it in the set.
  {
    id: '4a', artwork: 'bleed', title: 'stacked', data: 'hidden', accent: 'none',
    present: 'as-generated', split: 0.567, axis: 'h', artworkFirst: false,
    margin: { t: 88, r: 88, b: 88, l: 88 }, cover: 1.26, titleSize: 152,
    oneLineTitle: true, aspect: { min: 1.20, max: 1.75 },
    decoration: { cropMarks: true, verticalCaption: true },
  },
  // 4b — Data band. Ruled boxes on an accent band, big title inside the band.
  {
    id: '4b', artwork: 'bleed', title: 'banded', data: 'ruled-boxes', accent: 'ground',
    present: 'inverted', split: 0.371, axis: 'h', artworkFirst: false,
    margin: { t: 52, r: 60, b: 52, l: 60 }, cover: 1.18, titleSize: 132,
    oneLineTitle: true, aspect: { min: 1.20, max: 1.75 },
    decoration: { cropMarks: false, verticalCaption: false },
  },
  // 4c — Tinted field. Inverted artwork multiplied onto the accent.
  // The description is omitted by design: body copy on a tint fails 4.5:1.
  {
    id: '4c', artwork: 'bleed', title: 'split', data: 'hidden', accent: 'title',
    present: 'tinted', split: 0.42, axis: 'h', artworkFirst: true,
    margin: { t: 52, r: 52, b: 68, l: 52 }, cover: 1.22, titleSize: 112,
    aspect: { min: 1.20, max: 1.75 },
    decoration: { cropMarks: true, verticalCaption: true },
    altAccent: 'numeral',
  },
  // 4d — Column. The only layout where the pattern touches the sheet directly.
  {
    id: '4d', artwork: 'column', title: 'stacked', data: 'label-pair', accent: 'numeral',
    present: 'inverted', split: 0.442, axis: 'v', artworkFirst: false,
    margin: { t: 88, r: 60, b: 68, l: 80 }, cover: 1.68, titleSize: 108,
    aspect: { min: 0.70, max: 1.60 },
    decoration: { cropMarks: false, verticalCaption: false },
    altAccent: 'rule',
  },
];
