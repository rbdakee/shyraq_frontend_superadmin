import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as bccApi from '@/api/bcc';
import type {
  BccAccountResponseDto,
  RotateBccMacDto,
  UpsertBccAccountDto,
} from '@/api/bcc';
import { isAppError } from '@/lib/error-guards';
import { queryKeys } from './query-keys';

export type {
  BccAccountResponseDto,
  BccAccountProvisioningResponseDto,
  BccCallbackCredentials,
  BccConnectionCheckResponseDto,
  UpsertBccAccountDto,
  RotateBccMacDto,
} from '@/api/bcc';

/**
 * GET .../bcc/account.
 *
 * The backend returns 404 (code `bcc_account_not_found`) when the kindergarten
 * has never been onboarded. That is a normal "empty" state — NOT an error — so
 * we neither retry it nor surface it as `isError`. The route reads
 * `notOnboarded` to render the create/empty form.
 */
export function useBccAccount(kindergartenId: string) {
  const query = useQuery({
    queryKey: queryKeys.bcc.account(kindergartenId),
    queryFn: () => bccApi.getBccAccount(kindergartenId),
    enabled: !!kindergartenId,
    retry: (failureCount, error) => {
      if (isAppError(error) && error.status === 404) return false;
      return failureCount < 2;
    },
  });

  const notOnboarded = isAppError(query.error) && query.error.status === 404;

  return {
    ...query,
    notOnboarded,
    // A 404 is an expected state, so it must not read as a hard error.
    isError: query.isError && !notOnboarded,
  };
}

function useBccQueryInvalidator(kindergartenId: string) {
  const qc = useQueryClient();
  return (data?: BccAccountResponseDto) => {
    if (data) {
      qc.setQueryData(queryKeys.bcc.account(kindergartenId), data);
    }
    void qc.invalidateQueries({ queryKey: queryKeys.bcc.account(kindergartenId) });
  };
}

export function useUpsertBccAccount(kindergartenId: string) {
  const invalidate = useBccQueryInvalidator(kindergartenId);
  return useMutation({
    mutationFn: (body: UpsertBccAccountDto) => bccApi.upsertBccAccount(kindergartenId, body),
    onSuccess: (data) => {
      // Provisioning response is a superset of the account DTO — safe to cache.
      invalidate(data);
    },
  });
}

export function useCheckBccConnection(kindergartenId: string) {
  const invalidate = useBccQueryInvalidator(kindergartenId);
  return useMutation({
    mutationFn: () => bccApi.checkBccConnection(kindergartenId),
    retry: 0,
    onSuccess: () => invalidate(),
  });
}

export function useDisableBccAccount(kindergartenId: string) {
  const invalidate = useBccQueryInvalidator(kindergartenId);
  return useMutation({
    mutationFn: () => bccApi.disableBccAccount(kindergartenId),
    onSuccess: () => invalidate(),
  });
}

export function useRotateBccMac(kindergartenId: string) {
  const invalidate = useBccQueryInvalidator(kindergartenId);
  return useMutation({
    mutationFn: (body: RotateBccMacDto) => bccApi.rotateBccMac(kindergartenId, body),
    onSuccess: (data) => invalidate(data),
  });
}

export function useRotateBccCallbackCredentials(kindergartenId: string) {
  const invalidate = useBccQueryInvalidator(kindergartenId);
  return useMutation({
    mutationFn: () => bccApi.rotateBccCallbackCredentials(kindergartenId),
    // Rotating callback creds does not change base account fields, but the
    // account may still need a re-check afterwards — refresh to be safe.
    onSuccess: () => invalidate(),
  });
}
