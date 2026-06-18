import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

// Load .env.local (not handled by Node by default)
const envFile = '.env.local';
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf-8').split('\n')) {
    const eq = line.indexOf('=');
    if (eq === -1 || line.trimStart().startsWith('#')) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim();
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

const origin = process.env.BACKEND_ORIGIN;
if (!origin) throw new Error('BACKEND_ORIGIN is not set. Add it to .env.local');

// spawnSync with separate args — avoids shell interpolation of the URL
const result = spawnSync(
  'pnpm',
  ['exec', 'openapi-typescript', `${origin}/docs-json`, '-o', 'src/api/types/openapi.d.ts'],
  { stdio: 'inherit', shell: true }, // shell: true needed on Windows for .cmd shims
);
if (result.status !== 0) process.exit(result.status ?? 1);
