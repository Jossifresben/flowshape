# The poster composer

Export gives you the artwork. The composer gives you the sheet: a generated pattern set into a designed poster — artwork field, title block, parameter table, accent mark — which the user browses rather than edits.

Reached from the playground's **Poster** button, which opens `#/c/<patternId>` in its own window carrying the full playground state.

## The one invariant

**A layout is data, not code.**

A layout is a record naming one mode per region, plus a split point, margins and a legal aspect range. One renderer resolves any such record. A single predicate holds every compositional rule. Nothing outside `src/compose/skeletons.ts` may branch on a layout's id — a test greps for it.

Adding a ninth layout is one record and no other change. If it ever requires touching the renderer, the renderer is wrong.

## The region model

| Region | Holds | Modes |
|---|---|---|
| Artwork field | the pattern | `bleed` · `column` · `plate` · `full` |
| Title block | name + description | `paired` · `stacked` · `split` · `banded` |
| Data block | parameters, form/mode labels | `grid-4` · `label-pair` · `ruled-boxes` · `hidden` |
| Accent mark | the single coloured element | `rule` · `numeral` · `code` · `title` · `ground` · `none` |

Plus a shared decoration layer — four corner crop marks and one vertical caption — toggled per variant and never reimplemented per layout.

### The validator

Most combinations of those modes are invalid. Every rule lives in `validate()` in `src/compose/regions.ts`:

- **At most two grounds per sheet.** An accent ground and a title band are the *same* field, which is what makes the band layout legal with both.
- **Exactly one accent mark**, and it is exclusive.
- `ruled-boxes` implies a `banded` title; `grid-4` needs a paper region, so it cannot coexist with `full` artwork.
- `tinted` presentation needs a bounded bed, and an accent title on an accent band is invisible.
- Cover scale stays in 1.12–1.32 except for column regions, which scale hard on one axis by design.

The eight reference layouts are eight records in that same format. They cost no extra machinery and double as the fixtures proving the validator admits good ones.

## Browsing

Each skeleton is expanded across its free axes — split position, decoration, accent mark — then filtered by the sheet's ratio and re-validated, so a generated combination cannot ship broken. On A3 that gives **68 variants**.

They **round-robin across skeletons** rather than exhausting one before the next. Nested ordering put a layout's own variations adjacent, so the first several steps changed only an accent or a crop mark and browsing read as broken. One pass now shows every distinct layout; refinements come after.

Only layouts that can hold *this pattern's name* are offered, so stepping never lands on a sheet that refuses to render.

## Format drives what is offered

The user picks the paper format upstream in the playground, and most formats are not A3's 1.414 ratio. Two consequences:

1. **Split points are fractions, never pixels.** Reference constants are authored in a 1240 × 1754 space and scaled by the short edge — the same reason `poster/formats.ts` pins the short edge at 600 so a stroke weight reads the same everywhere. That space is a source of numbers, not a canvas.
2. **Each layout declares the ratios it survives.** A 53.8% horizontal split on a square sheet leaves a slab far wider than it is tall and the title/description proportion breaks, so that layout is simply not offered there.

| Sheet | Variants offered |
|---|---|
| A5–A2, Letter, Tabloid, 18×24″, 24×36″, 50×70 | 68 |
| Square, landscape | 20 |

Browsing and format are the same mechanism: the list is a filter over candidates, and ratio is one of the filters.

## Colour

A colorway is twelve steps around the hue circle, sampled directly in OKLCH at fixed lightnesses with hue as the only free variable. Colorway 0 carries the user's own hue and accent offset — it cannot carry their accent *colour*, because the sheet is a lighter ground than the one they tuned the artwork against.

**The accent is sampled twice, because it does two jobs.**

| Role | Sample | Used by |
|---|---|---|
| mark | L 0.50 | `rule`, `numeral`, `code`, accent-coloured `title` |
| ground | L 0.78 | `ground` accent mode, `tinted` presentation |

