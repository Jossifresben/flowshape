// Generates the flowshape.art mockup artboards (.dc.html), light + dark themes.
import { writeFileSync } from 'node:fs';

const RED = '#E3261A';
const LIGHT = { INK: '#1c1b22', PAPER: '#ffffff', FOG: '#f2f2f0', LINE: '#e0e0dc', GRAY: '#8a8a86', SHADOW: 'rgba(0,0,0,0.10)' };
const DARK = { INK: '#ececea', PAPER: '#17171a', FOG: '#101012', LINE: '#2e2e33', GRAY: '#8e8e90', SHADOW: 'rgba(0,0,0,0.5)' };

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f1 = (n) => Math.round(n * 10) / 10;
const FONT = `'Helvetica Neue',Helvetica,Arial,sans-serif`;
const MONO = `'IBM Plex Mono',Menlo,monospace`;

function buildTheme(T, suffix) {
  const { INK, PAPER, FOG, LINE, GRAY, SHADOW } = T;

  // ---------- thumbnail generators (240x320) ----------
  const thumbWrap = (inner) =>
    `<svg viewBox="0 0 240 320" style="width:100%;height:auto;display:block;background:${PAPER}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

  function thumbMaurer() {
    const D2R = Math.PI / 180;
    let d = '';
    for (let k = 0; k <= 360; k++) {
      const th = k * 71 * D2R, r = 100 * Math.sin(6 * th);
      d += (k ? 'L' : 'M') + f1(120 + r * Math.cos(th)) + ' ' + f1(160 + r * Math.sin(th));
    }
    return thumbWrap(`<path d="${d}" fill="none" stroke="${INK}" stroke-width="0.6"/>`);
  }

  function thumbHarmonograph() {
    let d = '';
    for (let i = 0; i < 8000; i++) {
      const t = i * 0.04;
      const x = 120 + 48 * (1.2 * Math.sin(2.007 * t + 1.2) * Math.exp(-0.0045 * t) + 0.8 * Math.sin(3 * t + 2.5) * Math.exp(-0.003 * t));
      const y = 160 + 48 * (1.2 * Math.sin(3.003 * t + 0.9) * Math.exp(-0.004 * t) + 0.8 * Math.sin(2 * t) * Math.exp(-0.0035 * t));
      d += (i ? 'L' : 'M') + f1(x) + ' ' + f1(y);
    }
    return thumbWrap(`<path d="${d}" fill="none" stroke="${INK}" stroke-width="0.45" opacity="0.55"/>`);
  }

  function noiseFns(seed) {
    const h = (i, j) => {
      const v = Math.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453;
      return v - Math.floor(v);
    };
    const n1 = (px, py) => {
      const i = Math.floor(px), j = Math.floor(py);
      let fx = px - i, fy = py - j;
      fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
      return h(i, j) * (1 - fx) * (1 - fy) + h(i + 1, j) * fx * (1 - fy) + h(i, j + 1) * (1 - fx) * fy + h(i + 1, j + 1) * fx * fy;
    };
    return (px, py) => {
      const f = 0.016;
      const n = 0.65 * n1(px * f, py * f) + 0.35 * n1(px * f * 2.3 + 40, py * f * 2.3 + 40);
      return (n * 2 - 1) * Math.PI * 1.9;
    };
  }

  function thumbFlow() {
    const ang = noiseFns(13), rnd = mulberry32(99), m = 16;
    let out = '';
    for (let gy = m; gy < 320 - m; gy += 14) for (let gx = m; gx < 240 - m; gx += 14) {
      if (rnd() < 0.3) continue;
      let px = gx + rnd() * 5, py = gy + rnd() * 5, d = 'M' + f1(px) + ' ' + f1(py);
      for (let k = 0; k < 46; k++) {
        const a = ang(px, py); px += Math.cos(a) * 2; py += Math.sin(a) * 2;
        if (px < m || px > 240 - m || py < m || py > 320 - m) break;
        d += 'L' + f1(px) + ' ' + f1(py);
      }
      out += `<path d="${d}" fill="none" stroke="${INK}" stroke-width="0.9" opacity="0.85"/>`;
    }
    return thumbWrap(out);
  }

  function thumbStipple() {
    const GA = Math.PI * (3 - Math.sqrt(5));
    let out = '';
    for (let n = 0; n < 520; n++) {
      const r = 4.6 * Math.sqrt(n), a = n * GA;
      const x = f1(120 + r * Math.cos(a)), y = f1(160 + r * Math.sin(a));
      const rad = f1(0.7 + n * 0.004);
      out += `<circle cx="${x}" cy="${y}" r="${rad}" fill="${n % 97 === 0 ? RED : INK}"/>`;
    }
    return thumbWrap(out);
  }

  function thumbDelaunay() {
    const rnd = mulberry32(11), pts = [];
    for (let j = 0; j < 9; j++) for (let i = 0; i < 7; i++)
      pts.push([20 + i * 33 + (j % 2 ? 16 : 0) + rnd() * 18 - 9, 20 + j * 33 + rnd() * 18 - 9]);
    let out = '';
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      if (Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]) < 44)
        out += `<line x1="${f1(pts[i][0])}" y1="${f1(pts[i][1])}" x2="${f1(pts[j][0])}" y2="${f1(pts[j][1])}" stroke="${INK}" stroke-width="0.7"/>`;
    }
    for (const p of pts) out += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="1.6" fill="${INK}"/>`;
    return thumbWrap(out);
  }

  function thumbTruchet() {
    const rnd = mulberry32(7), s = 28, ox = 8, oy = 6;
    let out = '';
    for (let i = 0; i < 8; i++) for (let j = 0; j < 11; j++) {
      const x = ox + i * s, y = oy + j * s, h = s / 2;
      const d = rnd() > 0.5
        ? `M${x} ${y + h} A${h} ${h} 0 0 1 ${x + h} ${y} M${x + h} ${y + s} A${h} ${h} 0 0 1 ${x + s} ${y + h}`
        : `M${x} ${y + h} A${h} ${h} 0 0 0 ${x + h} ${y + s} M${x + h} ${y} A${h} ${h} 0 0 0 ${x + s} ${y + h}`;
      out += `<path d="${d}" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`;
    }
    return thumbWrap(out);
  }

  function thumbHitomezashi() {
    const rnd = mulberry32(5), cell = 14, cols = 15, rows = 21, ox = 15, oy = 13;
    const cb = [], rb = [];
    for (let i = 0; i <= cols; i++) cb.push(rnd() < 0.5 ? 0 : 1);
    for (let j = 0; j <= rows; j++) rb.push(rnd() < 0.5 ? 0 : 1);
    let out = '';
    for (let i = 0; i <= cols; i++) for (let j = 0; j < rows; j++) if ((j + cb[i]) % 2 === 0)
      out += `<line x1="${ox + i * cell}" y1="${oy + j * cell + 1}" x2="${ox + i * cell}" y2="${oy + (j + 1) * cell - 1}" stroke="${INK}" stroke-width="1.5"/>`;
    for (let j = 0; j <= rows; j++) for (let i = 0; i < cols; i++) if ((i + rb[j]) % 2 === 0)
      out += `<line x1="${ox + i * cell + 1}" y1="${oy + j * cell}" x2="${ox + (i + 1) * cell - 1}" y2="${oy + j * cell}" stroke="${INK}" stroke-width="1.5"/>`;
    return thumbWrap(out);
  }

  function thumbGirih() {
    const S = 26, TH = Math.PI / 3, ct = Math.cos(TH), st = Math.sin(TH);
    const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
    let out = '';
    for (let r = -1; r < 9; r++) for (let q = -3; q < 7; q++) {
      const hx = S * Math.sqrt(3) * (q + r / 2), hy = S * 1.5 * r;
      if (hx < -S || hx > 240 + S || hy < -S || hy > 320 + S) continue;
      const V = [], M = [], E = [], Nn = [];
      for (let k = 0; k < 6; k++) {
        const a = Math.PI / 6 + k * Math.PI / 3;
        V.push([hx + S * Math.cos(a), hy + S * Math.sin(a)]);
      }
      for (let k = 0; k < 6; k++) {
        const v1 = V[k], v2 = V[(k + 1) % 6];
        const mx = (v1[0] + v2[0]) / 2, my = (v1[1] + v2[1]) / 2;
        M.push([mx, my]);
        const el = Math.hypot(v2[0] - v1[0], v2[1] - v1[1]);
        E.push([(v2[0] - v1[0]) / el, (v2[1] - v1[1]) / el]);
        const nl = Math.hypot(hx - mx, hy - my);
        Nn.push([(hx - mx) / nl, (hy - my) / nl]);
      }
      for (let k = 0; k < 6; k++) {
        const k2 = (k + 1) % 6;
        const d1 = [E[k][0] * ct + Nn[k][0] * st, E[k][1] * ct + Nn[k][1] * st];
        const d2 = [-E[k2][0] * ct + Nn[k2][0] * st, -E[k2][1] * ct + Nn[k2][1] * st];
        const dm = [M[k2][0] - M[k][0], M[k2][1] - M[k][1]], den = cross(d1, d2);
        if (Math.abs(den) < 1e-9) continue;
        const t = cross(dm, d2) / den;
        if (t <= 0 || t > S * 2) continue;
        const P = [M[k][0] + d1[0] * t, M[k][1] + d1[1] * t];
        out += `<path d="M${f1(M[k][0])} ${f1(M[k][1])} L${f1(P[0])} ${f1(P[1])} L${f1(M[k2][0])} ${f1(M[k2][1])}" fill="none" stroke="${INK}" stroke-width="1.4"/>`;
      }
    }
    return thumbWrap(out);
  }

  // ---------- big phyllotaxis stipple ----------
  function bigStipple(w, h, N, c, dotBase, dotGrow, ink) {
    const GA = Math.PI * (3 - Math.sqrt(5));
    const cx = w / 2, cy = h / 2;
    let out = '';
    for (let n = 0; n < N; n++) {
      const r = c * Math.sqrt(n), a = n * GA;
      out += `<circle cx="${f1(cx + r * Math.cos(a))}" cy="${f1(cy + r * Math.sin(a))}" r="${f1(dotBase + n * dotGrow)}" fill="${n % 89 === 0 ? RED : ink}"/>`;
    }
    return out;
  }

  // ---------- shared UI fragments ----------
  const HELMET = `<helmet>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&amp;display=swap" rel="stylesheet">
  <style>
    body { margin: 0; font-family: ${FONT}; color: ${INK}; -webkit-font-smoothing: antialiased; }
    a { color: ${INK}; text-decoration: none; } a:hover { color: ${RED}; }
  </style>
</helmet>`;

  function topbar(active, right) {
    const nav = ['Patterns', 'Families', 'About'].map((n) =>
      `<span style="font-size:13px;letter-spacing:0.02em;color:${n === active ? INK : GRAY};font-weight:${n === active ? '700' : '400'}">${n}</span>`
    ).join('');
    return `<div style="height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 32px;border-bottom:1px solid ${LINE};flex-shrink:0">
    <div style="display:flex;align-items:baseline;gap:40px">
      <div style="font-size:19px;font-weight:700;letter-spacing:-0.02em">flowshape<span style="color:{{accent}}">.art</span></div>
      <div style="display:flex;gap:24px">${nav}</div>
    </div>
    <div style="display:flex;align-items:center;gap:16px">${right}
      <div style="display:flex;align-items:center;gap:14px">
        <svg viewBox="0 0 16 16" style="width:15px;height:15px"><circle cx="8" cy="8" r="6.2" fill="none" stroke="${GRAY}" stroke-width="1.2"/><path d="M8 1.8 L8 14.2 A6.2 6.2 0 0 1 8 1.8 Z" fill="${GRAY}"/></svg>
        <div style="font-family:${MONO};font-size:11px;color:${GRAY}"><span style="color:${INK};font-weight:500">EN</span> / ES</div>
      </div>
    </div>
  </div>`;
  }

  function slider(label, value, pct) {
    return `<div style="display:flex;flex-direction:column;gap:8px">
    <div style="display:flex;justify-content:space-between;align-items:baseline">
      <span style="font-family:${MONO};font-size:10px;letter-spacing:0.12em;color:${GRAY}">${label}</span>
      <span style="font-family:${MONO};font-size:12px;font-weight:500">${value}</span>
    </div>
    <div style="position:relative;height:8px">
      <div style="position:absolute;top:3px;left:0;right:0;height:2px;background:${LINE}"></div>
      <div style="position:absolute;top:3px;left:0;width:${pct}%;height:2px;background:${INK}"></div>
      <div style="position:absolute;top:0;left:${pct}%;width:8px;height:8px;margin-left:-4px;background:${INK}"></div>
    </div>
  </div>`;
  }

  const panelSection = (title, inner) =>
    `<div style="display:flex;flex-direction:column;gap:16px;padding:20px 24px;border-bottom:1px solid ${LINE}">
    <div style="font-family:${MONO};font-size:10px;letter-spacing:0.16em;color:${GRAY}">${title}</div>${inner}</div>`;

  const DC_SCRIPT = `<script data-dc-script data-props='{"accent":{"editor":"color","default":"#E3261A"},"$preview":{"width":1440,"height":900}}'>
class Component extends DCLogic {
  renderVals() { return { accent: this.props.accent ?? '#E3261A' }; }
}
</script>`;

  const page = (bodyInner) => `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
${HELMET}
<div style="width:1440px;height:900px;background:${PAPER};display:flex;flex-direction:column;overflow:hidden">
${bodyInner}
</div>
</x-dc>
${DC_SCRIPT}
</body>
</html>`;

  // ---------- Gallery ----------
  const cards = [
    ['Stipple Field', 'Points &amp; Meshes', thumbStipple()],
    ['Delaunay Mesh', 'Points &amp; Meshes', thumbDelaunay()],
    ['Maurer Rose', 'Curves', thumbMaurer()],
    ['Harmonograph', 'Curves', thumbHarmonograph()],
    ['Flow Field', 'Fields', thumbFlow()],
    ['Truchet Arcs', 'Tilings', thumbTruchet()],
    ['Hitomezashi', 'Tilings', thumbHitomezashi()],
    ['Girih Stars', 'Tilings', thumbGirih()],
  ];

  const chips = ['All', 'Curves', 'Fields', 'Tilings', 'Points &amp; Meshes', 'Growth', 'Image'].map((c, i) =>
    `<div style="font-family:${MONO};font-size:11px;padding:6px 14px;border:1px solid ${i === 0 ? INK : LINE};background:${i === 0 ? INK : PAPER};color:${i === 0 ? PAPER : INK}">${c}</div>`
  ).join('');

  const cardHtml = cards.slice(0, 4).map(([name, tag, svg]) =>
    `<div style="display:flex;flex-direction:column;gap:10px">
    <div style="border:1px solid ${LINE}">${svg}</div>
    <div style="display:flex;justify-content:space-between;align-items:baseline">
      <span style="font-size:13px;font-weight:700;letter-spacing:-0.01em">${name}</span>
      <span style="font-family:${MONO};font-size:9px;letter-spacing:0.1em;color:${GRAY}">${tag}</span>
    </div>
  </div>`
  ).join('');

  const gallery = page(`${topbar('Patterns', '')}
<div style="flex:1;overflow:hidden;display:flex;flex-direction:column">
  <div style="padding:44px 32px 28px 32px;display:flex;justify-content:space-between;align-items:flex-end">
    <div style="display:flex;flex-direction:column;gap:12px;max-width:640px">
      <div style="font-size:46px;font-weight:700;letter-spacing:-0.03em;line-height:1.02">Shape mathematics<br>into posters.</div>
      <div style="font-size:15px;color:${GRAY};line-height:1.5">Play with a pattern, tune every parameter, then compose and edit your poster. Open source, free, EN/ES.</div>
    </div>
    <div style="font-family:${MONO};font-size:10px;letter-spacing:0.14em;color:${GRAY};padding-bottom:8px">24 PATTERNS &middot; 6 FAMILIES</div>
  </div>
  <div style="display:flex;gap:8px;padding:0 32px 24px 32px">${chips}</div>
  <div style="flex:1;padding:0 32px 20px 32px;display:grid;grid-template-columns:repeat(4, minmax(0, 1fr));gap:24px;overflow:hidden">${cardHtml}</div>
  <div style="padding:0 32px 28px 32px;display:flex">
    <div style="font-family:${MONO};font-size:11px;letter-spacing:0.1em;padding:10px 18px;border:1px solid ${INK}">ALL 24 PATTERNS &rarr;</div>
  </div>
</div>`);

  // ---------- Playground (Main) ----------
  const playgroundStipple = `<svg viewBox="0 0 1000 772" style="width:100%;height:100%;display:block;background:${PAPER}" xmlns="http://www.w3.org/2000/svg">${bigStipple(1000, 772, 1500, 9.2, 1.1, 0.0032, INK)}</svg>`;

  const playground = page(`${topbar('Patterns', `
  <div style="display:flex;align-items:center;gap:10px">
    <div style="font-family:${MONO};font-size:11px;padding:9px 16px;border:1px solid ${LINE};color:${INK}">Share link</div>
    <div style="font-size:13px;font-weight:700;padding:9px 20px;background:{{accent}};color:#ffffff">Create poster &rarr;</div>
  </div>`)}
<div style="flex:1;display:flex;overflow:hidden">
  <div style="flex:1;position:relative;background:${PAPER};overflow:hidden">
    ${playgroundStipple}
    <div style="position:absolute;left:24px;bottom:20px;display:flex;align-items:center;gap:14px">
      <span style="font-size:15px;font-weight:700">Stipple Field</span>
      <span style="font-family:${MONO};font-size:10px;letter-spacing:0.1em;color:${GRAY}">POINTS &amp; MESHES &middot; 03</span>
      <div style="display:flex;align-items:center;gap:7px;font-family:${MONO};font-size:10px;letter-spacing:0.08em;padding:7px 12px;border:1px solid ${INK}">
        <svg viewBox="0 0 16 16" style="width:12px;height:12px"><path d="M2 13 L6 3 L8 3 M4.5 8 L8 8 M9 13 L12 8.5 M15 13 L12 8.5 L10 6" fill="none" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/></svg>
        EXPLAIN THE MATH
      </div>
    </div>
  </div>
  <div style="width:360px;border-left:1px solid ${LINE};display:flex;flex-direction:column;overflow:hidden;flex-shrink:0">
    ${panelSection('SEED', `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-family:${MONO};font-size:16px;font-weight:500">71203</span>
        <div style="display:flex;gap:8px">
          <div style="font-family:${MONO};font-size:11px;padding:7px 14px;border:1px solid ${INK}">Randomize</div>
          <div style="font-family:${MONO};font-size:11px;padding:7px 14px;border:1px solid ${LINE};color:${GRAY}">Lock</div>
        </div>
      </div>`)}
    ${panelSection('PARAMETERS', `
      ${slider('POINTS', '1 500', 58)}
      ${slider('DIVERGENCE ANGLE', '137.51&deg;', 50)}
      ${slider('DOT SIZE', '1.1 &rarr; 5.9', 42)}
      ${slider('RADIAL EXPONENT', '0.50', 33)}
      ${slider('ACCENT EVERY', '89', 72)}`)}
    ${panelSection('PALETTE', `
      <div style="display:flex;gap:10px">
        <div style="display:flex;border:2px solid ${INK};padding:2px;gap:2px"><div style="width:26px;height:26px;background:${PAPER};border:1px solid ${LINE}"></div><div style="width:26px;height:26px;background:${INK}"></div><div style="width:26px;height:26px;background:${RED}"></div></div>
        <div style="display:flex;border:2px solid ${PAPER};padding:2px;gap:2px"><div style="width:26px;height:26px;background:#131a2b"></div><div style="width:26px;height:26px;background:#e8dcc0"></div><div style="width:26px;height:26px;background:#d9a441"></div></div>
        <div style="display:flex;border:2px solid ${PAPER};padding:2px;gap:2px"><div style="width:26px;height:26px;background:#0e3b43"></div><div style="width:26px;height:26px;background:#f5f0e6"></div><div style="width:26px;height:26px;background:#b5502a"></div></div>
      </div>`)}
    <div style="flex:1"></div>
    <div style="padding:20px 24px;border-top:1px solid ${LINE};display:flex;justify-content:space-between;align-items:center">
      <span style="font-family:${MONO};font-size:10px;color:${GRAY}">SVG &middot; 41 KB</span>
      <span style="font-family:${MONO};font-size:11px;color:${GRAY}">Every change updates the URL</span>
    </div>
  </div>
</div>`);

  // ---------- Poster preview (sheet stays white paper in both themes) ----------
  const SHEET_INK = '#1c1b22', SHEET_GRAY = '#8a8a86';
  const posterArt = `<svg viewBox="0 0 400 400" style="width:100%;height:auto;display:block;flex-shrink:0" xmlns="http://www.w3.org/2000/svg">${bigStipple(400, 400, 1100, 5.8, 0.8, 0.0026, SHEET_INK)}</svg>`;

  const chip = (c, sel) =>
    `<div style="font-family:${MONO};font-size:11px;padding:6px 12px;border:1px solid ${sel ? INK : LINE};background:${sel ? INK : PAPER};color:${sel ? PAPER : INK}">${c}</div>`;
  const isoChips = ['A5', 'A4', 'A3', 'A2'].map((c, i) => chip(c, i === 2)).join('');
  const usChips = ['LETTER', 'TABLOID', '18&times;24&Prime;', '24&times;36&Prime;'].map((c) => chip(c, false)).join('');
  const otherChips = ['1:1', '50&times;70', 'CUSTOM&hellip;'].map((c) => chip(c, false)).join('');
  const layoutChips = ['FULL BLEED', 'FRAMED', 'TITLED'].map((c, i) => chip(c, i === 2)).join('');

  const poster = page(`${topbar('Patterns', `
  <div style="display:flex;align-items:center;gap:10px">
    <div style="font-family:${MONO};font-size:11px;padding:9px 16px;border:1px solid ${LINE};color:${GRAY}">&larr; Back to pattern</div>
    <div style="font-family:${MONO};font-size:11px;padding:9px 16px;border:1px solid ${INK}">Export SVG</div>
    <div style="font-size:13px;font-weight:700;padding:9px 20px;background:${INK};color:${PAPER}">Export PNG</div>
  </div>`)}
<div style="flex:1;display:flex;overflow:hidden">
  <div style="flex:1;background:${FOG};display:flex;align-items:center;justify-content:center;position:relative">
    <div style="width:500px;height:707px;box-sizing:border-box;background:#ffffff;box-shadow:0 2px 16px ${SHADOW};display:flex;flex-direction:column;padding:50px">
      ${posterArt}
      <div style="margin-top:40px;display:flex;justify-content:space-between;align-items:flex-end">
        <div style="display:flex;flex-direction:column;gap:6px">
          <span style="font-size:20px;font-weight:700;letter-spacing:-0.02em;color:${SHEET_INK}">Stipple Field N&deg;3</span>
          <span style="font-family:${MONO};font-size:10px;letter-spacing:0.1em;color:${SHEET_GRAY}">PHYLLOTAXIS &middot; 137.51&deg; &middot; SEED 71203</span>
        </div>
        <span style="font-size:13px;font-weight:700;color:{{accent}}">flowshape.art</span>
      </div>
    </div>
    <div style="position:absolute;left:24px;bottom:20px;font-family:${MONO};font-size:10px;letter-spacing:0.1em;color:${GRAY}">A3 &middot; 297 &times; 420 MM &middot; 90%</div>
  </div>
  <div style="width:360px;border-left:1px solid ${LINE};display:flex;flex-direction:column;overflow:hidden;flex-shrink:0">
    ${panelSection('FORMAT', `
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;gap:8px">${isoChips}</div>
        <div style="display:flex;gap:8px">${usChips}</div>
        <div style="display:flex;gap:8px">${otherChips}</div>
      </div>`)}
    ${panelSection('LAYOUT', `<div style="display:flex;gap:8px">${layoutChips}</div>`)}
    ${panelSection('TEXT', `
      <div style="display:flex;flex-direction:column;gap:8px">
        <span style="font-family:${MONO};font-size:10px;letter-spacing:0.12em;color:${GRAY}">TITLE</span>
        <div style="font-size:13px;padding:10px 12px;border:1px solid ${LINE}">Stipple Field N&deg;3</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <span style="font-family:${MONO};font-size:10px;letter-spacing:0.12em;color:${GRAY}">CAPTION</span>
        <div style="font-family:${MONO};font-size:11px;padding:10px 12px;border:1px solid ${LINE};color:${GRAY}">PHYLLOTAXIS &middot; 137.51&deg; &middot; SEED 71203</div>
      </div>`)}
    <div style="flex:1"></div>
    <div style="padding:20px 24px;border-top:1px solid ${LINE};display:flex;flex-direction:column;gap:8px">
      <span style="font-family:${MONO};font-size:10px;letter-spacing:0.12em;color:${GRAY}">EXPORT &amp; FINISH</span>
      <span style="font-family:${MONO};font-size:10px;line-height:1.6;color:${GRAY}">Download SVG or PNG and finish it in Canva, Figma or any editor you like.</span>
    </div>
  </div>
</div>`);

  writeFileSync(`Gallery${suffix}.dc.html`, gallery);
  writeFileSync(`Main${suffix}.dc.html`, playground);
  writeFileSync(`Poster${suffix}.dc.html`, poster);
}

buildTheme(LIGHT, '');
buildTheme(DARK, 'Dark');

writeFileSync('canvas.json', JSON.stringify({
  artboards: [
    { file: 'Gallery.dc.html', x: 0, y: 0, w: 1440, h: 900, title: '1 · Gallery — Light' },
    { file: 'Main.dc.html', x: 1560, y: 0, w: 1440, h: 900, title: '2 · Pattern playground — Light' },
    { file: 'Poster.dc.html', x: 3120, y: 0, w: 1440, h: 900, title: '3 · Poster preview — Light' },
    { file: 'GalleryDark.dc.html', x: 0, y: 1020, w: 1440, h: 900, title: '1 · Gallery — Dark' },
    { file: 'MainDark.dc.html', x: 1560, y: 1020, w: 1440, h: 900, title: '2 · Pattern playground — Dark' },
    { file: 'PosterDark.dc.html', x: 3120, y: 1020, w: 1440, h: 900, title: '3 · Poster preview — Dark' },
  ],
  launch: { view: 'canvas' },
}, null, 2));
console.log('wrote 6 artboards + canvas.json');
