import { apiClient } from './client';
import type { components } from './types/openapi';

export type KaspiGlobalConfig = components['schemas']['KaspiGlobalConfigResponseDto'];
export type UpdateKaspiConfigBody = components['schemas']['UpdateKaspiGlobalConfigDto'];
export type KaspiVersionProbeBody = components['schemas']['KaspiVersionProbeDto'];
export type KaspiVersionProbeResult = components['schemas']['KaspiVersionProbeResponseDto'];

export async function getKaspiConfig(): Promise<KaspiGlobalConfig> {
  return apiClient.get('saas/kaspi/config').json<KaspiGlobalConfig>();
}

export async function updateKaspiConfig(body: UpdateKaspiConfigBody): Promise<KaspiGlobalConfig> {
  return apiClient.put('saas/kaspi/config', { json: body }).json<KaspiGlobalConfig>();
}

export async function probeKaspiVersion(
  body?: KaspiVersionProbeBody,
): Promise<KaspiVersionProbeResult> {
  return apiClient
    .post('saas/kaspi/version-probe', body ? { json: body } : undefined)
    .json<KaspiVersionProbeResult>();
}
