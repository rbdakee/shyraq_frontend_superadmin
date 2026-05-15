import { useMutation } from '@tanstack/react-query';
import * as billingApi from '@/api/billing-ops';

export function useMonthlyRun() {
  return useMutation({ mutationFn: billingApi.triggerMonthlyRun });
}

export function useDiscountExpireRun() {
  return useMutation({ mutationFn: billingApi.triggerDiscountExpireRun });
}

export function useOverdueRun() {
  return useMutation({ mutationFn: billingApi.triggerOverdueRun });
}
