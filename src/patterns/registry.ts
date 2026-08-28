import type { SvgNode } from '../core/svg';
import { el } from '../core/svg';
import { RESERVED } from '../core/reserved';

export type Family = 'points' | 'curves' | 'fields' | 'attractors' | 'tilings' | 'growth';

export interface ParamDef {
  key: string;
  kind: 'int' | 'float' | 'bool' | 'enum';
  min: number;
  max: number;
  step: number;
  default: number;
  label: string; // i18n key
  /** enum only: option labels (i18n keys); value is the index. */
  options?: string[];
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

/** Injected into every pattern: scales the artwork within the frame. */
export const SIZE_PARAM: ParamDef = {
  key: 'size', kind: 'float', min: 0.2, max: 1.6, step: 0.01, default: 1, label: 'common.size',
};

const registry = new Map<string, PatternDef>();

export function definePattern(def: PatternDef): PatternDef {
  if (registry.has(def.id)) throw new Error(`duplicate pattern id: ${def.id}`);
  for (const p of def.params) {
    if (RESERVED.has(p.key)) throw new Error(`param key '${p.key}' is reserved (pattern ${def.id})`);
    if (p.key === SIZE_PARAM.key) throw new Error(`param key '${p.key}' is reserved (pattern ${def.id})`);
  }
  def.params.push(SIZE_PARAM);
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
    if (p.kind === 'bool') v = v >= 0.5 ? 1 : 0;
    if (p.kind === 'enum') v = Math.round(Math.min(p.max, Math.max(p.min, v)));
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
  const clamped = clampParams(def, { ...defaultParams(def), ...raw });
  const { size: s = 1, ...rest } = clamped;
  const node = def.generate(rest, seed, size);
  const paperRect = el('rect', { x: 0, y: 0, width: size.w, height: size.h, fill: 'paper' });
  if (s === 1) {
    return { ...node, children: [paperRect, ...node.children] };
  }
  const cx = size.w / 2, cy = size.h / 2;
  return {
    ...node,
    children: [
      paperRect,
      el('g', { transform: `translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})` }, node.children),
    ],
  };
}
