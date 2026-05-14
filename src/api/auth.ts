import type { components } from './types/openapi';
import { apiClient } from './client';

type AuthResponse = components['schemas']['SuperAdminAuthResponseDto'];
type UserMe = components['schemas']['UserResponseDto'];

export async function login(data: { email: string; password: string }): Promise<AuthResponse> {
  return apiClient.post('saas/auth/login', { json: data }).json<AuthResponse>();
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
  return apiClient.post('saas/auth/refresh', { json: { refreshToken } }).json<AuthResponse>();
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('saas/auth/logout', { json: { refreshToken } });
}

export async function getCurrentUser(): Promise<UserMe> {
  return apiClient.get('users/me').json<UserMe>();
}
