import { apiClient } from './client';

// NOTE: These DTOs are NOT present in the generated openapi.d.ts (gen:api is
// stale / backend not running), so the shapes are hand-written to mirror the
// backend BCC acquiring contract exactly (snake_case fields). If/when the
// backend schema is regenerated and exposes `Bcc*` schemas, prefer importing
// them via `components['schemas'][...]` like src/api/kaspi.ts.

export type BccAccountStatus = 'draft' | 'active' | 'disabled';
export type BccEnvironment = 'test' | 'live';

export interface BccConnectionResult {
  success: boolean;
  action: string | null;
  rc: string | null;
  rc_text: string | null;
}

export interface BccAccountResponseDto {
  connected: boolean;
  status: BccAccountStatus;
  merchant_id: string;
  terminal_id: string;
  merchant_name: string | null;
  environment: BccEnvironment;
  last_connection_checked_at: string | null;
  last_connection_result: BccConnectionResult | null;
}

/** One-time callback credentials — returned ONLY on first create / rotate-callback. */
export interface BccCallbackCredentials {
  notify_url: string;
  notify_username: string;
  notify_password: string;
}

/**
 * Response of PUT .../bcc/account. On first creation it carries the one-time
 * callback credentials inline; on subsequent upserts those three fields are absent.
 */
export type BccAccountProvisioningResponseDto = BccAccountResponseDto &
  Partial<BccCallbackCredentials>;

export interface UpsertBccAccountDto {
  merchant_id: string;
  terminal_id: string;
  merchant_name?: string;
  environment: BccEnvironment;
  mac_key_component_1: string;
  mac_key_component_2: string;
}

export interface RotateBccMacDto {
  mac_key_component_1: string;
  mac_key_component_2: string;
}

export interface BccConnectionCheckResponseDto {
  connected: boolean;
  status: BccAccountStatus;
  checked_at: string;
  result: BccConnectionResult;
}

export type BccDisableResponseDto = { status: 'disabled' };

function base(kindergartenId: string): string {
  return `saas/kindergartens/${kindergartenId}/bcc/account`;
}

export async function getBccAccount(kindergartenId: string): Promise<BccAccountResponseDto> {
  return apiClient.get(base(kindergartenId)).json<BccAccountResponseDto>();
}

export async function upsertBccAccount(
  kindergartenId: string,
  body: UpsertBccAccountDto,
): Promise<BccAccountProvisioningResponseDto> {
  return apiClient
    .put(base(kindergartenId), { json: body })
    .json<BccAccountProvisioningResponseDto>();
}

export async function checkBccConnection(
  kindergartenId: string,
): Promise<BccConnectionCheckResponseDto> {
  return apiClient
    .post(`${base(kindergartenId)}/check`)
    .json<BccConnectionCheckResponseDto>();
}

export async function disableBccAccount(
  kindergartenId: string,
): Promise<BccDisableResponseDto> {
  return apiClient.post(`${base(kindergartenId)}/disable`).json<BccDisableResponseDto>();
}

export async function rotateBccMac(
  kindergartenId: string,
  body: RotateBccMacDto,
): Promise<BccAccountResponseDto> {
  return apiClient
    .post(`${base(kindergartenId)}/rotate-mac`, { json: body })
    .json<BccAccountResponseDto>();
}

export async function rotateBccCallbackCredentials(
  kindergartenId: string,
): Promise<BccCallbackCredentials> {
  return apiClient
    .post(`${base(kindergartenId)}/rotate-callback-credentials`)
    .json<BccCallbackCredentials>();
}
