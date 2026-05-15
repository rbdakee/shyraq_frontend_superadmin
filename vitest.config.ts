import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    // Exclude Playwright e2e specs — those run via `pnpm playwright test`, not vitest
    exclude: ['tests/**', 'node_modules/**'],
  },
});
