import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as lifecycleApi from '@/api/lifecycle-jobs';
import type { ListFailedJobsParams } from '@/api/lifecycle-jobs';
import { queryKeys } from './query-keys';

export function useFailedJobs(params: ListFailedJobsParams) {
  return useQuery({
    queryKey: queryKeys.lifecycle.failedJobs(params),
    queryFn: () => lifecycleApi.listFailedJobs(params),
    staleTime: 10_000,
  });
}

export function useRetryFailedJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: lifecycleApi.retryFailedJob,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.lifecycle.all() }),
  });
}
