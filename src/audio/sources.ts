/** Browser-only audio graph glue. Everything testable lives in dsp/features/
 *  onsets; this file is deliberately thin and is verified manually. */

export interface AudioRig {
  mode: 'file' | 'mic';
  analyser: AnalyserNode;
  sampleRate: number;
  /** Seconds; null for mic. */
  duration: number | null;
  playing: boolean;
  /** True when the browser is holding the audio context suspended for want of
   *  a user gesture. `play()` can succeed and still leave this set: the source
   *  node is running but the context clock is not, so there is no sound and no
   *  analyser data. The caller has to ask for a click. */
  suspended(): boolean;
  play(): void;
  pause(): void;
  seek(sec: number): void;
  /** Current position in the file, or seconds since mic start. */
  position(): number;
  /** Audio-only stream for MediaRecorder capture. */
  recordingStream(): MediaStream;
  dispose(): void;
}

export async function fileRig(file: File): Promise<{ rig: AudioRig; buffer: AudioBuffer }> {
  const ctx = new AudioContext();
  const buffer = await ctx.decodeAudioData(await file.arrayBuffer());
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  const tap = ctx.createMediaStreamDestination();
  analyser.connect(ctx.destination);
  analyser.connect(tap);

  let src: AudioBufferSourceNode | null = null;
  let startedAt = 0;
  let offset = 0;

  const rig: AudioRig = {
    mode: 'file',
    analyser,
    sampleRate: ctx.sampleRate,
    duration: buffer.duration,
    playing: false,
    suspended() { return ctx.state === 'suspended'; },
    play() {
      if (this.playing) return;
      if (offset >= buffer.duration) offset = 0;
      void ctx.resume();
      src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(analyser);
      src.onended = () => {
        if (rig.playing) { rig.playing = false; offset = buffer.duration; }
      };
      src.start(0, offset);
      startedAt = ctx.currentTime;
      this.playing = true;
    },
    pause() {
      if (!this.playing || !src) return;
      offset = Math.min(buffer.duration, offset + (ctx.currentTime - startedAt));
      this.playing = false;
      src.onended = null;
      src.stop();
      src.disconnect();
      src = null;
    },
    seek(sec: number) {
      const wasPlaying = this.playing;
      if (wasPlaying) this.pause();
      offset = Math.min(buffer.duration, Math.max(0, sec));
      if (wasPlaying) this.play();
    },
    position() {
      return this.playing ? Math.min(buffer.duration, offset + (ctx.currentTime - startedAt)) : offset;
    },
    recordingStream() { return tap.stream; },
    dispose() {
      this.pause();
      void ctx.close();
    },
  };
  return { rig, buffer };
}

export async function micRig(): Promise<AudioRig> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const ctx = new AudioContext();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  const tap = ctx.createMediaStreamDestination();
  // Mic goes to the analyser and the recording tap, never to the speakers —
  // routing it to ctx.destination would feed back.
  ctx.createMediaStreamSource(stream).connect(analyser);
  analyser.connect(tap);
  const t0 = ctx.currentTime;
  const rig: AudioRig = {
    mode: 'mic',
    analyser,
    sampleRate: ctx.sampleRate,
    duration: null,
    playing: true,
    // The mic needs a permission grant, which is itself a user gesture, so the
    // context is never left suspended here.
    suspended() { return false; },
    play() { this.playing = true; },
    pause() { this.playing = false; },
    seek() { /* no-op for mic */ },
    position() { return ctx.currentTime - t0; },
    recordingStream() { return tap.stream; },
    dispose() {
      for (const t of stream.getTracks()) t.stop();
      void ctx.close();
    },
  };
  return rig;
}
