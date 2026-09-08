// Builds docs/paper/stripe-tiles.docx and docs/paper/stripe-tiles.md from one
// content model. Numbers come from docs/paper/figures/numbers.json, written by
// scripts/paper-stripe-tiles.ts — nothing numeric is typed here.
const fs = require("fs"); const path = require("path");
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  AlignmentType, BorderStyle, WidthType, ShadingType, HeadingLevel } = require("docx");
const REPO = require("path").resolve(__dirname, "..");
const FIG = path.join(REPO, "docs/paper/figures");
const N = JSON.parse(fs.readFileSync(path.join(FIG, "numbers.json"), "utf8"));
const f1 = N["fig1a-free"], f1b = N["fig1b-pmm"], f2 = N["fig2-chains"], f3 = N["fig3a-phase0"], f4 = N["fig4a-pipes0"];
const T = N.table; const sumFrozen = T.reduce((a, r) => a + r.frozen, 0); const sumChains = T.reduce((a, r) => a + r.chains, 0);
const sumClosed = T.reduce((a, r) => a + r.closed, 0); const sumDead = T.reduce((a, r) => a + r.deadEnds, 0);
if (sumFrozen !== 0 || N.fig3_phase1_equals_phase0 !== true) throw new Error("numbers contradict the paper");

// ─── Content model ───────────────────────────────────────────────────────────
const TITLE = "Stripe Tiles: Band Chains and Seam-Free Lateral Motion in N-Stripe Truchet Tilings";
const AUTHOR = "Jose “Jossi” Fresco Benaim";
const AFFIL = "SomosUno Digital, Madrid, Spain · jossif@gmail.com";
const ORCID = "ORCID 0009-0000-2026-0836";
const DATE = "8 September 2026 · preprint · DOI 10.5281/zenodo.22667466";
const ABSTRACT = `A stripe tile draws each base curve of a Truchet-style square tile as N parallel offset curves that meet every side of the cell at the fixed fractions (k + ½)/N. The equal-subdivision rule that lets such tiles continue across any edge under any rotation or reflection is known from work on generalised Truchet tiles. This note adds two things for the multi-stripe case. First, the natural unit of drawing is not the cell but the band chain, the route one bundle takes from border to border or around a loop; tracing chains rather than cells is what keeps N stripes accounted for consistently, at woven crossings and at the dead ends left by glyphs that use only two sides of their cell. Second, defining each stripe by its position on the chain's entry edge and propagating that position through the corner connectors yields a lateral motion of the whole field: a phase slide with no seam at any edge and an exact return at phase 1, which under mirror symmetry reads as rings radiating from every disc centre. A closed chain always returns a stripe to its own position, since a ribbon along a closed planar curve has a trivial normal bundle; an implementation that reported “Möbius loops” was found to be a tracing error, and the invariant is now a test. Everything is implemented in the open-source generator flowshape, where every figure in this note is a URL that reproduces it.`;

const C = [];
const h = (t) => C.push({ t: "h", text: t });
const p = (...runs) => C.push({ t: "p", runs: runs.map((r) => (typeof r === "string" ? { text: r } : r)) });
const b = (text) => ({ text, bold: true });
const i = (text) => ({ text, italics: true });
const mono = (...lines) => C.push({ t: "mono", lines });
const fig = (files, caption) => C.push({ t: "fig", files, caption });
const table = (widths, header, rows, caption) => C.push({ t: "table", widths, header, rows, caption });
const ref = (text) => C.push({ t: "ref", text });
const URL = (k) => N[k].url;

