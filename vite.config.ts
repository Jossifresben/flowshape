import { defineConfig } from 'vite';

export default defineConfig({
  build: { target: 'es2022' },
  // Honour a PORT handed down by the environment; Vite otherwise ignores it and
  // silently auto-increments off a busy 5173, which strands any tooling that
  // was told which port to expect.
  server: { port: process.env['PORT'] ? Number(process.env['PORT']) : undefined },
});
