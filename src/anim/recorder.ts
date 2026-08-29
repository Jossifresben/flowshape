/** Codec preference: honest MP4 first (Safari), then WebM tiers (Chrome/Firefox). */
const CANDIDATES = [
  { mime: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', ext: 'mp4' },
  { mime: 'video/mp4', ext: 'mp4' },
  { mime: 'video/webm;codecs=vp9,opus', ext: 'webm' },
  { mime: 'video/webm;codecs=vp8,opus', ext: 'webm' },
  { mime: 'video/webm', ext: 'webm' },
] as const;

export function pickMimeType(
  isSupported: (mime: string) => boolean,
): { mime: string; ext: string } | null {
  const hit = CANDIDATES.find((c) => isSupported(c.mime));
  return hit ? { mime: hit.mime, ext: hit.ext } : null;
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
