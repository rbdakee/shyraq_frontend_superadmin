import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as kgAdminsApi from '@/api/kg-admins';
import type { KindergartenAdminDto } from '@/api/kg-admins';
import { queryKeys } from './query-keys';

export type { KindergartenAdminDto };

export function useKgAdmins(id: string, opts: { isActive?: boolean }) {
  return useQuery({
    queryKey: queryKeys.kgAdmins.list(id, { is_active: opts.isActive }),
    queryFn: () => kgAdminsApi.listKgAdmins(id, { is_active: opts.isActive }),
    enabled: !!id,
  });
}

export function useCreateKgAdmin(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof kgAdminsApi.createKgAdmin>[1]) =>
      kgAdminsApi.createKgAdmin(id, body),
    onSuccess: () => {
      // Invalidate all list variants for this kindergarten so both filtered and
      // unfiltered queries reflect the new admin.
      qc.invalidateQueries({ queryKey: queryKeys.kgAdmins.all(id) });
    },
  });
}
