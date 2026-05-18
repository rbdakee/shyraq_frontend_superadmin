import { apiClient } from './client';
import type { components } from './types/openapi';

export type KindergartenAdminDto = components['schemas']['KindergartenAdminDto'];
type AddKindergartenAdminDto = components['schemas']['AddKindergartenAdminDto'];
type AddKindergartenAdminResponseDto = components['schemas']['AddKindergartenAdminResponseDto'];

export interface ListKgAdminsParams {
  is_active?: boolean;
}

export async function listKgAdmins(
  id: string,
  params?: ListKgAdminsParams,
): Promise<KindergartenAdminDto[]> {
  const searchParams: Record<string, string | boolean> = {};
  if (params?.is_active !== undefined) {
    searchParams['is_active'] = params.is_active;
  }
  return apiClient
    .get(`saas/kindergartens/${id}/admins`, {
      searchParams: Object.keys(searchParams).length > 0 ? searchParams : undefined,
    })
    .json<KindergartenAdminDto[]>();
}

export async function createKgAdmin(
  id: string,
  body: AddKindergartenAdminDto,
): Promise<AddKindergartenAdminResponseDto> {
  return apiClient
    .post(`saas/kindergartens/${id}/admins`, { json: body })
    .json<AddKindergartenAdminResponseDto>();
}
