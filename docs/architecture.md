# Architecture

Vanilla TypeScript, Vite, SVG. No framework, no state library, no backend.
About 5,000 lines of source. The constraints below are what keep it that small.

## The shape of the app

```
                    ┌──────────────┐
  location.hash ───▶│  url-state   │──▶ AppState ──┐
                    └──────────────┘               │
                                                   ▼
  ┌──────────┐   pattern id    ┌──────────────────────────┐
  │ gallery  │────────────────▶│        playground        │
  └──────────┘                 │  controls · stage · tabs │
                               └────────────┬─────────────┘
                                            │ generateSafe(def, params, seed, size)
                                            ▼
                    ┌───────────────────────────────────────┐
                    │  registry → pattern module → SvgNode  │
                    │  (main thread, or compute.worker)     │
                    └───────────────────┬───────────────────┘
                                        │ SvgNode + Palette
                     ┌──────────────────┴──────────────────┐
                     ▼                                     ▼
              serialize() → DOM                  export → .svg / .png
```

`src/main.ts` is the whole router: if the hash decodes to a state, mount the
playground; otherwise mount the gallery. It owns view teardown, because the
playground registers its own `hashchange` listener.

## The pattern contract

```ts
interface PatternDef {
  id: string;              // stable, appears in URLs — never rename
  family: 'points' | 'curves' | 'fields' | 'tilings' | 'growth' | 'isometric';
  phase: 1 | 2;
  heavy: boolean;          // true ⇒ generate in a Web Worker
  params: ParamDef[];      // key, kind, min, max, step, default, i18n label
  usesSeed?: boolean;      // shows the seed control
  anim?: { continuous?: string[]; usesPhase?: boolean };
  generate(params: Params, seed: number, size: Size): SvgNode;
}
```

Four rules make everything else possible:

1. **`generate` is pure and deterministic.** Same `(params, seed, size)` ⇒
   identical tree. No `Math.random`, no `Date`, no ambient state. Randomness
   comes from `mulberry32(deriveSeed(seed, 'subsystem'))` in `core/prng`, so
   two independent random streams inside one pattern never interfere.
2. **Output is data, not DOM.** `SvgNode` is a plain `{ tag, attrs, children }`
   tree. It can be built in a worker, serialised to a string, snapshotted in a
   test, or handed to the export path — none of which need a document.
3. **Colours are roles.** Generators emit `ink`, `paper` and `accent`, never hex.
   `resolvePalette` turns four OKLCH controls into concrete colours at render
   time, so any palette applies to every pattern for free.
4. **The viewBox is normalised.** The short edge is fixed at 600 user units and
   the long edge follows the chosen paper ratio, so a stroke width of 0.4 means
   the same visual weight on A5 and on 24×36″.

`definePattern` enforces what it can at registration: duplicate ids, params
colliding with reserved URL keys, and `anim.continuous` entries that are not
numeric params all throw at import time rather than failing silently later.

## Running a pattern

`generateSafe()` is the only sanctioned entry point. It fills in defaults,
clamps every value into its declared range (URLs are user input), rounds ints,
strips the injected `size` param, calls `generate`, and wraps the result with a
`paper` background rect and the scaling transform. Nothing else should call
`def.generate` directly.

Heavy patterns are generated in `workers/compute.worker.ts`; the UI keeps
showing the previous result until the new tree arrives.

## Colour

`core/oklch.ts` converts OKLCH to sRGB hex with proper chroma-reduction gamut
mapping. `poster/palettes.ts` derives the three roles from four controls —
hue, chroma, paper lightness, accent shift — with the ink lightness formula
tuned so the paper/ink luminance gap clears a guaranteed floor across the whole
control space. That guarantee is asserted by a brute-force sweep in
`tests/poster/palettes.test.ts`; changing the constants without re-running it
will silently produce unreadable palettes somewhere in the range.

Flat colours only. No gradients, filters, blurs or shadows anywhere.

## Formats and export

`poster/formats.ts` holds the paper presets (ISO A5–A2, US Letter/Tabloid/
18×24″/24×36″, 1:1, 50×70 cm, plus custom W×H in mm/cm/in) and converts a
physical size into a render size. Presets never auto-rotate.

`poster/export.ts` serialises the node tree to a standalone SVG document
carrying real `mm` dimensions — so it opens at the right physical size in a
design tool — and rasterises the same string through an offscreen canvas for
PNG at a chosen DPI.

## Content

Each pattern has `src/content/explain/<id>.<en|es>.md`: YAML front matter with
`source` and `url`, then the formula, a plain-language explanation, and
per-parameter notes. `src/content/source.ts` exposes each generator's own
source text through Vite's `?raw` glob, lazily, so the *Code* tab shows the
real module and costs nothing until opened.

## Build

`npm run build` runs `tsc --noEmit`, regenerates every gallery thumbnail by
running the real generators headlessly (`scripts/build-thumbs.ts`), and bundles
with Vite. Thumbnails are committed so `npm run dev` works without a prior
build. Output is a static folder; there is nothing to configure and nothing to
deploy but files.

## The animated stage (in development)

Part 4 adds an audio-reactive mode: the same generators, driven per frame by
features extracted from a file or the microphone, drawn to canvas2d by an
adapter over the same `SvgNode` tree, with movie capture on top. The analysis
layer (`src/audio/`) is built and tested; the stage itself is not on `main`.

It reuses everything above rather than forking it — `ParamDef` already declares
every knob and its legal range, so the mapping layer needs no per-pattern code,
and `generate` already accepts an arbitrary `{w, h}`, so a pattern composes into
a 16:9 stage exactly as it composes into A3.

One rule is relaxed there and only there: **colour and gradients are permitted
on the animated stage**, resolved through the same OKLCH role tokens so the
contrast guarantee carries over. The poster path is unchanged — flat colours,
no gradients, monochrome by default.

Full design: [audio-visualizer.md](audio-visualizer.md).

## Deliberate non-goals

- **No in-house poster editor.** Element-level editing is delegated to Figma,
  Illustrator, Inkscape or Canva via the SVG export.
- **No accounts and no backend.** The URL is the save file.
- **No canvas in the poster path.** Vector in, vector out.
- **No file over ~400 lines.** One concern per module; split before it grows.
