import type { SvgNode } from '../core/svg';
import type { Params, Size } from '../patterns/registry';

interface Resp { id: number; node: SvgNode | null; error?: string }

/** Promise wrapper over the existing compute worker protocol. Later requests
 *  supersede earlier ones only at the call site — this client just correlates ids. */
export class AnimWorkerClient {
  private worker = new Worker(new URL('../workers/compute.worker.ts', import.meta.url), { type: 'module' });
  private nextId = 1;
  private pending = new Map<number, (node: SvgNode | null) => void>();

  constructor() {
    this.worker.onmessage = (e: MessageEvent<Resp>) => {
      const resolve = this.pending.get(e.data.id);
      if (resolve) {
        this.pending.delete(e.data.id);
        resolve(e.data.error ? null : e.data.node);
      }
    };
  }

  request(patternId: string, params: Params, seed: number, size: Size): Promise<SvgNode | null> {
    const id = this.nextId++;
    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      this.worker.postMessage({ id, patternId, params, seed, size });
    });
  }

  dispose(): void { this.worker.terminate(); }
}
