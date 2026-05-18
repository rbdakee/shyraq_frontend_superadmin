export const routes = {
  kindergartens: {
    list: () => '/kindergartens',
    new: () => '/kindergartens/new',
    detail: (id: string) => `/kindergartens/${id}`,
    settings: (id: string) => `/kindergartens/${id}/settings`,
    subscription: (id: string) => `/kindergartens/${id}/subscription`,
    flags: (id: string) => `/kindergartens/${id}/flags`,
    viewAs: (id: string) => `/kindergartens/${id}/view-as`,
    admins: (id: string) => `/kindergartens/${id}/admins`,
  },
  operations: {
    billing: () => '/operations/billing',
    content: () => '/operations/content',
    scheduleRollout: () => '/operations/schedule-rollout',
    lifecycleDlq: () => '/operations/lifecycle-dlq',
  },
  subscriptions: () => '/subscriptions',
  featureFlags: () => '/feature-flags',
  users: {
    list: () => '/users',
    new: () => '/users/new',
    detail: (id: string) => `/users/${id}`,
  },
  systemStatus: () => '/system-status',
  dashboard: () => '/',
  login: () => '/login',
};
