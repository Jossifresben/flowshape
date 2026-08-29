/** Codec preference: honest MP4 first (Safari), then WebM tiers (Chrome/Firefox).
 *  Order matters — `pickMimeType` returns the FIRST accepted entry, so more
 *  specific/preferred codec strings must precede looser ones within each
 *  container group. Widened past the original five after a report of
 *  "recording unsupported" on a browser we hadn't verified against: Safari
 *  has historically accepted the bare `video/mp4` container while rejecting
 *  an explicit `avc1`/`mp4a` codec string (and sometimes accepts a bare
 *  `avc1` token without the profile/level suffix), and some Chromium builds
 *  expose an H.264 encoder inside a WebM container (`video/webm;codecs=h264`)
 *  even when the usual VP8/VP9 route is blocked. None of this is confirmed
 *  for Hermes's own browser — see the diagnostic below, which exists so the
 *  next report comes with data instead of a guess. */
const CANDIDATES = [
  { mime: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', ext: 'mp4' },
  { mime: 'video/mp4;codecs=avc1', ext: 'mp4' },
  { mime: 'video/mp4', ext: 'mp4' },
  { mime: 'video/mp4;codecs=h264,aac', ext: 'mp4' },
  { mime: 'video/webm;codecs=vp9,opus', ext: 'webm' },
  { mime: 'video/webm;codecs=vp8,opus', ext: 'webm' },
  { mime: 'video/webm;codecs=h264', ext: 'webm' },
  { mime: 'video/webm', ext: 'webm' },
] as const;

export function pickMimeType(
  isSupported: (mime: string) => boolean,
): { mime: string; ext: string } | null {
  const hit = CANDIDATES.find((c) => isSupported(c.mime));
  return hit ? { mime: hit.mime, ext: hit.ext } : null;
}

/** Every candidate paired with its `isTypeSupported` verdict — for the
 *  console diagnostic when no candidate is accepted, so the failure comes
 *  with a table instead of a guess about which browser did what. */
export function probeMimeTypes(
  isSupported: (mime: string) => boolean,
): { mime: string; ext: string; supported: boolean }[] {
  return CANDIDATES.map((c) => ({ ...c, supported: isSupported(c.mime) }));
}

/** Captures the stage canvas + the audio tap into one file via MediaRecorder.
 *  Realtime by design (Phase A); the deterministic exporter is Phase B. */
export class StageRecorder {
  private rec: MediaRecorder;
  private chunks: Blob[] = [];

  constructor(canvas: HTMLCanvasElement, audio: MediaStream, mime: string) {
    const stream = new MediaStream([
      ...canvas.captureStream(60).getVideoTracks(),
      ...audio.getAudioTracks(),
    ]);
    this.rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12_000_000 });
    this.rec.ondataavailable = (e) => { if (e.data.size > 0) this.chunks.push(e.data); };
  }

  start(): void { this.rec.start(250); }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      this.rec.onstop = () => resolve(new Blob(this.chunks, { type: this.rec.mimeType }));
      this.rec.stop();
    });
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
