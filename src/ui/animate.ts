import { getPattern, defaultParams, clampParams, generateSafe, type PatternDef } from '../patterns/registry';
import { decodeState, encodeState, type AppState } from '../core/url-state';
import { resolvePalette } from '../poster/palettes';
import type { SvgNode, Palette } from '../core/svg';
import { FeaturePipeline, ZERO_FRAME, type FeatureFrame } from '../audio/features';
import { detectOnsets, estimateTempo, beatGrid, LiveOnsetDetector } from '../audio/onsets';
import { fileRig, micRig, type AudioRig } from '../audio/sources';
import { BeatClock, phaseAt, frameParams } from '../anim/engine';
import { drawTree } from '../anim/canvas-render';
import { presetsFor, DEFAULT_COLOUR_ROUTE, type AnimPreset } from '../anim/presets';
import { pickMimeType, probeMimeTypes, StageRecorder, downloadBlob } from '../anim/recorder';
import { AnimWorkerClient } from '../anim/worker-client';
import { chipRow } from './controls';
import { NAMES } from './gallery';

/** Stage geometry: fixed internal pixel resolution per aspect; patterns keep
 *  composing in user units (600 on the short edge), scaled up 1.8× to pixels. */
const SCALE = 1.8;
const STAGES: Record<'169' | '916' | '11', { cw: number; ch: number }> = {
  '169': { cw: 1920, ch: 1080 },
  '916': { cw: 1080, ch: 1920 },
  '11': { cw: 1080, ch: 1080 },
};

/** Hermes's own RHY-2B, first 60 s. Shipped so the stage is never mute. */
const DEMO_TRACK = '/samples/rhy-2b.mp3';

const STR = {
  en: {
    back: '← POSTER', play: 'PLAY', pause: 'PAUSE', record: 'REC', stop: 'STOP',
    fullscreen: 'FULLSCREEN', mic: 'MIC', demo: 'DEMO', dropHint: 'DROP AUDIO / CLICK TO CHOOSE',
    privacy: 'Audio is processed in your browser and never uploaded.',
    intensity: 'INTENSITY', preset: 'PRESET', aspect: 'ASPECT',
    decodeError: 'Could not decode this audio file.',
    demoError: 'Could not load the demo track.',
    micError: 'Microphone unavailable or permission denied.',
    recError: 'Recording is not supported in this browser.',
    recNoAudio: 'Load audio first.',
    recNoMime: 'No compatible recording format found in this browser.',
    colour: 'COLOUR',
  },
  es: {
    back: '← PÓSTER', play: 'REPRODUCIR', pause: 'PAUSA', record: 'REC', stop: 'PARAR',
    fullscreen: 'PANTALLA COMPLETA', mic: 'MIC', demo: 'DEMO', dropHint: 'ARRASTRA AUDIO / CLIC PARA ELEGIR',
    privacy: 'El audio se procesa en tu navegador y nunca se sube.',
    intensity: 'INTENSIDAD', preset: 'PRESET', aspect: 'ASPECTO',
    decodeError: 'No se pudo decodificar este archivo de audio.',
    demoError: 'No se pudo cargar la pista de demostración.',
    micError: 'Micrófono no disponible o permiso denegado.',
    recError: 'Este navegador no permite grabar.',
    recNoAudio: 'Carga audio primero.',
    recNoMime: 'No se encontró un formato de grabación compatible en este navegador.',
    colour: 'COLOR',
  },
} as const;

