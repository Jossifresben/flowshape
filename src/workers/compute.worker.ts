import '../patterns/index';
import { getPattern, generateSafe } from '../patterns/registry';
import type { Params, Size } from '../patterns/registry';

interface Req { id: number; patternId: string; params: Params; seed: number; size: Size }

self.onmessage = (e: MessageEvent<Req>) => {
  const { id, patternId, params, seed, size } = e.data;
  try {
    const def = getPattern(patternId);
    if (!def) {
      (self as unknown as Worker).postMessage({ id, node: null, error: `unknown pattern: ${patternId}` });
      return;
    }
    (self as unknown as Worker).postMessage({ id, node: generateSafe(def, params, seed, size) });
  } catch (err) {
    (self as unknown as Worker).postMessage({ id, node: null, error: String(err) });
  }
};
