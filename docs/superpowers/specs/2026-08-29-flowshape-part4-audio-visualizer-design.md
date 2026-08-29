# flowshape.art Part 4 — Audio Visualizer

Date: 2026-08-29 · Status: draft for review · Supplements `2026-08-28-flowshape-design.md`

The user generates a pattern, then feeds it audio — an uploaded file or the microphone — and the pattern moves with the sound. The playing animation on screen is the primary product (fullscreen, VJ-capable); movie export rides on top of the same pipeline. Everything runs client-side; audio never leaves the browser.

Sequencing: this is Part 4. Nothing in this spec touches the Part 3 branch; implementation planning starts after Part 3 lands.

---

## 0. Decisions already settled

- **Live screen first.** The realtime player is the product; export is a capture of it. The deterministic offline exporter is Phase B, not a prerequisite.
- **Stage and movie aspects: 16:9, 9:16, 1:1.** Screen-native, decoupled from the poster format system. Internal canvas resolutions 1920×1080, 1080×1920, 1080×1080.
- **Canvas renderer.** A small adapter interprets the existing `SvgNode` tree into canvas2d. The poster path stays SVG, untouched.
- **All 19 patterns participate.** Continuous per-frame modulation where geometry allows; universal beat-quantized event mode everywhere else. No pattern is excluded.
- **Curated presets, no mod-matrix UI.** Each pattern ships 2–3 named mappings; one master intensity slider. Power routing can come later if ever needed.
- **Monochrome, EN/ES, URL state** — the standing rules apply unchanged. No gradients, no color reactivity.
- **No text overlays on exports.** A 9:16 export is a clean audiogram; captions and titles are Canva's job.

---

## 1. Analysis layer (`src/audio/`)

### Sources

| Source | Path | Notes |
|---|---|---|
| File | drag-drop / picker → `decodeAudioData` → `AudioBufferSourceNode` | mp3, wav, m4a/aac, ogg — whatever the browser decodes. Decode failure → clear bilingual error, no partial state. |
| Mic | `getUserMedia({audio})` → `MediaStreamAudioSourceNode` | Permission denied → message, stage falls back to `phase`-only motion. |

Both feed the same graph: `source → AnalyserNode → destination` (mic is **not** routed to destination — no feedback loop).

### Feature vector, per animation frame

From one `AnalyserNode` (`fftSize` 2048, hop = display frame):

| Feature | Definition | Character |
|---|---|---|
| `bass` | mean magnitude 20–250 Hz | macro structure |
| `mid` | 250–2000 Hz | shape character |
| `high` | 2000–8000 Hz | fine detail |
| `level` | RMS of time-domain buffer | overall intensity |
| `bright` | spectral centroid, normalized | timbre; the voice feature |
| `flux` | positive spectral difference vs previous frame | busyness |

Every feature is normalized to [0, 1] by a slow per-feature auto-gain (running max with ~5 s decay) so a quiet voice memo modulates as fully as a mastered track, then smoothed by an **envelope follower** (attack ≈ 50 ms, release ≈ 400 ms; one-pole: `y += (x − y) · a`, coefficient chosen per direction). Raw FFT frames never touch a parameter — the envelopes are what make motion musical instead of jittery.

### Onsets and tempo

- **File mode:** precomputed at load over the full decoded buffer — spectral flux at hop 512, adaptive median threshold → onset list; tempo by autocorrelation of the flux envelope → beat grid snapped to onsets. Beats are known with lookahead, so event-mode work can be scheduled *before* the downbeat.
- **Mic mode:** realtime flux with adaptive threshold; no lookahead, so event swaps land on onset detection (a frame late — acceptable live).

### Testing

Synthetic signals with known answers: a 100 Hz sine excites `bass` and nothing else; a click train yields onsets at the known times ± 1 hop; silence yields the zero vector; a step input verifies envelope attack/release times.

---

## 2. Mapping layer (`src/anim/mapping.ts`)

A **route** binds one feature to one param:

```ts
interface ModRoute { feature: FeatureKey; param: string; depth: number } // depth ∈ [−1, 1]
```

Per frame, for each route:

```
value = clamp(base + depth · intensity · feature(t) · (max − min))
```

where `base` is the user's slider value from URL state, `intensity` is the single master slider, and `clamp`/rounding reuse the existing `clampParams` semantics per `ParamDef`. The mapping layer needs no per-pattern code — `ParamDef` already declares every knob and its legal range.

### Presets

Each pattern ships 2–3 curated presets — a named set of routes plus an event-mode config (§4). Naming style: "Pulse", "Breathe", "Shatter" (i18n keys, ES parity). Presets are data, not code: a table in `src/anim/presets.ts` reviewed pattern-by-pattern during implementation, tuned by eye against real music and voice.

### Pattern animation metadata

`PatternDef` gains an optional block:

```ts
anim?: {
  continuous?: string[];  // param keys whose visual effect varies continuously — safe to modulate per frame
  usesPhase?: boolean;    // consumes the reserved `phase` param for intrinsic motion
}
```

Patterns with no `anim` block still animate — they get event mode only.

### The `phase` param

A reserved key (added to `RESERVED`), value in [0, 1), injected only for patterns with `usesPhase`. It advances continuously with time (rate scaled by tempo when known) and gives intrinsic motion during silence: harmonograph phase rotation, noise-field drift, rose precession. It also guarantees the stage is never frozen while audio is quiet.

### State

URL additions (all reserved keys): `mode=animate`, `stage` (`169` | `916` | `11`), `apre` (preset id), `aint` (intensity, 0–1). Pattern id, params, and seed stay exactly as they are — an animate URL is a poster URL plus four keys. The audio itself is obviously not in the URL; a shared link opens the stage silent, prompting for a file or mic.

