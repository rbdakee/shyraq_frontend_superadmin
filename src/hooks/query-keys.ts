export const queryKeys = {
  auth: { me: () => ['auth', 'me'] as const },
  kindergartens: {
    all: () => ['kindergartens'] as const,
    list: (params: import('@/api/kindergartens').ListKindergartensParams) =>
      ['kindergartens', 'list', params] as const,
    detail: (id: string) => ['kindergartens', 'detail', id] as const,
  },
  health: { ready: () => ['health', 'ready'] as const },
};
