import { useQuery } from '@tanstack/react-query';
import * as kindergartensApi from '@/api/kindergartens';
import type { ListKindergartensParams } from '@/api/kindergartens';
import { queryKeys } from './query-keys';

export function useKindergartens(params: ListKindergartensParams) {
  return useQuery({
    queryKey: queryKeys.kindergartens.list(params),
    queryFn: () => kindergartensApi.listKindergartens(params),
  });
}
