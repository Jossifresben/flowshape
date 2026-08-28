import type { SvgNode } from '../core/svg';
import { RESERVED } from '../core/reserved';

export type Family = 'points' | 'curves' | 'fields' | 'attractors' | 'tilings' | 'growth';

export interface ParamDef {
  key: string;
  kind: 'int' | 'float';
  min: number;
  max: number;
  step: number;
  default: number;
  label: string; // i18n key
}

export type Params = Record<string, number>;
export interface Size { w: number; h: number }

export interface PatternDef {
  id: string;
  family: Family;
  phase: 1 | 2;
  heavy: boolean;
  params: ParamDef[];
  /** Show the seed control; set when generate actually consumes the seed. */
  usesSeed?: boolean;
  /** Pure and deterministic: same inputs ⇒ identical tree. Colors as role tokens. */
  generate(params: Params, seed: number, size: Size): SvgNode;
}

const registry = new Map<string, PatternDef>();

export function definePattern(def: PatternDef): PatternDef {
  if (registry.has(def.id)) throw new Error(`duplicate pattern id: ${def.id}`);
  for (const p of def.params) {
    if (RESERVED.has(p.key)) throw new Error(`param key '${p.key}' is reserved (pattern ${def.id})`);
  }
  registry.set(def.id, def);
  return def;
}

export function getPattern(id: string): PatternDef | undefined {
  return registry.get(id);
}

export function listPatterns(): PatternDef[] {
  return [...registry.values()];
}

export function defaultParams(def: PatternDef): Params {
  return Object.fromEntries(def.params.map((p) => [p.key, p.default]));
}

/** Clamp arbitrary (URL-supplied) values into the param's legal range. */
export function clampParams(def: PatternDef, raw: Params): Params {
  const out: Params = {};
  for (const p of def.params) {
    let v = raw[p.key];
    if (v === undefined || Number.isNaN(v)) v = p.default;
    v = Math.min(p.max, Math.max(p.min, v));
    if (p.kind === 'int') v = Math.round(v);
    out[p.key] = v;
  }
  return out;
}

/** The only sanctioned way to run a pattern: clamps raw (URL/worker) params first. */
export function generateSafe(
  def: PatternDef,
  raw: Params,
  seed: number,
  size: Size,
): SvgNode {
  return def.generate(clampParams(def, { ...defaultParams(def), ...raw }), seed, size);
}
