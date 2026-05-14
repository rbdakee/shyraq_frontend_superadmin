export const queryKeys = {
  auth: { me: () => ['auth', 'me'] as const },
  kindergartens: {
    list: (filters?: unknown) => ['kindergartens', 'list', filters] as const,
    detail: (id: string) => ['kindergartens', 'detail', id] as const,
  },
  health: { ready: () => ['health', 'ready'] as const },
};
