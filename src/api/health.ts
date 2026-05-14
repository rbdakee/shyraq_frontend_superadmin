import { apiClient } from './client';
import type { components } from './types/openapi';

type HealthStatus = components['schemas']['HealthStatusDto'];
type HealthReady = components['schemas']['HealthReadyDto'];

export async function getHealth(): Promise<HealthStatus> {
  return apiClient.get('health').json<HealthStatus>();
}

export async function getReady(): Promise<HealthReady> {
  return apiClient.get('health/ready').json<HealthReady>();
}