h("1. Introduction");
p("Truchet's memoir of 1704 asked what happens when one asymmetric tile is dropped into every cell of a grid in a random orientation; Smith's arc variant, two quarter circles joining the midpoints of adjacent sides, turned the answer into a field of wandering curves [1]. The line-and-circle idiom of Bauhaus posters and textiles is, almost without exception, the same object with more stripes: bundles of parallel lines following straight runs and quarter turns on a square grid, meeting at woven crossings, fusing under mirrors into concentric discs. A generator for that idiom needs N-stripe tiles, and building one raises two questions that are engineering-shaped rather than mathematical. What is the right unit of drawing when a tile carries N stripes that continue into its neighbours? And can the stripes be made to move sideways along their bands, so that the field rolls and the discs ripple, without a seam appearing at any cell edge?");
p("The continuity condition itself is settled. Reimann showed that subdividing the sides of a polygon into equal segments lets arcs from adjacent tiles form continuous curves in any orientation [2, 3]; Virolainen stated the rule for stripes explicitly, including stripes that cross, and classified edge segmentations by symmetry [4, 5]; Wendt used the same classification for duotone tiles [6]; Carlson's multi-scale tiles and Mitchell's generalisations use fixed endpoints at thirds of a side [7, 8]. For single strands, Glassner traced bands tile by tile to count and orient them in Celtic knotwork [9], Kaplan and Cohen built each thread as a circular list and drew per thread [10], and Ahmed rendered parallel line bands through Truchet-like tiles and recommended tracking individual lines across tiles rather than drafting more tiles [11]. What that literature does not state is the chain as the carrier of N stripes, or a transverse motion of the stripes within their bands. Those are the two contributions here, together with a cautionary remark on an obstruction that does not exist.");

h("2. Stripe tiles");
p("Take the unit square. A ", b("base curve"), " is either a line between two opposite sides or a ", b("corner connector"), " between two adjacent sides: the quarter arc centred on their shared corner, the chord of that arc, or the elbow through the point at equal distance along both sides. A ", b("glyph"), " is a set of base curves that uses each side at most once. A ", b("stripe tile"), " draws every base curve of its glyph as N offset curves, stripe k meeting each side of the cell at the fraction");
mono("t_k = (k + ½) / N,   k = 0, …, N − 1");
p("along that side. For a line the stripes are parallel lines; for an arc centred on a corner they are concentric arcs with radii t_k; for the chord and the elbow, the corresponding offsets. Smith's tile is the case N = 1 with the two quarter-arc glyphs. Because the set {t_k} is symmetric under t ↦ 1 − t, the crossing positions on a side are the same whichever way the cell and its neighbour are oriented, so any glyph continues into any other across any edge under any of the eight symmetries of the square. That is Reimann's and Virolainen's condition, restated for half-offset positions; we use it as the setting.");
p("The alphabets used here are small: the pipes (two arc glyphs, a horizontal line, a vertical line, and a crossing), arcs only, a single quarter disc, the chamfers and the elbow (which give chevrons and nested diamonds), lines only (hatch), and the knot (arcs and crossings). A crossing draws one band over the other by painting the under-band out with the paper colour along the over-band's centreline, one cell wide, before drawing the over-band; the cut is fixed to the cell, a point we return to. Placements are free, or a seeded m × m block extended by one of three plane groups: pmm (mirrors across both axes, which fuse four quarter discs into a disc), p4m (pmm with the diagonal mirror, where diagonal stripes meet as nested diamonds), or p4 (quarter turns about the supercell centre). Figure 1 shows one seed and one alphabet under the four placements.");
fig(["fig1a-free.png", "fig1b-pmm.png", "fig1c-p4m.png", "fig1d-p4.png"],
  `Figure 1. One seed, the pipes alphabet, N = 3, under free placement (left), pmm, p4m and p4 (right), on a 6 × 6 grid. The free placement has ${f1.chains} chains, ${f1.deadEnds} of whose ends are dead ends inside the field; under pmm there are ${f1b.chains} chains, ${f1b.closed} of them closed loops. Reproduce: ${URL("fig1a-free")} and the same URL with symmetry=1, 2, 3 and repeat=2.`);

