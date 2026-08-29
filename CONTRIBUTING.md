# Contributing

Issues and pull requests are welcome. Start by reading
[docs/architecture.md](docs/architecture.md) — the constraints there are load-
bearing, and a change that breaks one of them will not be merged even if it
looks better.

## Setup

```bash
npm install
npm run dev
npm test
```

`npm test` must pass before a pull request. It includes deterministic snapshots
of every pattern's output; if a snapshot changes, that is a real behavioural
change and needs to be explained in the PR, not silently re-recorded.

## The non-negotiables

- **Determinism.** No `Math.random`, no `Date`, no ambient state inside a
  generator. Same URL ⇒ byte-identical SVG.
- **Pure SVG.** No canvas in the poster path, no raster steps, no gradients,
  no filters, no blur, no drop shadows.
- **Colour roles.** Generators emit `ink` / `paper` / `accent`, never literal
  colours.
- **URL compatibility.** Pattern ids and parameter keys are permanent; renaming
  one breaks every link already shared. Changes that alter existing output bump
  the schema version.
- **Bilingual.** Anything user-facing ships in English *and* Spanish. A pattern
  without both `explain` documents fails the test suite.
- **No file over ~400 lines.** Split before it grows.

## Adding a pattern

The full checklist is in [docs/patterns.md](docs/patterns.md#adding-a-pattern):
generator, registration, preset, test, bilingual explanation with a real
citation, regenerated thumbnail.

A pattern is judged on line craft, not novelty. Hairline strokes with
`vector-effect="non-scaling-stroke"`; commit to either an ultra-fine monochrome
field or bold flat fills, never the tentative middle; depth from genuine
occlusion or from stroke weight, never from alpha-blended hidden geometry.

## Code style

Match the surrounding code. Comments explain *why* a constant or an approach was
chosen — especially when a simpler-looking alternative is wrong; several of the
existing comments record exactly that, and they are worth reading before
"simplifying" the line above them.

## Licence

Contributions are accepted under the [MIT licence](LICENSE) of this project.
