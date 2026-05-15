import { apiClient } from './client';
import type { components } from './types/openapi';

type ListLifecycleFailedJobsResponseDto =
  components['schemas']['ListLifecycleFailedJobsResponseDto'];
type RetryLifecycleFailedJobResponseDto =
  components['schemas']['RetryLifecycleFailedJobResponseDto'];

export interface ListFailedJobsParams {
  limit?: number;
  cursor?: string;
}

export async function listFailedJobs(
  params: ListFailedJobsParams = {},
): Promise<ListLifecycleFailedJobsResponseDto> {
  const searchParams: Record<string, string | number> = {};
  if (params.limit !== undefined) searchParams.limit = params.limit;
  if (params.cursor) searchParams.cursor = params.cursor;
  return apiClient
    .get('admin/lifecycle/failed-jobs', { searchParams })
    .json<ListLifecycleFailedJobsResponseDto>();
}

export async function retryFailedJob(id: string): Promise<RetryLifecycleFailedJobResponseDto> {
  // NB: backend requires empty {} body (endpoints.md §8.2).
  return apiClient
    .post(`admin/lifecycle/failed-jobs/${id}/retry`, { json: {} })
    .json<RetryLifecycleFailedJobResponseDto>();
}