h("3. Band chains");
p("Follow a base curve out of its cell through the side it exits, into the neighbouring cell through the facing side, and on. Since every glyph uses each side at most once, the continuation is unique or absent, and the base curves of the whole grid fall into disjoint ", b("band chains"), ": open paths that run from one end to the other, or closed loops. An end is either the border of the frame or a ", b("dead end"), ", a side that the neighbouring glyph does not use; the horizontal and vertical line glyphs leave two sides unused, so alphabets that contain them produce chains that stop inside the field, which is part of the pipes' look (Figure 1, left). Alphabets in which every glyph uses all four sides, such as the arcs alone or the knot, have no dead ends, and every open chain runs border to border (Figure 2).");
p("The claim of this section is that the chain, not the cell, is the unit of drawing. Drawn cell by cell, N stripes are N independent facts per cell that happen to agree at the edges. Drawn chain by chain, a stripe is one object: its position is decided once, on the chain's entry edge, and carried along. That is what makes the lateral motion of Section 4 possible at all, and it is what keeps the crossing consistent, because the over-band and the under-band of a crossing belong to two different chains and are drawn in the order the chains dictate. The tracing is a walk: from every border side of every border cell, walk inward until the border, a dead end, or the start; then, for every base curve not yet visited, walk from it in one direction, and if that walk ends open, walk from it in the other direction too and stitch the two halves, so that a chain met in the middle still runs end to end. A walk is closed exactly when it returns to the segment it started from.");
fig(["fig2-chains.png"],
  `Figure 2. Smith's two arc glyphs with N = 4 on a 5 × 5 grid: the N-stripe Truchet tiling, with every fourth band chain drawn in red to show the unit of drawing. There are ${f2.chains} chains, ${f2.closed} of them a closed loop, the rest running border to border; the alphabet has no dead ends. Reproduce: ${URL("fig2-chains")}`);

h("4. Lateral motion");
p("Let a stripe on a chain be defined by its position λ ∈ (0, 1) on the chain's entry side, measured along that side in a fixed convention (left to right on horizontal sides, top to bottom on vertical ones). Each base curve maps an entry position p to an exit position:");
mono("line:              p ↦ p",
     "corner connector:  p ↦ r or 1 − r,  with r = p or 1 − p,",
     "                   the choice fixed by which end of each side the corner occupies");
p("The map is exact geometry: for an arc centred on the corner, r is the radius, and the arc meets the two sides at distance r from the corner along each. Propagating λ through the chain places every stripe, and because the exit position of one segment is the entry position of the next, on the same edge and in the same convention, the stripe is continuous across every edge of the chain for every λ, not only for λ in the rest set {t_k}. That gives the motion for free: replace t_k by");
mono("λ_k = (t_k + φ) mod 1,   φ the phase");
p(`and every stripe in the field slides sideways along its band by a common amount, with no seam anywhere. Under mirror symmetry the sliding stripes are rings radiating from every disc centre (Figure 3); on the pipes the band appears to roll (Figure 4). Since φ is folded through mod 1 before use, phase 1 is literally the phase-0 expression, and the loop closes byte for byte: the renders at φ = 0 and φ = 1 are identical strings (checked, see Section 6).`);
fig(["fig3a-phase0.png", "fig3b-phase025.png", "fig3c-phase05.png"],
  `Figure 3. The quarter-disc glyph under pmm, N = 8, at φ = 0, 0.25 and 0.5. The stripes slide outward from every disc centre; ${f3.chains} chains, ${f3.closed} of them closed. Reproduce: ${URL("fig3a-phase0")}, then phase=0.25 and phase=0.5.`);
p("Two things go wrong in a naive implementation, and both are worth stating because they are where the seam comes back. First, at λ → 1 a stripe leaves its band at one edge and re-enters at the other; with N stripes over one cycle that is a field-wide jump every 1/N of a cycle. The remedy is to taper a stripe's weight to zero over the outer half-lane on each side of the band, so it fades out on one side and is born thin on the other; at rest the outermost stripes sit exactly at the taper's edge, so the static drawing is unchanged. Second, the cut that hides the under-band at a crossing must be fixed to the cell. Drawn per lane, it slides with the lanes and jumps when a lane wraps, cutting the under-band in a new place. Drawn once per crossing along the over-band's centreline, one cell wide, it covers the same region at rest and no longer depends on φ.");
fig(["fig4a-pipes0.png", "fig4b-pipes03.png"],
  `Figure 4. The pipes alphabet, N = 4, at φ = 0 (left) and φ = 0.3 (right): ${f4.chains} chains, ${f4.deadEnds} dead ends, and every stripe has moved along its band with no seam at any edge. Reproduce: ${URL("fig4a-pipes0")} and the same with phase=0.3.`);