Both numbers are measured, not chosen. `resolvePalette` — the playground's artwork palette engine — derives its accent relative to *ink*, which is correct for artwork legibility and lands at 0.024–0.040 relative luminance on a poster sheet for every hue. That is a fine dark mark and it fails at both poster jobs: unreadable as a field, indistinguishable from ink as a title colour. L 0.50 clears 4.5:1 against paper for every hue (worst case 4.78; L 0.55 falls to 3.83 and fails). L 0.78 clears the 0.45 tint guard for 9 of 12 hues, and the three that fail are the reds, magentas and violets.

The neutrals carry a small chroma (0.022 / 0.030) that follows the colorway hue, so the whole sheet responds to the control rather than only whichever corner holds the mark. It stays a tint: a monochrome pattern still composes to a monochrome poster.

### Inversion is a palette swap

The artwork is SVG carrying `ink` / `paper` / `accent` role tokens, so presenting it differently means re-emitting the tree in a different palette:

| Presentation | Artwork palette |
|---|---|
| `as-generated` | dark ground, light forms |
| `inverted` | light ground, dark forms |
| `tinted` | forms in the ground's type colour, on the accent field |

No filters, no blend modes, no raster step. The export stays a clean vector file, and `tinted` falls back to `inverted` when the accent is too dark to carry strokes.

## Overflow

Specified, not hoped for. Each rule is a test, run against every variant on six formats in two colorways with awkward payloads — a four-word name, a one-word name, an over-long description, one parameter, none.

| Case | Behaviour |
|---|---|
| Title over 2 lines | step down 8% per attempt, floor at 76 reference px |
| Below the floor | **fail the render** — a truncated poster title is a worse artefact than a refused one, and the browse list drops the layout instead |
| One-word title | one line, never forced to break |
| Description over 140 chars | truncate at the last word boundary, append an ellipsis; never shrink the type |
| Fewer than 4 parameters | keep four columns, leave cells empty; never reflow to three |
| `tinted` on a dark accent | fall back to `inverted` and log |

## Hide text

A checkbox drops every text element and keeps the composition — same split, same grounds, same rules and crop marks, with nothing written on the sheet. A rule is geometry and belongs to the layout; a numeral and a code are text by another name and go with the rest.

## Deliberate deviations

The composer was built from a designer handover written for a raster generator with an authored hex palette. Three of its assumptions do not hold here, and each divergence removed work:

- **The raster path is gone.** Inversion is a palette swap, so the filter/blend/multiply machinery — and the bugs the handover warns about in it — does not exist.
- **Colorways are generated, not tabulated.** The handover's own footnote proposes exactly this; the generated set reproduces its hand-picked pass/fail list for the tint guard.
- **The unit system is two-dimensional**, because the user chooses the format upstream.

Two further deviations are ours and worth naming:

- **Cover regions scale uniformly.** The handover asks for 168% × 112% in the column layout. Stretching a mathematical pattern misreports the maths; a uniform scale with an off-centre position puts the same mass inside the column honestly.
- **The scrim is fixed, not adaptive.** The handover raises its gradient stops by measuring the artwork's mean luminance. That needs a raster pass this pipeline does not have — the artwork stays vector all the way to the file. The stops are set for the worst case instead: strong through the top quarter, where every scrimmed layout puts its type.

Series codes and edition numbers were cut: fake provenance on a free tool reads badly. The accent modes that displayed them render the seed and the form label instead, so nothing on the sheet is invented and no mode was left dead.

## Files

```
src/compose/
  units.ts       reference space → sheet space; unit scale and ratio
  colorways.ts   the OKLCH walk; two accent samples; artwork palettes
  regions.ts     region modes, the Skeleton record, and validate()
  skeletons.ts   the eight reference layouts, as data
  variants.ts    free-axis expansion, ratio filter, round-robin order
  measure.ts     injectable text measurement (canvas in browser, approx in tests)
  text.ts        title fitting, description truncation, value formatting
  data.ts        PosterData built from AppState + PatternDef + language
  render.ts      the one renderer
src/ui/poster.ts the composer view and its DOM-free model
src/content/blurbs.ts  the one-line EN/ES description each poster prints
```
