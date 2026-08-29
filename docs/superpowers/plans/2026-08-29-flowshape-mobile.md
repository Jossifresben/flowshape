# flowshape.art — Mobile Responsive Layout

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The gallery and the playground are usable on a real phone: no invisible artwork, no clipped text, no hidden horizontal scroll, and every button/chip/slider/checkbox meets the 44px touch-target guidance already implicit in this codebase's own controls. This is the item Part 1's kickoff list flagged and deferred to "Part 4: responsive layout (panel is fixed 320px — unusable at phone widths)" — this plan is that fix, scoped narrowly.

**What was verified, concretely, at HEAD `f8c7dfc` on branch `feat/part3-export-v2`:**

- `src/style.css` has zero `@media` rules (98 lines total, confirmed by `grep -n "@media" src/style.css` returning nothing).
- **The earlier review's hypothesis is confirmed and is worse than stated at narrower widths.** At 375×812 (`mobile` preset): `.stage` is 55px wide, `.panel` holds its full 320px, the rendered `<svg>` measures **55×77px** — the artwork is not "essentially invisible", it is functionally gone. At 320×690 (small phone): `.stage` width is **0px** — the fixed panel consumes the entire viewport and the artwork disappears completely. At 430×932 (large phone): `.stage` is 110px. At 600×900 the split is already tolerable (280/320). At 768×1024 (tablet) the existing desktop-style split works well (448/320) and needs no change.
- **A second, independent bug**, not in the original hypothesis: on the gallery hero, `.gal-hero-top` (`display:flex; justify-content:space-between`) never wraps, so `.gal-stats` ("21 PATTERNS · 6 FAMILIES", `white-space:nowrap`) is pushed off the right edge below ~610px width (confirmed: overflows at 500px, does not overflow at 640px). It does not create a document-level horizontal scrollbar — instead `#app.view-gallery`'s `overflow-y: auto` causes the browser to compute `overflow-x: auto` on the same element too (a CSS quirk: setting only one axis to a value other than `visible` forces the other to `auto` when it would otherwise be `visible`), so the text is silently clipped inside its own nested scroll region. Confirmed via `getComputedStyle`: `.view-gallery` has `overflow-x: auto` despite the rule only setting `overflow-y`.
- **No document-level horizontal scroll exists anywhere tested** — `document.documentElement.scrollWidth === clientWidth` held at 320, 375, 430, 600, 640, 660, and 768px on both routes. The failure mode here is squeeze-and-clip, not classic horizontal overflow.
- **Touch targets**, measured with `getBoundingClientRect()`: `.gal-chip` 28px tall, `.btn` 32px, `.ctl-select` 31px, `.gal-back-link` 14px, `input[type=checkbox]` 13×13px, `input[type=range]` 16px tall track. All below the 44px guidance. The gallery card grid itself is fine — `auto-fill, minmax(220px, 1fr)` correctly collapses to 1 column at phone widths with 311×438px cards, well above any tap-target minimum.
- `index.html` already has a correct `<meta name="viewport" content="width=device-width, initial-scale=1.0">` — no change needed there.
- **No modal exists on this branch.** `src/ui/modal.ts` is not present; `find src -type f` confirms it. The Part 3 export plan's Task 7 will add it later, on top of `.modal { width: min(760px, 92vw); max-height: 86vh; }`, which is already viewport-relative. When that lands, its buttons/tabs should get the same `pointer: coarse` treatment this plan introduces (Task 3) — not addressed here because the file does not exist yet.
- `diffgrowth` is the only pattern flagged `heavy` (confirmed: `grep -l "heavy: true" src/patterns/*.ts` → only `diffgrowth.ts`, following Part 3 Task 1's recalibration on this same branch). When a heavy pattern recomputes, `fillStage()` in `src/ui/playground.ts` dims the *existing* artwork (`.stage.computing { opacity: 0.55 }`) rather than blanking it — this already gives a phone user something to look at during a slow recompute, and the design below preserves it unchanged.

**The interaction design for phones:** artwork and controls competing for one small screen is the actual product problem here — this is a tool whose entire point is "move a slider, watch the shape change." Two options were considered:

1. *Bottom sheet* (drag handle, artwork full-bleed underneath, sheet snaps between peek/half/full). Correct instinct for a "creative tool," but needs real drag-gesture code (pointer capture, velocity/snap points, focus management) — a second UI subsystem for a codebase that currently has none, for a fix that should be "a few `@media` rules."
2. *Sticky stage above, panel below in normal document flow.* The stage pins to the top of the viewport at a fixed height (45dvh, with a vh fallback); the panel — which already has `overflow-y: auto` from the desktop rule, now simply inert since it no longer needs its own scroll region — flows beneath it and the *page* scrolls. Dragging any slider updates the pinned stage above without the user's thumb ever leaving the control it's on. No drag gesture, no snap-point state machine, three CSS declarations change behaviour that used to require flexbox height:100vh.

**Option 2 is what this plan builds.** It satisfies "tune a parameter, watch the artwork change" — the artwork is always on screen, pinned, while the controls scroll under the user's thumb — without adding interaction complexity disproportionate to a CSS-only bug. It composes for free with the existing `computing` dim-instead-of-blank behaviour: the pinned stage stays visible and legibly dimmed while `diffgrowth` recomputes on a phone CPU slower than this Mac's.

**Architecture:** Two independent CSS concerns get two independent media features, deliberately not conflated:
- **Layout** (stage/panel split, hero wrapping) is a *viewport-width* question → `@media (max-width: 640px)`. 640px was chosen empirically: it's the width at which stage and panel are equal (320px each) if split down the middle, the narrowest split that still reads as "two columns" (confirmed acceptable at 600px in testing); everything narrower collapses to the stacked layout.
- **Touch-target sizing** is a *pointer-precision* question, not a width question — an iPad in landscape at 1024px is still a touch device, and a narrow desktop browser window is still driven by a mouse → `@media (pointer: coarse)`. This is why desktop is untouched by this plan: nothing here fires without a coarse pointer, so mouse users see zero visual change.

**Tech Stack:** unchanged — Vite, TypeScript strict, vitest, plain DOM, SVG. No new dependencies. (Note: this repo has no DOM test environment installed — `package.json` has no `jsdom`/`happy-dom` — so the existing `tests/ui/*.test.ts` files test pure data exports, never call `document.createElement`. This plan follows that same constraint: see the honesty note in Task 3.)

**Conventions:** repo root `/Users/jfresco16/Google Drive/Claude/shapeit`. This plan touches only `src/style.css` and `src/ui/controls.ts` — no pattern module, no URL-state, no export/format code — so it does not conflict with the in-flight `feat/part3-export-v2` work and can be branched, executed and merged independently of it. Commit after each task with the message given. **Never `git push`, merge to `main`, or tag a release** — Hermes authorizes each of those explicitly, per message.

- [ ] **Step 0: Branch**

Run: `git checkout -b feat/mobile-responsive` (from whatever the current branch is at execution time — check `git status` first; if the tree is not clean, stop and report rather than branching over someone else's in-progress work).

---

### Task 1: Fix the two pre-existing layout bugs

**Files:** Modify `src/style.css`

These two are bugs regardless of screen size — worth isolating in their own commit before the mobile-specific work.

- [ ] **Step 1: Stop `.view-gallery` from silently clipping its own hero row**

`overflow-y: auto` alone causes the browser to compute `overflow-x` as `auto` too (per the CSS Overflow spec's same-axis rule), which is what's hiding `.gal-stats` instead of visibly overflowing it. Make the horizontal axis explicit so this can never silently reappear elsewhere in the page:

In `src/style.css`, find:

```css
#app.view-playground { display: flex; height: 100vh; }
#app.view-gallery { display: block; min-height: 100vh; overflow-y: auto; }
```

Replace with:

```css
#app.view-playground { display: flex; height: 100vh; }
#app.view-gallery { display: block; min-height: 100vh; overflow-y: auto; overflow-x: hidden; }
```

- [ ] **Step 2: Let the hero stats drop below the headline instead of overflowing**

Append to the end of `src/style.css`:

```css

/* --- mobile: layout (viewport-width dependent) --- */

@media (max-width: 640px) {
  .gal-hero-top { flex-direction: column; align-items: flex-start; gap: 8px; }
}
```

- [ ] **Step 3: Verify in the browser**

Resize to 375×812 and 500×900 (`resize_window`), reload, navigate to `/#/`. Confirm `document.querySelector('.gal-stats').getBoundingClientRect().right <= window.innerWidth` (it was `503.6` at 500px width before this fix — must now be `<= 500`). Confirm `getComputedStyle(document.querySelector('#app')).overflowX === 'hidden'`.

- [ ] **Step 4: Commit**

```bash
git add src/style.css && git commit -m "fix: hero stats no longer overflow the viewport at narrow widths"
```

---

### Task 2: Stack the playground below 640px — sticky stage, flowing panel

**Files:** Modify `src/style.css`

- [ ] **Step 1: Add the stacked layout**

Append inside the same `@media (max-width: 640px)` block from Task 1 (do not open a second block — keep all width-based rules together):

```css
  #app.view-playground { flex-direction: column; height: auto; min-height: 100vh; }
  .stage {
    flex: none;
    width: 100%;
    height: 45vh;
    height: 45dvh;
    min-height: 220px;
    position: sticky;
    top: 0;
    z-index: 1;
  }
  .panel { width: 100%; border-left: none; border-top: 1px solid var(--line); }
```

So the full block now reads:

```css
@media (max-width: 640px) {
  .gal-hero-top { flex-direction: column; align-items: flex-start; gap: 8px; }
  #app.view-playground { flex-direction: column; height: auto; min-height: 100vh; }
  .stage {
    flex: none;
    width: 100%;
    height: 45vh;
    height: 45dvh;
    min-height: 220px;
    position: sticky;
    top: 0;
    z-index: 1;
  }
  .panel { width: 100%; border-left: none; border-top: 1px solid var(--line); }
}
```

(The duplicate `height: 45vh` / `height: 45dvh` pair is deliberate progressive enhancement: browsers without `dvh` support use the `vh` fallback; browsers with it — which correctly account for the mobile Safari/Chrome address bar hiding and reappearing — use the second, more accurate one.)

`.panel`'s existing `overflow-y: auto` (unchanged, from the base ruleset) becomes inert here: the panel's height is no longer constrained by a `100vh` flex parent, so it grows to its content height and the *page* scrolls, which is what makes `.stage`'s `position: sticky` pin it during that scroll.

- [ ] **Step 2: Verify in the browser — this is the load-bearing check**

At 375×812, navigate to a pattern (e.g. `/#/p/apollonian?v=1&seed=1`), reload. Confirm:
- `document.querySelector('.stage').getBoundingClientRect()` — width ≈ 375 (full viewport, not 55px), height ≈ 45% of 812.
- `document.querySelector('svg').getBoundingClientRect()` — width should now be close to the stage width (the artwork is visible and legible), not 55×77 as measured before this task.
- Scroll the page down (`computer` scroll action, or `window.scrollTo(0, 400)`), then re-read `.stage`'s `getBoundingClientRect().top` — must still be `0` (it's pinned, not scrolled away).
- `document.documentElement.scrollWidth === document.documentElement.clientWidth` (still no horizontal scroll).

Repeat at 320×690 and 430×932. Then at 660×900 and 768×1024, confirm the **old** desktop-style side-by-side layout is untouched — `.stage` and `.panel` should sit side by side as they did before this plan (this is the regression check for the `max-width: 640px` boundary).

Also: navigate to a `diffgrowth` pattern (heavy) at 375×812 and change a slider; confirm `.stage` gets `.computing` and visibly dims (opacity 0.55) rather than blanking, exactly as it does on desktop today.

- [ ] **Step 3: Commit**

```bash
git add src/style.css && git commit -m "feat: stack the playground into a sticky stage above a flowing panel under 640px"
```

---

### Task 3: Touch targets — 44px under a coarse pointer, not under a narrow viewport

**Files:** Modify `src/style.css`, `src/ui/controls.ts`

**Honesty note:** this codebase has no DOM test environment (`package.json` lists no `jsdom`/`happy-dom`, and the existing `tests/ui/gallery.test.ts` / `tests/ui/randomize.test.ts` only test pure data exports, never call `document.createElement`). A DOM-structure unit test for the `<label>` change below would need that dependency added, which is out of scope for a mobile CSS/markup fix. Everything in this task is verified by browser inspection only (Step 3), not by `npm test`.

- [ ] **Step 1: Enlarge the actual hit targets**

Append to the end of `src/style.css`:

```css

/* --- mobile: touch targets (pointer-precision dependent, not viewport-width) --- */

@media (pointer: coarse) {
  .btn { min-height: 44px; padding: 14px 14px; }
  .ctl-select { min-height: 44px; padding: 12px 8px; }
  .gal-chip { min-height: 44px; padding: 15px 14px; }
  .gal-back-link {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 4px;
  }
  input[type='range'] { height: 44px; }
  input[type='checkbox'] { width: 22px; height: 22px; }
  .ctl-row.ctl-inline { min-height: 44px; cursor: pointer; }
}
```

(`input[type=range]` growing to 44px tall keeps its visual track thin and centered — this is standard cross-browser range-input behaviour, not a redraw of the track itself. `.ctl-row.ctl-inline` is the checkbox row; Step 2 makes the whole row a single tap target so the extra `min-height` has a click handler that spans it.)

- [ ] **Step 2: Make the whole checkbox row tappable**

The checkbox itself is 22×22px even after Step 1 — still under 44px on its own. Rather than blow up the checkbox glyph, make its entire row the tap target the way a `<label>` does natively: clicking anywhere inside a `<label>` toggles the checkbox it contains, in one native event, with no extra JS.

In `src/ui/controls.ts`, find:

```ts
export function checkboxRow(
  def: ParamDef,
  value: number,
  onChange: (v: number) => void,
): HTMLElement {
  const row = document.createElement('div');
  row.className = 'ctl-row ctl-inline';
```

Replace with:

```ts
export function checkboxRow(
  def: ParamDef,
  value: number,
  onChange: (v: number) => void,
): HTMLElement {
  // <label>, not <div> — the whole row becomes one tap target: clicking
  // anywhere inside it toggles the descendant checkbox natively.
  const row = document.createElement('label');
  row.className = 'ctl-row ctl-inline';
```

Nothing else in the function changes — `row.append(label, input)` still works, and `HTMLLabelElement` is an `HTMLElement`, so the return type is unaffected.

- [ ] **Step 3: Verify in the browser**

At 375×812 (the `mobile` preset — confirm it actually reports a coarse pointer first: `window.matchMedia('(pointer: coarse)').matches` must be `true`):
- Measure `.gal-chip`, `.btn`, `.ctl-select`, `.gal-back-link` heights via `getBoundingClientRect().height` — each must be ≥ 44.
- Measure `input[type=range]` height ≥ 44.
- Click (via the `computer` tool) on the *label text* of a checkbox row (e.g. `FILLALTERNATE`), not the checkbox glyph itself, and confirm the checkbox's `checked` state flips and the artwork re-renders — this is the part a screenshot alone won't prove.
- At a desktop width with the pointer emulation reset to `mouse`/default (i.e. outside the `mobile`/`tablet` presets), re-check the same elements are unchanged from their pre-task heights (28/32/31/14px) — confirms the `pointer: coarse` gate is actually gating, not just always-on.

- [ ] **Step 4: Full suite and build**

```bash
npm run test
```
Expected: full suite passes, same result as before this task (this change touches no logic `npm test` exercises — it changes one DOM tag name and adds CSS).

```bash
npm run build
```
Expected: `tsc --noEmit && vite build` succeeds with no type errors (`HTMLLabelElement` satisfies the `HTMLElement` return type).

- [ ] **Step 5: Commit**

```bash
git add src/style.css src/ui/controls.ts && git commit -m "fix: 44px touch targets under a coarse pointer, and a tappable checkbox row"
```

---

### Task 4: Final cross-width verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full suite one more time**

```bash
npm run test && npm run build
```

Both must pass. This confirms Tasks 1–3 together introduced no regression `npm test`/`tsc` can see — which is most of the codebase's logic, but **none of this plan's actual subject matter**: layout, wrapping, sticky positioning, and touch-target sizing are not observable to `vitest` here (no DOM environment — see Task 3's honesty note) or to `tsc`. Every claim below is verified by browser inspection, not by a green checkmark from `npm test`.

- [ ] **Step 2: Sweep every viewport on both routes**

For each width in **320, 375, 430, 600, 640, 660, 768** (`resize_window`, then reload), on both `/#/` and a playground URL (e.g. `/#/p/apollonian?v=1&seed=1`):

- `document.documentElement.scrollWidth <= document.documentElement.clientWidth` — no horizontal scroll, ever.
- `getComputedStyle(document.getElementById('app')).overflowX !== 'auto'` on the gallery route.
- Below 640px: `.stage` width ≈ full viewport width, artwork visibly legible (not a sliver); `.panel` full width below it, `.stage` stays pinned to `top: 0` after scrolling the panel.
- At 640px and below: `.gal-hero-top` stacks (stats below headline, not clipped).
- At 660px and above: side-by-side desktop layout, unchanged from before this plan (`.stage` ≈ `viewport − 320px`, `.panel` = 320px).
- Under a coarse pointer (`mobile`/`tablet` presets): every `.gal-chip`, `.btn`, `.ctl-select`, `.gal-back-link`, `input[type=range]`, and checkbox row measures ≥ 44px in its touch dimension.
- Open a `diffgrowth` pattern at 375×812 and drag a slider; confirm the pinned stage dims during recompute and updates in place, same as desktop.

- [ ] **Step 3: Report**

Summarize which of the above passed at each width, and flag anything that didn't — do not silently fix it as part of "verification"; report it back the way Task 3 Step 5 of the Part 3 export plan asks contributors to report framing issues rather than quietly patching them.

(No commit for this task — it's a report, not a change.)

---

## Self-Review (done at write time)

- **Scope discipline:** three CSS concerns (a same-axis overflow quirk, a non-wrapping flex row, and two width/pointer media-query blocks) plus one HTML tag change (`div` → `label`). No new files, no new dependencies, no touch to any pattern module, URL state, export code, or the (not-yet-existing) modal.
- **Independence from `feat/part3-export-v2`:** verified by file overlap — that branch's in-flight work (as of this review) touches `src/core/reserved.ts`, `src/core/url-state.ts`, and `tests/core/url-state.test.ts`; this plan touches `src/style.css` and `src/ui/controls.ts`. Zero overlap.
- **What's deliberately not done:** no bottom-sheet/drag-gesture UI (rationale in Architecture); no reduction of the 46px hero headline font size on mobile (it wraps correctly and doesn't overflow once `.gal-hero-top` stacks — this is a density preference, not a defect, so it's out of scope here); no touch-target work on `.chip`/`.chip-row` (Part 3 Task 4's format chips) since those classes don't exist on this branch yet — flagged as a follow-up for whoever lands that task, not preemptively built against code that isn't there.
- **Testability honesty:** Task 3 states plainly, before the fact, that this repo cannot unit-test DOM structure or layout, and that every touch-target and layout claim is a browser-verified claim, not a green-test claim.