h("5. There is no Möbius obstruction");
p("A first version of the tracer reported closed chains whose round trip composed to p ↦ 1 − p, and held those loops still on the grounds that no consistent shift could exist on them. A referee would object, and the objection is right: a ribbon along a closed curve immersed in the plane has a trivial normal bundle, its normal being the tangent turned by a right angle, so a stripe at transverse position p returns to p after one circuit whatever the loop does. The composition of the maps of Section 4 around any closed chain is therefore the identity, and every loop admits the shift.");
p("The reported loops were an artefact of the walk, and the mechanism is instructive. A chain between two dead ends is never found from the border. The tracer met such a chain at an interior segment, walked in one direction only, and stopped at the dead end; the walk in the other direction, started later from the neighbouring segment, stopped at the first walk's start and was labelled closed. The resulting one-segment “loop” was a single quarter arc, whose map is p ↦ 1 − p. Walking both ways from wherever a chain is met, and defining closed as returning to the start segment, removed every such loop; the two halves were also, before the fix, drawn from their own entry positions, which put a seam between them under motion. The invariant is now a test in the repository: across the ${T.length} alphabet-and-placement cases of Table 1, over three seeds each, every segment lies on exactly one chain, every open chain ends at a border or a dead end, and no closed chain reverses a stripe.");

h("6. Implementation and reproducibility");
p("Stripe tiles are the pattern ", i("bauhaus"), " in flowshape, an open-source, browser-based generator of deterministic patterns [12]. Two properties of that software matter here. The URL is the state: pattern, every parameter, seed and phase are in the address, so each figure caption above is a complete reproduction recipe. And the invariants of this note are tests: determinism, the byte-identical loop at phase 1, and the chain invariant of Section 5 all run in the suite. Every number in this note is produced by a script in the repository (scripts/paper-stripe-tiles.ts) from the same generator, never typed by hand.");
table([1500, 1300, 1200, 1200, 1300, 1400, 1460],
  ["Alphabet", "Placement", "Chains", "Closed", "Dead ends", "Border ends", "Reversing"],
  T.map((r) => [r.motif, r.symmetry, r.chains, r.closed, r.deadEnds, r.borderEnds, r.frozen]),
  `Table 1. Chain statistics on a 10 × 14 grid (cell 60 on a 600 × 840 frame), summed over seeds 1, 7 and 42, for four alphabets under three placements: ${sumChains} chains, ${sumClosed} closed, ${sumDead} dead ends, and ${sumFrozen} closed chains that reverse a stripe. The hatch alphabet, lines only, has no loops; the knot, in which every glyph uses all four sides, has no dead ends.`);
p(`For the state of Figure 3, the largest frame-to-frame change in total drawn ink across one cycle of 200 samples is ${N.fig3_max_frame_ink_change_pct}%, which is the taper of Section 4 doing its work rather than a discontinuity; without the taper, a full-weight stripe moves from one band edge to the other in one frame.`);

h("7. Related work");
p("The prior-art scan that shaped this note is recorded in the repository. In brief: the equal-subdivision continuity condition is stated by Reimann [2, 3], Virolainen [4, 5] and Wendt [6], and used by Carlson [7] and Mitchell [8]; single-strand tracing and per-thread drawing are in Glassner [9] and Kaplan and Cohen [10]; multi-line bands through Truchet-like tiles, with weaving, are in Ahmed [11]; Truchet contours and their parities are in Browne [13]. None of these carries N stripes on a traced chain or moves the stripes transversely, and none treats loops under such a motion, which is the ground this note occupies. The note claims no new mathematics: offset curves, edge matching and the trivial normal bundle of a planar ribbon are all classical. Its contribution is a design rule, a unit of drawing, and a corrected intuition.");

