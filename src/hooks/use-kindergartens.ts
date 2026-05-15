import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as kindergartensApi from '@/api/kindergartens';
import type { ListKindergartensParams } from '@/api/kindergartens';
import { queryKeys } from './query-keys';
import type { components } from '@/api/types/openapi';

type Kindergarten = components['schemas']['KindergartenDto'];
type KindergartenListResponseDto = components['schemas']['KindergartenListResponseDto'];

export function useKindergartens(params: ListKindergartensParams) {
  return useQuery({
    queryKey: queryKeys.kindergartens.list(params),
    queryFn: () => kindergartensApi.listKindergartens(params),
  });
}

export function useCreateKindergarten() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: kindergartensApi.createKindergarten,
    onSuccess: (result) => {
      qc.setQueryData(queryKeys.kindergartens.detail(result.kindergarten.id), result.kindergarten);
      qc.invalidateQueries({ queryKey: queryKeys.kindergartens.all() });
    },
  });
}

export function useArchiveKindergarten() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => kindergartensApi.archiveKindergarten(id),
    onSuccess: (result) => {
      qc.setQueryData(queryKeys.kindergartens.detail(result.id), result);
      qc.invalidateQueries({ queryKey: queryKeys.kindergartens.all() });
    },
  });
}

export function useRestoreKindergarten() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => kindergartensApi.restoreKindergarten(id),
    onSuccess: (result) => {
      qc.setQueryData(queryKeys.kindergartens.detail(result.id), result);
      qc.invalidateQueries({ queryKey: queryKeys.kindergartens.all() });
    },
  });
}

export function useInviteAdmin() {
  return useMutation({
    mutationFn: ({ id, phone }: { id: string; phone: string }) =>
      kindergartensApi.inviteAdmin(id, { phone }),
  });
}

export function useKindergartenFromCache(id: string | undefined): Kindergarten | undefined {
  const qc = useQueryClient();
  if (!id) return undefined;

  const single = qc.getQueryData<Kindergarten>(queryKeys.kindergartens.detail(id));
  if (single) return single;

  const matches = qc.getQueriesData<KindergartenListResponseDto>({
    queryKey: queryKeys.kindergartens.all(),
  });
  for (const [, data] of matches) {
    const found = data?.items?.find((k) => k.id === id);
    if (found) return found;
  }
  return undefined;
}
