import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as kaspiApi from '@/api/kaspi';
import type { KaspiGlobalConfig, UpdateKaspiConfigBody, KaspiVersionProbeBody } from '@/api/kaspi';
import { queryKeys } from './query-keys';

export type { KaspiGlobalConfig, UpdateKaspiConfigBody };

export function useKaspiConfig() {
  return useQuery({
    queryKey: queryKeys.kaspi.config(),
    queryFn: kaspiApi.getKaspiConfig,
  });
}

export function useUpdateKaspiConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateKaspiConfigBody) => kaspiApi.updateKaspiConfig(body),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.kaspi.config(), data);
      // The gate status in /health/ready may shift once the config changes.
      qc.invalidateQueries({ queryKey: queryKeys.health.ready() });
    },
  });
}

export function useProbeKaspiVersion() {
  return useMutation({
    mutationFn: (body?: KaspiVersionProbeBody) => kaspiApi.probeKaspiVersion(body),
    retry: 0,
  });
}
