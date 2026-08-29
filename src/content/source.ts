/** Raw source text for every pattern generator module, keyed by `../patterns/<id>.ts`.
 *  Lazy: nothing here reaches the initial bundle until a loader is called. */
const sources = import.meta.glob('../patterns/*.ts', { query: '?raw', import: 'default' }) as Record<
  string,
  () => Promise<string>
>;

/** The pattern's real generator source, loaded lazily so it costs nothing until opened. */
export async function loadSource(id: string): Promise<string | null> {
  const loader = sources[`../patterns/${id}.ts`];
  return loader ? ((await loader()) as string) : null;
}

/** Pattern ids whose source is present, derived from the glob keys — everything under
 *  `src/patterns/` except the shared modules that are not themselves a pattern. */
export function sourceIds(): string[] {
  const NON_PATTERN = new Set(['registry', 'index', 'randomize', 'presets']);
  return Object.keys(sources)
    .map((k) => k.replace('../patterns/', '').replace('.ts', ''))
    .filter((id) => !NON_PATTERN.has(id));
}