h("Acknowledgements");
p("The generator and this note were developed in collaboration with Claude Fable 5.1 (Anthropic), which drafted code and prose under the author's direction, ran the prior-art scan, and raised the objection that dissolved the Möbius claim of Section 5. Every construction was verified by the author through the repository's test suite; every number was produced by deterministic code, not by the model.");

h("References");
ref("[1] Smith, C. S., and Boucher, P. (1987). The tiling patterns of Sebastien Truchet and the topology of structural hierarchy. Leonardo 20(4), 373–385. https://doi.org/10.2307/1578535");
ref("[2] Reimann, D. A. (2010). Patterns from Archimedean tilings using generalized Truchet tiles decorated with simple Bézier curves. Bridges 2010 Proceedings, 427–430. https://archive.bridgesmathart.org/2010/bridges2010-427.pdf");
ref("[3] Reimann, D. A. (2011). Decorating regular tiles with arcs. Bridges 2011 Proceedings, 581–584. https://archive.bridgesmathart.org/2011/bridges2011-581.pdf");
ref("[4] Virolainen, S. (2017). Random hexagons and other pattern continuities. Proceedings of the XX Generative Art Conference (GA2017), 331–352. https://generativeart.com/GA2017/SeveriVirolainen_longtext.pdf");
ref("[5] Virolainen, S. (2023). Pattern continuity in polygon tessellations. Bridges 2023 Proceedings, 53–60. https://archive.bridgesmathart.org/2023/bridges2023-53.pdf");
ref("[6] Wendt, A. E. (2023). Pattern gradients with generalized duotone Truchet tiles. Bridges 2023 Proceedings, 461–464. https://archive.bridgesmathart.org/2023/bridges2023-461.pdf");
ref("[7] Carlson, C. (2018). Multi-scale Truchet patterns. Bridges 2018 Proceedings, 39–44. https://archive.bridgesmathart.org/2018/bridges2018-39.pdf");
ref("[8] Mitchell, K. (2020). Generalizations of Truchet tiles. Bridges 2020 Proceedings, 191–198. https://archive.bridgesmathart.org/2020/bridges2020-191.pdf");
ref("[9] Glassner, A. (1999–2000). Celtic knotwork, parts 1–3. IEEE Computer Graphics and Applications 19(5), 19(6), 20(1).");
ref("[10] Kaplan, M., and Cohen, E. (2003). Computer generated Celtic design. Proceedings of the 14th Eurographics Workshop on Rendering, 9–19. https://diglib.eg.org/handle/10.2312/EGWR.EGWR03.009-019");
ref("[11] Ahmed, A. G. M. (2014). Line-based rendering with Truchet-like tiles. Proceedings of the Workshop on Computational Aesthetics (CAe '14), 41–51. https://doi.org/10.1145/2630099.2630111");
ref("[12] Fresco Benaim, J. (2026). flowshape: 38 deterministic pattern generators for print-ready and audio-reactive generative art (v1.6.0). Zenodo. https://doi.org/10.5281/zenodo.22659360 (concept DOI 10.5281/zenodo.22180722). Source: https://github.com/Jossifresben/flowshape");
ref("[13] Browne, C. (2008). Truchet curves and surfaces. Computers & Graphics 32(2), 268–281. https://doi.org/10.1016/j.cag.2007.10.001");

