import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'),
) as { version: string };

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendOrigin = env.BACKEND_ORIGIN;
  if (!backendOrigin) throw new Error('BACKEND_ORIGIN is not set in .env.local');

  return {
    plugins: [react(), tailwindcss()],
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      proxy: { '/api': { target: backendOrigin, changeOrigin: true } },
    },
  };
});
