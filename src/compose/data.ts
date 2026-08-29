import { SIZE_PARAM, PHASE_PARAM, type PatternDef } from '../patterns/registry';
import type { AppState } from '../core/url-state';
import { NAMES } from '../ui/gallery';
import { BLURBS } from '../content/blurbs';
import { formatValue, formatInt, truncateDescription } from './text';

export interface PosterParam { key: string; value: string }

export interface PosterData {
  name: string;
  description: string;
  /** The real, reproducible identifier for this poster. What the `numeral`
   *  accent mode renders, now that decorative edition numbers are cut. */
  seed: number;
  /** Renders as "FORM: VOXEL". */
  formLabel: string;
  /** Renders as "MODE: ISOMETRIC". Comes from `def.family` — the honest field
   *  that already exists, rather than a taxonomy invented for the poster. */
  modeLabel: string;
  params: PosterParam[];
  /** Typed but unset in v1. The handover's own section 10 warns that fake
   *  edition numbers on a free tool read badly. Cutting them costs no layout:
   *  the `numeral` and `code` accent modes render the seed and the form label
   *  instead, so nothing on the sheet is invented. */
  seriesCode?: string;
  index?: number;
  meta?: { series?: string; edition?: string };
}

const MAX_PARAMS = 4;

export function posterData(def: PatternDef, state: AppState): PosterData {
  // `size` and `phase` are shell-injected, not the pattern's own maths, and
  // `hidden` params are engine-owned. Filtered against the exported constants
  // rather than string literals so this stays correct if a key moves.
  const visible = def.params.filter(
    (p) => !p.hidden && p.key !== SIZE_PARAM.key && p.key !== PHASE_PARAM.key,
  );
  const room = def.usesSeed ? MAX_PARAMS - 1 : MAX_PARAMS;
  const params: PosterParam[] = visible.slice(0, room).map((p) => ({
    // Same key-to-label rule the controls use (src/ui/controls.ts).
    key: p.label.split('.').pop()!.toUpperCase(),
    value: formatValue(state.params[p.key] ?? p.default, p.kind),
  }));
  if (def.usesSeed) params.push({ key: 'SEED', value: formatInt(state.seed) });

  return {
    name: NAMES[def.id] ?? def.id,
    description: truncateDescription(BLURBS[def.id]?.[state.lang] ?? ''),
    seed: state.seed,
    formLabel: def.id.toUpperCase(),
    modeLabel: def.family.toUpperCase(),
    params,
  };
}