// ─── docx emitter ─────────────────────────────────────────────────────────────
const FONT = "Times New Roman", SZ = 24, INDENT = 360, W = 9360;
const run = (r) => new TextRun({ font: FONT, size: SZ, ...r });
const para = (runs, extra = {}) => new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 160, line: 276 }, indent: { firstLine: INDENT }, children: runs.map(run), ...extra });
const BORDER = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
const BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER, insideHorizontal: BORDER, insideVertical: BORDER };
const NONE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NOB = { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE };
const tcell = (text, width, { bold = false, fill = null } = {}) => new TableCell({ borders: BORDERS, width: { size: width, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, shading: fill ? { fill, type: ShadingType.CLEAR } : undefined, children: [new Paragraph({ children: [new TextRun({ text: String(text), font: FONT, size: 20, bold })] })] });
const img = (file, px) => new ImageRun({ type: "png", data: fs.readFileSync(path.join(FIG, file)), transformation: { width: px, height: px } });
const kids = [];
kids.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: TITLE, font: FONT, size: 28, bold: true })] }));
for (const [t, o] of [[AUTHOR, { bold: true }], [AFFIL, {}], [ORCID, {}], [DATE, { italics: true }]]) kids.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: t, font: FONT, size: SZ, ...o })] }));
kids.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
kids.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "Abstract", font: FONT, size: SZ, bold: true })] }));
kids.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 240, line: 276 }, indent: { left: INDENT, right: INDENT }, children: [new TextRun({ text: ABSTRACT, font: FONT, size: 22 })] }));
for (const c of C) {
  if (c.t === "h") kids.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 }, children: [new TextRun({ text: c.text, font: FONT, size: SZ, bold: true })] }));
  else if (c.t === "p") kids.push(para(c.runs));
  else if (c.t === "mono") for (const l of c.lines) kids.push(new Paragraph({ spacing: { after: 60 }, indent: { left: INDENT }, children: [new TextRun({ text: l, font: "Courier New", size: 22 })] }));
  else if (c.t === "fig") {
    const n = c.files.length, px = Math.floor(Math.min(624 / n - 8, 300));
    const cells = c.files.map((f) => new TableCell({ borders: NOB, width: { size: Math.floor(W / n), type: WidthType.DXA }, margins: { top: 40, bottom: 40, left: 40, right: 40 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [img(f, px)] })] }));
    kids.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: c.files.map(() => Math.floor(W / n)), borders: NOB, rows: [new TableRow({ children: cells })] }));
    kids.push(new Paragraph({ spacing: { before: 80, after: 200 }, children: [new TextRun({ text: c.caption, font: FONT, size: 20, italics: true })] }));
  } else if (c.t === "table") {
    const rows = [new TableRow({ tableHeader: true, children: c.header.map((t, k) => tcell(t, c.widths[k], { bold: true, fill: "D9E2F3" })) }), ...c.rows.map((r) => new TableRow({ children: r.map((v, k) => tcell(v, c.widths[k])) }))];
    kids.push(new Table({ width: { size: c.widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: c.widths, borders: BORDERS, rows }));
    kids.push(new Paragraph({ spacing: { before: 80, after: 200 }, children: [new TextRun({ text: c.caption, font: FONT, size: 20, italics: true })] }));
  } else if (c.t === "ref") kids.push(new Paragraph({ spacing: { after: 80 }, indent: { left: INDENT, hanging: INDENT }, children: [new TextRun({ text: c.text, font: FONT, size: 22 })] }));
}
const doc = new Document({ creator: AUTHOR, title: TITLE, sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, children: kids }] });

