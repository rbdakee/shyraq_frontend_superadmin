import { apiClient } from './client';
import type { components } from './types/openapi';

type RunTriggerResponseDto = components['schemas']['RunTriggerResponseDto'];

export interface RunNowDto {
  now?: string;
}

export async function triggerBirthdayRun(body: RunNowDto): Promise<RunTriggerResponseDto> {
  return apiClient.post('saas/content/birthday-run', { json: body }).json<RunTriggerResponseDto>();
}

export async function triggerStoryCleanupRun(body: RunNowDto): Promise<RunTriggerResponseDto> {
  return apiClient
    .post('saas/content/story-cleanup-run', { json: body })
    .json<RunTriggerResponseDto>();
}

export async function triggerPublishScheduledRun(body: RunNowDto): Promise<RunTriggerResponseDto> {
  return apiClient
    .post('saas/content/publish-scheduled-run', { json: body })
    .json<RunTriggerResponseDto>();
}
