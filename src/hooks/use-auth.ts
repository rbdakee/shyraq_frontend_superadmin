import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as authApi from '@/api/auth';
import { tokenStorage } from '@/lib/token-storage';
import { safeNext } from '@/lib/safe-next';
import { useSessionStore } from '@/stores/session-store';
import { queryKeys } from './query-keys';

export function useLogin() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setSession = useSessionStore((s) => s.setSession);

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data, vars) => {
      tokenStorage.setBoth({
        access: data.access_token,
        refresh: data.refresh_token,
      });
      setSession({
        email: vars.email,
        role: data.roles[0].role as 'super_admin' | 'support',
      });
      void qc.invalidateQueries({ queryKey: queryKeys.auth.me() });
      navigate(safeNext(params.get('next')) ?? '/', { replace: true });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const clearSession = useSessionStore((s) => s.clearSession);

  return useMutation({
    mutationFn: async () => {
      const r = tokenStorage.getRefresh();
      if (r) {
        try {
          await authApi.logout(r);
        } catch {
          /* token already revoked is fine */
        }
      }
    },
    onSettled: () => {
      tokenStorage.clear();
      clearSession();
      qc.clear();
      navigate('/login', { replace: true });
    },
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: authApi.getCurrentUser,
    enabled: !!tokenStorage.getRefresh(),
    staleTime: 5 * 60_000,
  });
}
