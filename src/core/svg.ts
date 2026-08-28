export type Role = 'ink' | 'paper' | 'accent';
export interface Palette { paper: string; ink: string; accent: string }

export interface SvgNode {
  tag: string;
  attrs: Record<string, string | number>;
  children: SvgNode[];
}

export function el(
  tag: string,
  attrs: Record<string, string | number> = {},
  children: SvgNode[] = [],
): SvgNode {
  return { tag, attrs, children };
}

const ROLE_ATTRS = new Set(['fill', 'stroke']);
const ROLES = new Set<string>(['ink', 'paper', 'accent']);

function fmt(v: string | number): string {
  if (typeof v === 'number') {
    const r = Math.round(v * 100) / 100;
    return String(r);
  }
  return v;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function serialize(node: SvgNode, pal: Palette): string {
  const attrs = { ...node.attrs };
  if (node.tag === 'svg' && attrs['xmlns'] === undefined) {
    attrs['xmlns'] = 'http://www.w3.org/2000/svg';
  }
  const parts: string[] = [];
  for (const [k, v] of Object.entries(attrs)) {
    let out = fmt(v);
    if (ROLE_ATTRS.has(k) && ROLES.has(out)) out = pal[out as Role];
    parts.push(`${k}="${esc(out)}"`);
  }
  const open = `<${node.tag}${parts.length ? ' ' + parts.join(' ') : ''}`;
  if (node.children.length === 0) return `${open}/>`;
  return `${open}>${node.children.map((c) => serialize(c, pal)).join('')}</${node.tag}>`;
}
