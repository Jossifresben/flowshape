// tests/content/source.test.ts — every registered pattern must have a source file
import { describe, it, expect } from 'vitest';
import '../../src/patterns/index';
import { listPatterns } from '../../src/patterns/registry';
import { sourceIds } from '../../src/content/source';

describe('pattern source', () => {
  it('every registered pattern has a resolvable source file', () => {
    const ids = new Set(sourceIds());
    const missing = listPatterns().map((d) => d.id).filter((id) => !ids.has(id));
    expect(missing).toEqual([]);
  });
});
