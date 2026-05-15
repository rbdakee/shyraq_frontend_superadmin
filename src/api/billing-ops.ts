import { apiClient } from './client';
import type { components } from './types/openapi';

type TriggerMonthlyRunResponseDto = components['schemas']['TriggerMonthlyRunResponseDto'];
type TriggerDiscountExpireRunResponseDto =
  components['schemas']['TriggerDiscountExpireRunResponseDto'];
type TriggerOverdueRunResponseDto = components['schemas']['TriggerOverdueRunResponseDto'];

// B.12: monthly-run body must NOT include kindergarten_id — backend returns 400 if sent.
export interface RunMonthlyRunDto {
  period_start?: string;
}

export interface RunNowDto {
  now?: string;
}

export async function triggerMonthlyRun(
  body: RunMonthlyRunDto,
): Promise<TriggerMonthlyRunResponseDto> {
  return apiClient
    .post('saas/billing/monthly-run', { json: body })
    .json<TriggerMonthlyRunResponseDto>();
}

export async function triggerDiscountExpireRun(
  body: RunNowDto,
): Promise<TriggerDiscountExpireRunResponseDto> {
  return apiClient
    .post('saas/billing/discount-expire-run', { json: body })
    .json<TriggerDiscountExpireRunResponseDto>();
}

export async function triggerOverdueRun(body: RunNowDto): Promise<TriggerOverdueRunResponseDto> {
  return apiClient
    .post('saas/billing/overdue-run', { json: body })
    .json<TriggerOverdueRunResponseDto>();
}
