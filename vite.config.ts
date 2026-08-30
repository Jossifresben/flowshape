import { defineConfig } from 'vite';
import { sharePages } from './scripts/share-pages';

export default defineConfig({
  build: { target: 'es2022' },
  // Emits the eight per-language share paths (`/`, `/gallery/`, `/es/…`) as
  // real documents with their own Open Graph tags. A missing one is a 404 on a
  // shared link, so this is part of `npm run build`, not an optional step.
  plugins: [sharePages()],
  test: {
    // Claude Code puts agent worktrees under .claude/worktrees/ — full checkouts
    // of other branches. Vitest would glob their tests as if they were ours and
    // run another branch's suite against this one's source.
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/**'],
  },
  // Honour a PORT handed down by the environment; Vite otherwise ignores it and
  // silently auto-increments off a busy 5173, which strands any tooling that
  // was told which port to expect.
  server: { port: process.env['PORT'] ? Number(process.env['PORT']) : undefined },
});
