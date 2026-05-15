import { apiClient } from './client';
import type { components } from './types/openapi';

type RolloutSummaryResponseDto = components['schemas']['RolloutSummaryResponseDto'];
export type RunWeeklyRolloutDto = components['schemas']['RunWeeklyRolloutDto'];

export async function runWeeklyRollout(
  body: RunWeeklyRolloutDto,
): Promise<RolloutSummaryResponseDto> {
  return apiClient
    .post('admin/schedule/week-rollout/run', { json: body })
    .json<RolloutSummaryResponseDto>();
}
