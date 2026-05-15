import { apiClient } from './client';
import type { components } from './types/openapi';

type KindergartenListResponse = components['schemas']['KindergartenListResponseDto'];
export type Kindergarten = components['schemas']['KindergartenDto'];

type CreateKindergartenDto = components['schemas']['CreateKindergartenDto'];
type CreateKindergartenResponseDto = components['schemas']['CreateKindergartenResponseDto'];
type InviteAdminDto = components['schemas']['InviteAdminDto'];
type InviteAdminResponseDto = components['schemas']['InviteAdminResponseDto'];

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

export async function createKindergarten(
  body: CreateKindergartenDto,
): Promise<CreateKindergartenResponseDto> {
  return apiClient.post('saas/kindergartens', { json: body }).json<CreateKindergartenResponseDto>();
}

export async function archiveKindergarten(id: string): Promise<Kindergarten> {
  return apiClient.post(`saas/kindergartens/${id}/archive`).json<Kindergarten>();
}

export async function restoreKindergarten(id: string): Promise<Kindergarten> {
  return apiClient.post(`saas/kindergartens/${id}/restore`).json<Kindergarten>();
}

export async function inviteAdmin(
  id: string,
  body: InviteAdminDto,
): Promise<InviteAdminResponseDto> {
  return apiClient
    .post(`saas/kindergartens/${id}/admin/invite`, { json: body })
    .json<InviteAdminResponseDto>();
}

function cleanParams(params: ListKindergartensParams): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v as string | number | boolean;
  }
  return out;
}
