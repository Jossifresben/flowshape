import { describe, it, expect } from 'vitest';
import { pickMimeType } from '../../src/anim/recorder';

describe('pickMimeType', () => {
  it('prefers mp4, falls back through vp9 to vp8 webm', () => {
    expect(pickMimeType(() => true)!.ext).toBe('mp4');
    expect(pickMimeType((m) => m.startsWith('video/webm'))!.mime).toContain('vp9');
    expect(pickMimeType((m) => m.includes('vp8'))!.ext).toBe('webm');
    expect(pickMimeType(() => false)).toBeNull();
  });
});
