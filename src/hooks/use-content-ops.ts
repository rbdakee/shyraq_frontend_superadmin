import { useMutation } from '@tanstack/react-query';
import * as contentApi from '@/api/content-ops';

export function useBirthdayRun() {
  return useMutation({ mutationFn: contentApi.triggerBirthdayRun });
}

export function useStoryCleanupRun() {
  return useMutation({ mutationFn: contentApi.triggerStoryCleanupRun });
}

export function usePublishScheduledRun() {
  return useMutation({ mutationFn: contentApi.triggerPublishScheduledRun });
}
