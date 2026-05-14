import { apiClient } from './client';
import type { components } from './types/openapi';

type KindergartenListResponse = components['schemas']['KindergartenListResponseDto'];
export type Kindergarten = components['schemas']['KindergartenDto'];

export interface ListKindergartensParams {
  plan?: string;
  is_active?: boolean;
  archived?: boolean;
  name_search?: string;
  limit?: number;
  offset?: number;
}

export async function listKindergartens(
  params: ListKindergartensParams = {},
): Promise<KindergartenListResponse> {
  return apiClient
    .get('saas/kindergartens', { searchParams: cleanParams(params) })
    .json<KindergartenListResponse>();
}

function cleanParams(params: ListKindergartensParams): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v as string | number | boolean;
  }
  return out;
}
