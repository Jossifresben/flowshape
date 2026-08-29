# Handover — flowshape Part 4 (Audio Visualizer)

Date: 2026-08-29 · From: brainstorm/spec/plan/spike session · For: the orchestrating agent in a fresh session. Self-contained; assumes no prior conversation context.

## What this is

flowshape.art (repo `shapeit`) is getting a Part 4: a live audio-reactive animation mode — the user's generative pattern moves with an uploaded audio file or the mic on a 16:9 / 9:16 / 1:1 canvas stage, with movie capture. The feature is fully specced, planned, and de-risked by a working spike. **Nothing is pushed anywhere; all work is in local branches.**

## Branch map (verified 2026-08-29 ~13:20; re-verify with `git log --oneline <branch>` before acting)

| Branch | State |
|---|---|
| `main` | Parts 1–3 core + mobile responsive (`57d06f2`). 21 patterns. Does **not** contain the Part 4 docs. |
| `feat/part3-export-v2` | **Active — another session is committing here right now.** Checked out in the main working tree, with uncommitted work in progress (`isoweave` pattern, gallery/index edits). Carries the math explainer, bilingual explanations for all patterns, three new patterns (interlace, nested, tumbling), and — merged in at `042fde2` — the Part 4 spec + plan. **Do not commit, rebase, or check out anything else here.** |
| `spike/audio-anim` | Throwaway but working exploration, through `25d6a8f`. Never merge to main as-is. |
| `docs/part4-audio-visualizer-spec` | **Gone** — merged into `feat/part3-export-v2` and deleted. Don't look for it. |

## Source-of-truth documents (now on `feat/part3-export-v2`)

- **Spec:** `docs/superpowers/specs/2026-08-29-flowshape-part4-audio-visualizer-design.md` — user-approved. Settled decisions (do NOT re-litigate): live screen is the product, export is a capture of it (MediaRecorder Phase A, WebCodecs deterministic MP4 Phase B); stage/movie aspects 16:9, 9:16, 1:1; canvas renderer via SvgNode→canvas2d adapter; all 19 patterns animate (continuous routes + universal beat-event mode); curated presets, no mod-matrix UI; no text overlays on exports ever; EN/ES parity; audio never leaves the browser.
- **Plan:** `docs/superpowers/plans/2026-08-29-flowshape-part4-audio-visualizer.md` — 15 bite-sized TDD tasks with complete code, written against post-Part-3 interfaces. Execute with superpowers:subagent-driven-development (preferred) or superpowers:executing-plans, in a worktree branch `feat/part4-audio-visualizer` off main **after** the in-flight Part 3 work merges. The plan already incorporates all spike findings — read its "Spike findings" section first.

### ⚠ Known plan drift — fix before executing Task 8

The plan was written when the registry held **19** patterns; `feat/part3-export-v2` now has **24** (added: `interlace`, `nested`, `tumbling`, plus an in-progress `isoweave`). Task 8 enumerates patterns by name for their `anim` metadata, and its validation test asserts *every registered pattern* has at least one preset — so it will fail on the newcomers until they are added. When the Part 3 work lands, re-read the registry, extend Task 8's table and `src/anim/presets.ts` with the new patterns (all four are discrete/tiling-family → give them beat-event presets, `reseed` if `usesSeed` is true, otherwise `step` on their most structural int param), and update every "19 patterns" reference in spec and plan to the real count. Nothing else in the plan depends on the count.

## The spike (branch `spike/audio-anim`)

Two DEV-only pages validating feel and cost before the 15-task build:

- `#/spike/smooth` — harmonograph, per-frame regeneration with envelope-smoothed features. Routes: bass→opacity, bass→(−)damping (figure "rings out" on kicks), mid→detune, high→strokeWidth, level→scale, slow phase rotation. Sliders: intensity, attack/release ms, duration, seed.
- `#/spike/beat` — voronoi/truchet/voxel, reseed on live-detected onsets, /1 /2 /4 divisors, sensitivity slider.
- Both: COLOR checkbox (spectral centroid→OKLCH hue 250°→30°, level→chroma so silence decays to monochrome ink; flat color, no gradients); meters for all six features; fps/gen-ms readouts.
- Audio sources: TEST plays the committed repo sample `public/samples/rhy-2b.mp3` (RHY-2B — the user's own track, 30 s, 3 s fade-out, 192 kbps; publishing it in the open repo was explicitly approved), synthetic 120 BPM loop as fallback; FILE picker (auto-trims to 20 s); MIC (blocked in the in-app preview pane; works in a normal browser).

**To run it:** `git worktree add <dir> spike/audio-anim`, symlink `node_modules` from the main checkout into the worktree (`node_modules/` gitignore doesn't match symlinks — never `git add` it), then `npm --prefix <dir> run dev -- --port 5199 --strictPort`. The previous session's `spike` entry in `.claude/launch.json` was removed (it pointed at a dead scratchpad path); re-add one pointing at the new worktree if using the preview pane.

## Spike findings (all already folded into spec/plan — listed so nobody re-discovers them)

1. Onset detection must consume **raw pre-envelope flux**; enveloped flux stalls the adaptive threshold.
2. Band auto-gain must be **per-band with a shared floor** (10% of global max). One shared gain starves mid/high ("it only picks the bass" — user-confirmed against real music); naive per-band amplifies empty-band leakage.
3. Harmonograph full regeneration ≈ 3.5 ms/frame at 24k points — 60 fps in plain SVG. Canvas stays (export + dense patterns) but could be demoted to export-only if Task 14 needs slimming.
4. Event mode costs 2–11 ms per swap — trivial.
5. Live onsets fire on every transient (hi-hats → ~2× tempo). Correct for mic mode; file mode must use the precomputed beat grid (spec §1/§4 already says so).
6. Hidden-tab rAF pause freezes MediaRecorder capture (spec §6 caveat; Phase B offline exporter immune).

## Immediate next steps, in order

1. **Get the user's spike verdict** — the open item. Specifically: attack/release feel (50/400 ms defaults), /1 vs /2 beat aesthetics, and whether COLOR survives his eye (if yes it becomes an opt-in preset flavor; defaults stay monochrome — that's a settled product rule).
2. Adjust the plan if the verdict demands it (e.g., SVG-first live stage, tuned envelope defaults, color routes as a preset flavor).
3. Wait for `feat/part3-export-v2` (explainer, code view, new patterns) to land on main.
4. Reconcile the pattern-count drift above against the merged registry.
5. Execute the plan task-by-task on `feat/part4-audio-visualizer` off fresh main. Delete the spike branch once the real feature supersedes it (keep `public/samples/rhy-2b.mp3` — re-commit it on the feature branch for the stage's demo track).

## Housekeeping note

This handover lives at `docs/superpowers/2026-08-29-part4-handover.md` as an **untracked file** in the main working tree. It was deliberately not committed: the only sensible branch for it (`feat/part3-export-v2`) is being actively committed to by another session, and committing across that would risk sweeping up its in-progress `isoweave` work. Commit it wherever it belongs once that branch settles, or just read and discard it.

## Standing rules (from the user's global instructions — non-negotiable)

- **Never `git push`, merge to main, tag, or deploy without his explicit say-so in that message.** Commit locally, stop, ask.
- He calls himself **Hermes**; terse replies; lead with the action; he tests in his own browser — no unsolicited screenshots.
- Settled product decisions live in the spec and in the project memory (`flowshape-product-decisions`); re-litigating them annoys him.
- macOS TCC blocks the terminal from `~/Library/Mobile Documents` (iCloud Drive) — for files there, hand him a one-line `cp` command to run instead of retrying.