// ─── markdown emitter ─────────────────────────────────────────────────────────
const md = [];
md.push(`# ${TITLE}\n`, `**${AUTHOR}** — ${AFFIL} — ${ORCID}  \n*${DATE}*\n`, `> Built by \`scripts/paper-stripe-tiles.ts\` (figures, numbers) and a docx-js script (this file and \`stripe-tiles.docx\`) from one content source. Edit neither by hand: change the source and rebuild.\n`, `## Abstract\n`, ABSTRACT + "\n");
const mdRuns = (runs) => runs.map((r) => (r.bold ? `**${r.text}**` : r.italics ? `*${r.text}*` : r.text)).join("");
for (const c of C) {
  if (c.t === "h") md.push(`## ${c.text}\n`);
  else if (c.t === "p") md.push(mdRuns(c.runs) + "\n");
  else if (c.t === "mono") md.push("```\n" + c.lines.join("\n") + "\n```\n");
  else if (c.t === "fig") md.push(c.files.map((f) => `![](figures/${f})`).join(" ") + "\n\n*" + c.caption + "*\n");
  else if (c.t === "table") md.push(`| ${c.header.join(" | ")} |\n|${c.header.map(() => "---").join("|")}|\n` + c.rows.map((r) => `| ${r.join(" | ")} |`).join("\n") + `\n\n*${c.caption}*\n`);
  else if (c.t === "ref") md.push(`- ${c.text}`);
}
fs.writeFileSync(path.join(REPO, "docs/paper/stripe-tiles.md"), md.join("\n"));
// ─── html emitter (for the PDF: print with headless Chrome) ──────────────────
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const hRuns = (runs) => runs.map((r) => (r.bold ? `<b>${esc(r.text)}</b>` : r.italics ? `<i>${esc(r.text)}</i>` : esc(r.text))).join("");
const H = [];
H.push(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(TITLE)}</title><style>
@page { size: Letter; margin: 1in; }
body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.32; color: #000; max-width: 6.5in; margin: 0 auto; }
h1 { font-size: 15pt; text-align: center; margin: 0 0 6pt; }
.meta { text-align: center; margin: 0 0 4pt; } .meta.i { font-style: italic; margin-bottom: 18pt; }
h2 { font-size: 12pt; margin: 18pt 0 6pt; }
p { text-align: justify; text-indent: 0.25in; margin: 0 0 8pt; }
p.abs { text-indent: 0; margin: 0 0.25in 14pt; font-size: 11pt; }
pre { font-family: "Courier New", monospace; font-size: 10.5pt; margin: 0 0 8pt 0.25in; white-space: pre; }
.fig { display: flex; gap: 6pt; justify-content: center; margin: 8pt 0 4pt; page-break-inside: avoid; } .fig img { flex: 1 1 0; min-width: 0; max-width: 100%; }
.cap { font-style: italic; font-size: 10pt; margin: 2pt 0 12pt; text-indent: 0; }
table { border-collapse: collapse; margin: 6pt auto; font-size: 10pt; } th, td { border: 1px solid #999; padding: 3pt 6pt; } th { background: #D9E2F3; }
.ref { font-size: 11pt; margin: 0 0 4pt 0.25in; text-indent: -0.25in; text-align: left; }
</style></head><body>`);
H.push(`<h1>${esc(TITLE)}</h1><div class="meta"><b>${esc(AUTHOR)}</b></div><div class="meta">${esc(AFFIL)}</div><div class="meta">${esc(ORCID)}</div><div class="meta i">${esc(DATE)}</div>`);
H.push(`<h2>Abstract</h2><p class="abs">${esc(ABSTRACT)}</p>`);
for (const c of C) {
  if (c.t === "h") H.push(`<h2>${esc(c.text)}</h2>`);
  else if (c.t === "p") H.push(`<p>${hRuns(c.runs)}</p>`);
  else if (c.t === "mono") H.push(`<pre>${esc(c.lines.join("\n"))}</pre>`);
  else if (c.t === "fig") H.push(`<div class="fig">${c.files.map((f) => `<img src="figures/${f}">`).join("")}</div><p class="cap">${esc(c.caption)}</p>`);
  else if (c.t === "table") H.push(`<table><tr>${c.header.map((x) => `<th>${esc(x)}</th>`).join("")}</tr>${c.rows.map((r) => `<tr>${r.map((v) => `<td>${esc(v)}</td>`).join("")}</tr>`).join("")}</table><p class="cap">${esc(c.caption)}</p>`);
  else if (c.t === "ref") H.push(`<p class="ref">${esc(c.text)}</p>`);
}
H.push(`</body></html>`);
fs.writeFileSync(path.join(REPO, "docs/paper/stripe-tiles.html"), H.join("\n"));

Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(path.join(REPO, "docs/paper/stripe-tiles.docx"), buf); console.log("wrote docx", buf.length, "bytes; md", md.join("\n").length, "chars"); });