---

## 3. Renderer (`src/anim/canvas-render.ts`)

Interprets an `SvgNode` tree into canvas2d calls. `Path2D` accepts SVG path `d` strings natively, so paths — the bulk of every pattern — translate one-to-one. The adapter covers exactly the node/attribute vocabulary the 19 patterns emit (audit at implementation time: expected `path`, `circle`, `rect`, `line`, `polyline`, `g`; fill, stroke, stroke-width, stroke-linecap, opacity, transform). Anything outside the audited vocabulary throws in dev — silent visual drift between SVG and canvas is the failure mode to fear.

Role tokens (paper/ink) resolve at draw time exactly as the SVG path does, honoring theme.

**Fidelity test:** for each pattern at defaults, rasterize the SVG (Blob → `Image` → canvas) and the adapter output at the same size and pixel-diff; small antialiasing tolerance, structural mismatch fails.

The stage canvas letterboxes inside the pane; internal resolution is fixed per aspect (§0) so display size never changes composition. `generate` already takes arbitrary `{w, h}` — patterns compose into 16:9/9:16/1:1 frames the same way they compose into poster formats.

---

## 4. Engine (`src/anim/engine.ts`)

One `requestAnimationFrame` loop: sample features → apply mapping → `generate(params, seed, size)` → draw.

### Continuous mode

For patterns declaring `continuous` params. Full regeneration per frame is the design — patterns are pure and the analytic curves are a handful of paths, comfortably 60 fps. If a frame's generate+draw exceeds budget, the engine halves to 30 fps before dropping anything (the aesthetic survives 30 fps; stutter does not).

### Event mode (universal)

On each beat, one **event** fires, chosen by the preset: reroll seed, step a structural param, flip a bool, or plain regenerate. The next tree is computed **ahead of the beat** into a double buffer — on the worker for `heavy` patterns, main thread otherwise — and swapped exactly on the downbeat. If compute overruns the beat interval, the swap waits for the next beat; the stage never janks and never shows a half-computed frame. In file mode the beat grid gives real lookahead; in mic mode the swap follows detected onsets.

Continuous and event modes compose: a preset may modulate `strokeWidth` continuously while rerolling the seed every fourth beat.

### Determinism

Given the same feature timeline, animation clock (which drives `phase`), state, and seed, every frame is identical — nothing in the engine calls unseeded randomness or reads wall time directly. Live playback is best-effort real time; the fully deterministic frame-exact path is the Phase B exporter.

---

## 5. Stage UI

Entered from the playground ("Animate" action) with the current pattern/params/seed carried over; leaving restores the poster view. Swiss-minimal chrome that auto-hides in fullscreen:

- Aspect picker (16:9 / 9:16 / 1:1) — switching regenerates, same as poster format changes.
- Source: file drop zone / picker, mic toggle. Privacy line under the drop zone: *"Audio is processed in your browser and never uploaded."* (+ES).
- Transport: play/pause, scrub bar with playhead (file mode only).
- Preset selector (the pattern's 2–3 presets) + master intensity slider.
- Fullscreen, and **Record** (§6).

All labels through the existing i18n table, EN/ES.

---

## 6. Export

### Phase A — capture (MediaRecorder)

Record button captures the live stage: `canvas.captureStream(60)` video + a `MediaStreamAudioDestinationNode` tap of the audio graph, muxed by `MediaRecorder`. Mimetype fallback chain probed with `isTypeSupported`: `mp4; h264,aac` → `webm; vp9,opus` → `webm; vp8,opus`; the resulting container is named honestly in the download. Realtime capture (a 3-minute song records for 3 minutes); recording indicator on the stage; mic-mode recording works identically. Movie resolution = internal stage resolution. Known caveat (spike-verified): browsers pause `requestAnimationFrame` in hidden tabs, so a recording made while the tab is hidden captures frozen video — the Phase B offline exporter is immune.

### Phase B — deterministic export (WebCodecs)

Offline render, file mode only: decode the whole file, precompute the full feature timeline at exact frame timestamps, step the engine frame by frame (no rAF, no dropped frames), encode H.264 via `VideoEncoder` + AAC via `AudioEncoder`, mux with `mp4-muxer`. Faster than realtime for light patterns; same audio + same URL ⇒ byte-identical video. This is the quality path and the flowshape-ethos path; Phase A exists so export ships with the player.

---

## 7. Phase B backlog (specced separately when reached)

- WebCodecs exporter (§6).
- **Scrub-to-freeze:** scrub the timeline, freeze any frame, send that exact param/seed state into the existing poster flow — the bridge from animation back to print.
- **Audio portrait:** whole-file features (onset density, spectral histogram, dynamics arc) mapped once to generate a *static* poster from a song. Printable; feeds the existing export pipeline.

## Non-goals

No WebGL. No color/gradient reactivity. No text overlays. No timeline/keyframe editor. No backend, no audio upload. No MIDI input. No auto-rotating stage aspects.

---

## 8. Testing summary

| Layer | Test |
|---|---|
| Features | synthetic signals with known answers (§1) |
| Envelopes | step response matches attack/release constants |
| Onsets | click train at known BPM → grid within tolerance |
| Mapping | clamping honors `ParamDef`; same feature timeline ⇒ identical params |
| Renderer | SVG-vs-canvas pixel diff per pattern; unknown node/attr throws |
| Engine | seeded run over a recorded feature timeline ⇒ identical trees per frame; event swaps land on grid |
| Export A | smoke: recording produced, has audio + video tracks, duration within tolerance |
