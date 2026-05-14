import ky, { HTTPError } from 'ky';
import i18n from '@/lib/i18n';
import { tokenStorage } from '@/lib/token-storage';
import { AppError } from './errors';

const AUTH_FREE_PATHS = ['saas/auth/login', 'saas/auth/refresh'];

function isAuthFree(url: string): boolean {
  return AUTH_FREE_PATHS.some((p) => url.includes(p));
}

// WHY bare ky instead of apiClient: refresh must bypass the afterResponse
// interceptor to avoid infinite 401-refresh recursion. AUTH_FREE_PATHS
// check is a belt-and-suspenders guard.
let refreshPromise: Promise<void> | null = null;

async function tryRefreshOnce(): Promise<void> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const r = tokenStorage.getRefresh();
    if (!r) throw new AppError('invalid_refresh', 401);

    try {
      const res = await ky
        .post('saas/auth/refresh', {
          prefix: '/api/v1/',
          json: { refreshToken: r },
        })
        .json<{ access_token: string; refresh_token: string }>();

      tokenStorage.setBoth({
        access: res.access_token,
        refresh: res.refresh_token,
      });
    } catch (e: unknown) {
      if (e instanceof AppError) throw e;
      throw new AppError('invalid_refresh', 401);
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function parseErrorData(data: unknown): { error: string; details?: unknown } | null {
  if (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as Record<string, unknown>).error === 'string'
  ) {
    const d = data as Record<string, unknown>;
    return { error: d.error as string, details: d.details };
  }
  return null;
}

export const apiClient = ky.create({
  prefix: '/api/v1/',
  retry: { limit: 1 },
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const lang = i18n.language || 'ru';
        request.headers.set('x-custom-lang', lang);

        const token = tokenStorage.getAccess();
        if (token && !isAuthFree(request.url)) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      async ({ request, response, retryCount }) => {
        if (response.status === 401 && !isAuthFree(request.url) && retryCount === 0) {
          try {
            await tryRefreshOnce();
          } catch {
            tokenStorage.clear();
            window.location.assign('/login?reason=session_expired');
            throw new AppError('invalid_refresh', 401);
          }

          const headers = new Headers(request.headers);
          headers.set('Authorization', `Bearer ${tokenStorage.getAccess()}`);

          return ky.retry({
            request: new Request(request.url, {
              method: request.method,
              headers,
              body: request.body,
              referrer: request.referrer,
              referrerPolicy: request.referrerPolicy,
              mode: request.mode,
              credentials: request.credentials,
              cache: request.cache,
              redirect: request.redirect,
              integrity: request.integrity,
            }),
            code: 'TOKEN_REFRESHED',
          });
        }
      },
    ],
    beforeError: [
      ({ error }) => {
        if (error instanceof HTTPError) {
          const parsed = parseErrorData(error.data);
          if (parsed) {
            return new AppError(parsed.error, error.response.status, parsed.details);
          }
          return new AppError('unknown_error', error.response.status);
        }
        return error;
      },
    ],
  },
});
