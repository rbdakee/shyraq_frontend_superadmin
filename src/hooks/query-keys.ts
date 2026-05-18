export const queryKeys = {
  auth: { me: () => ['auth', 'me'] as const },
  kindergartens: {
    all: () => ['kindergartens'] as const,
    list: (params: import('@/api/kindergartens').ListKindergartensParams) =>
      ['kindergartens', 'list', params] as const,
    detail: (id: string) => ['kindergartens', 'detail', id] as const,
  },
  kgAdmins: {
    all: (id: string) => ['kg-admins', id] as const,
    list: (id: string, params: import('@/api/kg-admins').ListKgAdminsParams) =>
      ['kg-admins', id, 'list', params] as const,
  },
  lifecycle: {
    all: () => ['lifecycle'] as const,
    failedJobs: (params: import('@/api/lifecycle-jobs').ListFailedJobsParams) =>
      ['lifecycle', 'failed-jobs', params] as const,
  },
  health: { ready: () => ['health', 'ready'] as const },
};