export function mountAnimate(root: HTMLElement): () => void {
  const state: AppState = decodeState(location.hash)!;
  const def: PatternDef | undefined = getPattern(state.patternId);
  if (!def) { location.hash = '#/'; return () => undefined; }

  const t = STR[state.lang];
  const presets = presetsFor(def.id);
  let preset: AnimPreset = presets.find((p) => p.id === state.apre) ?? presets[0]!;
  let intensity = state.aint ?? 1;
  let stageId: '169' | '916' | '11' = state.stage ?? '169';
  // Colour is opt-in and off by default (monochrome stays the default look).
  // With it off, `paletteFor` always returns this exact `pal` instance —
  // never a freshly-resolved one — so output is byte-identical to before
  // colour existed.
  let colourOn = state.acol ?? false;
  const baseParams = clampParams(def, { ...defaultParams(def), ...state.params });
  const pal = resolvePalette(state.color);

  // --- audio state ---
  let rig: AudioRig | null = null;
  let pipeline: FeaturePipeline | null = null;
  let clock: BeatClock | null = null;
  let bpm: number | null = null;
  const liveDet = new LiveOnsetDetector();
  let liveBeats = -1;
  const timeBuf = new Float32Array(2048);

  // --- heavy double buffer ---
  const workerClient = def.heavy ? new AnimWorkerClient() : null;
  let heavyTree: SvgNode | null = null;
  let heavyPendingIdx = -1;
  let heavyReady: { idx: number; node: SvgNode } | null = null;

  // --- recording ---
  let recorder: StageRecorder | null = null;
  let recordingMime: { mime: string; ext: string } | null = null;

  // --- DOM ---
  root.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'anim-wrap';

  const stageEl = document.createElement('div');
  stageEl.className = 'anim-stage';
  const canvas = document.createElement('canvas');
  stageEl.append(canvas);

  const panel = document.createElement('div');
  panel.className = 'anim-panel';

  const back = document.createElement('a');
  back.textContent = t.back;
  back.className = 'anim-back';
  back.href = encodeState({
    ...state, view: undefined, stage: undefined, apre: undefined, aint: undefined, acol: undefined,
  });

  const title = document.createElement('h1');
  title.textContent = (NAMES[def.id] ?? def.id).toUpperCase();

  const status = document.createElement('div');
  status.className = 'anim-status';

  // aspect
  const aspectLabel = label(t.aspect);
  let aspectChips = chipRow(
    [{ id: '169', label: '16:9' }, { id: '916', label: '9:16' }, { id: '11', label: '1:1' }],
    stageId,
    (id) => { stageId = id as typeof stageId; applyStage(); syncUrl(); rebuildChips(); },
  );

  // preset
  const presetLabel = label(t.preset);
  let presetChips = chipRow(
    presets.map((p) => ({ id: p.id, label: p.label[state.lang].toUpperCase() })),
    preset.id,
    (id) => { preset = presets.find((p) => p.id === id) ?? preset; syncUrl(); rebuildChips(); },
  );

  function rebuildChips(): void {
    const na = chipRow(
      [{ id: '169', label: '16:9' }, { id: '916', label: '9:16' }, { id: '11', label: '1:1' }],
      stageId,
      (id) => { stageId = id as typeof stageId; applyStage(); syncUrl(); rebuildChips(); },
    );
    aspectChips.replaceWith(na); aspectChips = na;
    const np = chipRow(
      presets.map((p) => ({ id: p.id, label: p.label[state.lang].toUpperCase() })),
      preset.id,
      (id) => { preset = presets.find((p) => p.id === id) ?? preset; syncUrl(); rebuildChips(); },
    );
    presetChips.replaceWith(np); presetChips = np;
  }

  // intensity
  const intensityRow = document.createElement('div');
  intensityRow.className = 'ctl-row';
  const intensityHead = label(t.intensity);
  const intensityInput = document.createElement('input');
  intensityInput.type = 'range';
  intensityInput.min = '0'; intensityInput.max = '1'; intensityInput.step = '0.01';
  intensityInput.value = String(intensity);
  intensityInput.addEventListener('input', () => { intensity = Number(intensityInput.value); syncUrl(); });
  intensityRow.append(intensityHead, intensityInput);

  // colour — off by default; monochrome stays the default look. A <label>
  // row, like checkboxRow in controls.ts, so the whole row is one tap target.
  const colourRow = document.createElement('label');
  colourRow.className = 'ctl-row ctl-inline';
  const colourLabel = document.createElement('span');
  colourLabel.className = 'ctl-label';
  colourLabel.textContent = t.colour;
  const colourInput = document.createElement('input');
  colourInput.type = 'checkbox';
  colourInput.checked = colourOn;
  colourInput.addEventListener('change', () => { colourOn = colourInput.checked; syncUrl(); });
  colourRow.append(colourLabel, colourInput);

  // source
  const drop = document.createElement('button');
  drop.className = 'anim-drop';
  drop.textContent = t.dropHint;
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'audio/*';
  fileInput.style.display = 'none';
  drop.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => { const f = fileInput.files?.[0]; if (f) void loadFile(f); });
  stageEl.addEventListener('dragover', (e) => e.preventDefault());
  stageEl.addEventListener('drop', (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files[0];
    if (f) void loadFile(f);
  });

  // A shared animate link opens silent — the viewer has no audio to hand. The
  // demo track makes the stage immediately experienceable in one click.
  const demoBtn = button(t.demo, async () => {
    try {
      const res = await fetch(DEMO_TRACK);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      await loadFile(new File([blob], 'rhy-2b.mp3', { type: blob.type || 'audio/mpeg' }));
    } catch { status.textContent = t.demoError; }
  });

  const micBtn = button(t.mic, async () => {
    try {
      swapRig(await micRig());
      clock = null; bpm = null; liveBeats = -1;
      playBtn.textContent = t.pause;
    } catch { status.textContent = t.micError; }
  });

  const playBtn = button(t.play, () => {
    if (!rig) return;
    if (rig.playing) { rig.pause(); playBtn.textContent = t.play; }
    else { rig.play(); playBtn.textContent = t.pause; }
  });

  // scrub (file mode)
  const scrub = document.createElement('input');
  scrub.type = 'range';
  scrub.min = '0'; scrub.max = '1000'; scrub.step = '1'; scrub.value = '0';
  scrub.className = 'anim-scrub';
  scrub.style.display = 'none';
  scrub.addEventListener('input', () => {
    if (rig?.duration != null) rig.seek((Number(scrub.value) / 1000) * rig.duration);
  });

  const recBtn = button(t.record, async () => {
    if (recorder) {
      const blob = await recorder.stop();
      recorder = null;
      recBtn.classList.remove('recording');
      recBtn.textContent = t.record;
      const mime = recordingMime!;
      recordingMime = null;
      downloadBlob(blob, `flowshape-${def.id}.${mime.ext}`);
      return;
    }
    // Three distinct failure causes, three distinct messages — conflating
    // them (as "browser doesn't support recording") told a user who simply
    // hadn't loaded audio yet that their browser was broken.
    if (!rig) { status.textContent = t.recNoAudio; return; }
    if (typeof MediaRecorder === 'undefined') { status.textContent = t.recError; return; }
    const mime = pickMimeType((m) => MediaRecorder.isTypeSupported(m));
    if (!mime) {
      if (import.meta.env.DEV) {
        console.warn(
          '[flowshape] no MediaRecorder mime type accepted in this engine:',
          probeMimeTypes((m) => MediaRecorder.isTypeSupported(m)),
        );
      }
      status.textContent = t.recNoMime;
      return;
    }
    recordingMime = mime;
    recorder = new StageRecorder(canvas, rig.recordingStream(), mime.mime);
    recorder.start();
    recBtn.classList.add('recording');
    recBtn.textContent = t.stop;
    // Unobtrusive: the recorded container is never a mystery after the fact.
    status.textContent = `${t.record} · ${mime.ext.toUpperCase()}`;
  });

  const fsBtn = button(t.fullscreen, () => void stageEl.requestFullscreen?.());

  const privacy = document.createElement('p');
  privacy.className = 'anim-privacy';
  privacy.textContent = t.privacy;

  panel.append(back, title, aspectLabel, aspectChips, presetLabel, presetChips, intensityRow, colourRow,
    drop, fileInput, demoBtn, micBtn, playBtn, scrub, recBtn, fsBtn, status, privacy);
  wrap.append(stageEl, panel);
  root.append(wrap);

  function label(text: string): HTMLElement {
    const s = document.createElement('div');
    s.className = 'ctl-label anim-label';
    s.textContent = text;
    return s;
  }
  function button(text: string, onClick: () => void | Promise<void>): HTMLButtonElement {
    const b = document.createElement('button');
    b.className = 'anim-btn';
    b.textContent = text;
    b.addEventListener('click', () => void onClick());
    return b;
  }

  function syncUrl(): void {
    history.replaceState(null, '', encodeState({
      ...state, view: 'a', stage: stageId, apre: preset.id, aint: intensity, acol: colourOn,
    }));
  }

  function swapRig(next: AudioRig): void {
    rig?.dispose();
    rig = next;
    pipeline = new FeaturePipeline(next.sampleRate);
  }

  async function loadFile(file: File): Promise<void> {
    status.textContent = '…';
    try {
      const { rig: next, buffer } = await fileRig(file);
      swapRig(next);
      const mono = buffer.getChannelData(0);
      const { onsets, flux, hopSec } = detectOnsets(mono, buffer.sampleRate);
      bpm = estimateTempo(flux, hopSec);
      clock = new BeatClock(beatGrid(onsets, bpm, buffer.duration));
      scrub.style.display = '';
      status.textContent = bpm ? `${Math.round(bpm)} BPM` : '';
      rig!.play();
      playBtn.textContent = t.pause;
    } catch {
      status.textContent = t.decodeError;
    }
  }

  // --- stage sizing + render loop ---
  let userSize = { w: 600, h: 600 };
  function applyStage(): void {
    const { cw, ch } = STAGES[stageId];
    canvas.width = cw;
    canvas.height = ch;
    userSize = { w: cw / SCALE, h: ch / SCALE };
    heavyTree = null; heavyReady = null; heavyPendingIdx = -1;
  }
  applyStage();

  const ctx = canvas.getContext('2d')!;
  let raf = 0;
  let lastNow = performance.now();
  let idleClock = 0;
  // fps governor: EMA of frame cost; halve to 30fps when consistently over budget
  let costEma = 8;
  let skipOdd = false;
  let flip = false;

  function draw(node: SvgNode, framePal: Palette): void {
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    drawTree(ctx, node, framePal);
  }

  const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

  /** Colour on the animated stage only, and only through a preset — never
   *  automatically (spec constraint). `hue`/`chroma` aren't ParamDefs (see
   *  ColourRoute's comment in anim/presets.ts), so this is the one place
   *  that reaches them: derive a ColorState from the base state plus the
   *  routed features and hand it to the SAME resolvePalette the poster path
   *  uses — no colour logic is duplicated or forked for the stage.
   *  With the toggle off this returns the exact `pal` computed once at
   *  mount, so output is byte-identical to before colour existed. */
  function paletteFor(features: FeatureFrame): Palette {
    if (!colourOn) return pal;
    const route = preset.colour ?? DEFAULT_COLOUR_ROUTE;
    const hue = route.hue.from + (route.hue.to - route.hue.from) * clamp01(features[route.hue.feature]);
    // level → chroma, scaled by intensity: silence (feature 0) or intensity
    // 0 both resolve to chroma 0 — plain monochrome ink either way.
    const chroma = clamp01(features[route.chroma.feature]) * route.chroma.max * intensity;
    return resolvePalette({ ...state.color, hue, chroma });
  }

  function tick(now: number): void {
    raf = requestAnimationFrame(tick);
    flip = !flip;
    if (skipOdd && flip) return;
    const dtMs = Math.min(100, now - lastNow);
    lastNow = now;
    const t0 = performance.now();

    let features: FeatureFrame = ZERO_FRAME;
    let beatIndex = -1;
    let tSec: number;
    if (rig && rig.playing && pipeline) {
      rig.analyser.getFloatTimeDomainData(timeBuf);
      features = pipeline.process(timeBuf, dtMs);
      tSec = rig.position();
      if (clock) beatIndex = clock.beatIndex(tSec);
      else {
        // raw (un-enveloped) flux — see LiveOnsetDetector's contract
        if (liveDet.process(pipeline.rawFlux, dtMs)) liveBeats++;
        beatIndex = liveBeats;
      }
      if (rig.duration != null && !scrubActive()) {
        scrub.value = String(Math.round((tSec / rig.duration) * 1000));
      }
    } else {
      idleClock += dtMs / 1000;
      tSec = idleClock;
    }

    const { params, seed } = frameParams({
      def: def!, baseParams, baseSeed: state.seed, preset, intensity,
      features, phase: phaseAt(tSec, bpm), beatIndex,
    });
    const framePal = paletteFor(features);

    if (def!.heavy && workerClient) {
      // Beat-ahead double buffer: request the NEXT event window's tree early,
      // swap when its beat arrives. Never block the frame on the worker.
      const ev = preset.event;
      const every = ev?.everyBeats ?? 1;
      // Same window index k as frameParams derives — keep the two in lockstep.
      const curIdx = beatIndex < 0 ? 0 : Math.floor(beatIndex / every);
      if (heavyReady && heavyReady.idx <= curIdx) { heavyTree = heavyReady.node; heavyReady = null; }
      const wantIdx = heavyTree === null ? curIdx : curIdx + 1;
      if (heavyPendingIdx !== wantIdx) {
        heavyPendingIdx = wantIdx;
        const probe = frameParams({
          def: def!, baseParams, baseSeed: state.seed, preset, intensity,
          features: ZERO_FRAME, phase: 0, beatIndex: wantIdx * every,
        });
        void workerClient.request(def!.id, probe.params, probe.seed, userSize).then((node) => {
          if (node && heavyPendingIdx === wantIdx) heavyReady = { idx: wantIdx, node };
        });
      }
      if (heavyTree) draw(heavyTree, framePal);
      else { // paper until the first tree lands
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = framePal.paper;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    } else {
      draw(generateSafe(def!, params, seed, userSize), framePal);
    }

    costEma = costEma * 0.9 + (performance.now() - t0) * 0.1;
    if (!skipOdd && costEma > 26) skipOdd = true;
    else if (skipOdd && costEma < 10) skipOdd = false;
  }
  let scrubbing = false;
  scrub.addEventListener('pointerdown', () => { scrubbing = true; });
  scrub.addEventListener('pointerup', () => { scrubbing = false; });
  function scrubActive(): boolean { return scrubbing; }

  syncUrl();
  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    rig?.dispose();
    workerClient?.dispose();
    if (recorder) void recorder.stop();
  };
}
