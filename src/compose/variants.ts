import { validate, fitsSheet, type Skeleton } from './regions';

export interface Variant {
  id: string;
  skeleton: Skeleton;
}

/** Offsets applied to a skeleton's declared split. */
const SPLIT_OFFSETS = [0, -0.04, 0.04];

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** A skeleton's own decoration, and its complement. Two positions, not four —
 *  crop marks and a vertical caption are a single editorial gesture, and
 *  splitting them quadruples the list for a difference nobody browses for. */
function decorationsFor(s: Skeleton): Skeleton['decoration'][] {
  const own = s.decoration;
  const other = own.cropMarks || own.verticalCaption
    ? { cropMarks: false, verticalCaption: false }
    : { cropMarks: true, verticalCaption: true };
  return [own, other];
}

/**
 * The browsable list: every skeleton that fits the sheet, expanded across its
 * free axes and re-validated. Deterministic — the same sheet always yields the
 * same list in the same order, so a stored `layout` id keeps meaning something.
 *
 * Only tier one. Novel topologies composed from the full region model are
 * deliberately out: the handover's own warning is that fully generated layouts
 * make some exports weaker, and a browse list where most options are mediocre
 * reads as cheap.
 */
export function variantsFor(skeletons: Skeleton[], ratio: number): Variant[] {
  const perSkeleton: Variant[][] = [];
  for (const base of skeletons) {
    if (!fitsSheet(base, ratio)) continue;
    const out: Variant[] = [];
    const splits = base.artwork === 'full' ? [0] : SPLIT_OFFSETS;
    const decos = decorationsFor(base);
    const accents = base.altAccent ? [base.accent, base.altAccent] : [base.accent];
    splits.forEach((ds, i) => {
      decos.forEach((decoration, j) => {
        accents.forEach((accent, k) => {
          const skeleton: Skeleton = {
            ...base,
            split: clamp(base.split + ds, 0.2, 0.8),
            decoration,
            accent,
            altAccent: undefined,
          };
          if (validate(skeleton).length > 0) return;
          out.push({ id: `${base.id}.s${i}.d${j}.a${k}`, skeleton });
        });
      });
    });
    perSkeleton.push(out);
  }
  // Round-robin across skeletons rather than exhausting one before the next.
  // Nested order put a layout's own variations adjacent, so the first several
  // steps changed only an accent or a crop mark - browsing read as broken
  // because consecutive sheets looked identical. This way one pass through the
  // list shows every distinct layout first, and the refinements come after.
  const out: Variant[] = [];
  const deepest = perSkeleton.reduce((n, list) => Math.max(n, list.length), 0);
  for (let i = 0; i < deepest; i++) {
    for (const list of perSkeleton) {
      const v = list[i];
      if (v) out.push(v);
    }
  }
  return out;
}

export function findVariant(variants: Variant[], id: string | undefined): Variant | undefined {
  return id === undefined ? undefined : variants.find((v) => v.id === id);
}
