import type { components } from './types/openapi';
import { apiClient } from './client';

type AuthResponse = components['schemas']['SuperAdminAuthResponseDto'];

// NB: there is NO super-admin identity endpoint. `GET /users/me` is the regular
// app's shared-identity route and 403s for a super-admin token (no app role).
// Identity is derived from the login response + persisted sessionStore.
// See docs/endpoints.md §0.5 and OPEN_QUESTIONS#b18.

export async function login(data: { email: string; password: string }): Promise<AuthResponse> {
  return apiClient.post('saas/auth/login', { json: data }).json<AuthResponse>();
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
  return apiClient.post('saas/auth/refresh', { json: { refreshToken } }).json<AuthResponse>();
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('saas/auth/logout', { json: { refreshToken } });
}
