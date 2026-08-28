import '../patterns/index';
import { getPattern, generateSafe } from '../patterns/registry';
import type { Params, Size } from '../patterns/registry';

interface Req { id: number; patternId: string; params: Params; seed: number; size: Size }

self.onmessage = (e: MessageEvent<Req>) => {
  const { id, patternId, params, seed, size } = e.data;
  const def = getPattern(patternId);
  const node = def ? generateSafe(def, params, seed, size) : null;
  (self as unknown as Worker).postMessage({ id, node });
};
