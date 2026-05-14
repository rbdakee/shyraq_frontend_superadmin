import { useQuery } from '@tanstack/react-query';
import * as healthApi from '@/api/health';
import { queryKeys } from './query-keys';

export function useHealthReady() {
  return useQuery({
    queryKey: queryKeys.health.ready(),
    queryFn: healthApi.getReady,
    refetchInterval: 30_000,
    retry: 0,
    staleTime: 0,
  });
}
