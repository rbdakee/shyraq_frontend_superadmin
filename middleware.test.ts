import { afterEach, describe, expect, it, vi } from 'vitest';
import middleware from './middleware';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('backend proxy middleware', () => {
  it('rewrites the API path and query to BACKEND_ORIGIN', () => {
    vi.stubEnv('BACKEND_ORIGIN', 'https://backend.example.com/');

    const response = middleware(
      new Request('https://frontend.example.com/api/v1/health?details=true'),
    );

    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'https://backend.example.com/api/v1/health?details=true',
    );
  });

  it('fails clearly when BACKEND_ORIGIN is missing', async () => {
    vi.stubEnv('BACKEND_ORIGIN', '');

    const response = middleware(new Request('https://frontend.example.com/api/v1/health'));

    expect(response.status).toBe(500);
    await expect(response.text()).resolves.toBe('BACKEND_ORIGIN is not configured');
  });

  it('rejects non-HTTP backend URLs', async () => {
    vi.stubEnv('BACKEND_ORIGIN', 'file:///backend');

    const response = middleware(new Request('https://frontend.example.com/api/v1/health'));

    expect(response.status).toBe(500);
    await expect(response.text()).resolves.toBe('BACKEND_ORIGIN must use HTTP or HTTPS');
  });
});
