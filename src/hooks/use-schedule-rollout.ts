import { useMutation } from '@tanstack/react-query';
import * as rolloutApi from '@/api/schedule-rollout';

export function useWeeklyRollout() {
  return useMutation({ mutationFn: rolloutApi.runWeeklyRollout });
}
