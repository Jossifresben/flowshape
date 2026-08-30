# The animated stage (audio visualizer)

> **Status: in development.** Specced, planned, and de-risked by a working
> spike; the analysis layer (`src/audio/`) is built and tested. It is **not** on
> `main` yet and not live on flowshape.art. This document describes the approved
> design; where it and the shipped code eventually disagree, the code is right.

Take any pattern you have tuned, feed it audio — a dropped file or the
microphone — and it moves with the sound. The live screen is the product;
movie export is a capture of that same pipeline. Everything runs in the
browser: **audio is never uploaded**, because there is nowhere to upload it to.

## How it works

```
 file / mic ──▶ AnalyserNode ──▶ features ──▶ envelopes ──▶ mapping ──┐
                                    │                                 │
                              onsets & tempo ──▶ beat grid ──▶ events ─┤
                                                                      ▼
                                          generate(params, seed, size) → SvgNode
                                                                      │
                                                        canvas2d adapter → stage
                                                                      │
                                                          capture / encode → movie
```

### 1. Analysis — `src/audio/`

Six features per animation frame, from a single `AnalyserNode` at `fftSize`
2048:

| Feature | Definition | What it carries |
|---|---|---|
| `bass` | mean magnitude, 20–250 Hz | macro structure |
| `mid` | 250–2000 Hz | shape character |
| `high` | 2000–8000 Hz | fine detail |
| `level` | RMS of the time-domain buffer | overall intensity |
| `bright` | normalised spectral centroid | timbre — the "voice" feature |
| `flux` | positive spectral difference vs the previous frame | busyness |

Each is normalised to [0, 1] by a slow per-feature auto-gain (running max,
~5 s decay) so a quiet voice memo modulates as fully as a mastered track, then
smoothed by a one-pole envelope follower (attack ≈ 50 ms, release ≈ 400 ms).
**Raw FFT frames never reach a parameter** — the envelopes are what make the
motion musical instead of jittery.

Two findings from the spike are load-bearing here: onset detection must consume
*raw pre-envelope* flux (enveloped flux stalls the adaptive threshold), and
auto-gain must be *per band with a shared floor* — one shared gain starves mid
and high, so the visual "only picks up the bass".

Onsets and tempo differ by source. In **file mode** they are precomputed over
the whole decoded buffer (spectral flux at hop 512, adaptive median threshold,
tempo by autocorrelation of the flux envelope) — so beats are known *ahead of
time* and work can be scheduled before the downbeat. In **mic mode** detection
is realtime with no lookahead, and swaps land a frame late, which is acceptable
live.

### 2. Mapping — `src/anim/mapping.ts`

A route binds one feature to one parameter:

```ts
interface ModRoute { feature: FeatureKey; param: string; depth: number } // depth ∈ [−1, 1]
```

Per frame, per route:

```
value = clamp(base + depth · intensity · feature(t) · (max − min))
```

`base` is your slider value from URL state, `intensity` is a single master
slider, and clamping reuses the existing `clampParams` semantics. The mapping
layer needs **no per-pattern code** — `ParamDef` already declares every knob and
its legal range.

There is no modulation-matrix UI. Each pattern ships 2–3 curated, named presets
("Pulse", "Breathe", "Shatter"), tuned by eye against real music, as data in
`src/anim/presets.ts`.

### 3. Pattern participation

All 30 patterns animate. `PatternDef` gains an optional block:

```ts
anim?: {
  continuous?: string[];  // params whose visual effect varies continuously — safe per frame
  usesPhase?: boolean;    // consumes the reserved `phase` param for intrinsic motion
}
```

- **Continuous mode** regenerates the pattern every frame with modulated
  parameters. Full regeneration is the design, not a compromise: generators are
  pure and cheap (the harmonograph measures ≈ 3.5 ms/frame at 24k points).
- **Event mode** is universal and works for every pattern, including discrete
  tilings with nothing continuous to modulate. On each beat one event fires —
  reroll the seed, step a structural parameter, flip a boolean. The next tree is
  computed *ahead of the beat* into a double buffer and swapped exactly on the
  downbeat; if compute overruns, the swap waits for the next beat rather than
  janking.
- The reserved **`phase`** parameter (in [0, 1), tempo-scaled) gives intrinsic
  motion during silence, so the stage is never frozen.

The two modes compose: a preset may modulate `strokeWidth` continuously while
rerolling the seed every fourth beat.

### 4. Renderer — `src/anim/canvas-render.ts`

A small adapter interprets the existing `SvgNode` tree into canvas2d calls;
`Path2D` accepts SVG `d` strings natively, so paths translate one to one. **The
poster path stays pure SVG and is untouched.** The adapter covers exactly the
node and attribute vocabulary the patterns emit and throws in development on
anything outside it — silent visual drift between the SVG and the canvas is the
failure mode worth fearing, so a per-pattern pixel-diff test compares the two.

Stage aspects are 16:9, 9:16 and 1:1 at fixed internal resolutions
(1920×1080, 1080×1920, 1080×1080), decoupled from the poster format system, so
display size never changes composition.

### 5. Export

- **Phase A — capture.** `canvas.captureStream(60)` plus a
  `MediaStreamAudioDestinationNode` tap, muxed by `MediaRecorder`, probing
  `mp4 h264/aac → webm vp9/opus → webm vp8/opus` and naming the container
  honestly. Realtime: a three-minute track records for three minutes. Known
  caveat — browsers pause `requestAnimationFrame` in hidden tabs, so a recording
  made behind another tab captures frozen video.
- **Phase B — deterministic export.** Offline, file mode only: decode the whole
  file, precompute the feature timeline at exact frame timestamps, step the
  engine frame by frame with no `rAF` and no dropped frames, encode H.264 and
  AAC through WebCodecs and mux to MP4. Same audio + same URL ⇒ byte-identical
  video. This is the path that matches the rest of the project's determinism.

## The colour exception

Colour and gradients are permitted **on the animated stage, and only there** —
a decision taken on 2026-08-29 after the spike, superseding the spec's original
"no gradients, no colour reactivity". Audio-reactive colour maps spectral
centroid to hue and level to chroma in OKLCH, so silence decays back to
monochrome ink.

**The poster path is untouched: flat colours, no gradients, monochrome by
default.** A moving screen and a printed sheet are different media and no longer
share that constraint. Colour still resolves through the same
`paper`/`ink`/`accent` role tokens, so the contrast guarantee that keeps a
poster legible keeps the stage legible too. Monochrome remains the stage
default; colour arrives through a preset, never automatically.

## State

An animate URL is a poster URL plus four reserved keys: `mode=animate`,
`stage` (`169` | `916` | `11`), `apre` (preset id) and `aint` (intensity).
Pattern id, parameters and seed are unchanged. The audio is obviously not in the
URL — a shared link opens the stage silent and asks for a file or the mic.

## Non-goals

No WebGL. No text overlays on exports (a 9:16 export is a clean audiogram;
captions are Canva's job). No timeline or keyframe editor. No MIDI. No backend,
and no audio upload, ever.
