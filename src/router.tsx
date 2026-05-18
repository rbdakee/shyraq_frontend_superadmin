import { lazy } from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Shell } from '@/components/layout/shell';

// Eager: small / frequently shown / error pages
import LoginPage from '@/routes/login';
import NotFoundPage from '@/routes/_404';
import ServerErrorPage from '@/routes/_500';

// Eager: BlockedFeature placeholders (trivial size, no Suspense flash)
import KindergartenSettingsPage from '@/routes/kindergartens/$id/settings';
import KindergartenSubscriptionPage from '@/routes/kindergartens/$id/subscription';
import KindergartenFlagsPage from '@/routes/kindergartens/$id/flags';
import KindergartenViewAsPage from '@/routes/kindergartens/$id/view-as';
import SubscriptionsPage from '@/routes/subscriptions';
import FeatureFlagsPage from '@/routes/feature-flags';
import UsersPage from '@/routes/users/index';
import UsersNewPage from '@/routes/users/new';
import UsersEditPage from '@/routes/users/$id';

/* eslint-disable react-refresh/only-export-components -- lazy route chunks are not HMR components */
const DashboardPage = lazy(() => import('./routes/dashboard'));
const SystemStatusPage = lazy(() => import('./routes/system-status'));
const KindergartensListPage = lazy(() => import('./routes/kindergartens'));
const KindergartenCreatePage = lazy(() => import('./routes/kindergartens/new'));
const KindergartenDetailPage = lazy(() => import('./routes/kindergartens/$id'));
const KindergartenAdminsPage = lazy(() => import('./routes/kindergartens/$id/admins'));
const OperationsBillingPage = lazy(() => import('./routes/operations/billing'));
const OperationsContentPage = lazy(() => import('./routes/operations/content'));
const OperationsScheduleRolloutPage = lazy(() => import('./routes/operations/schedule-rollout'));
const OperationsLifecycleDlqPage = lazy(() => import('./routes/operations/lifecycle-dlq'));
/* eslint-enable react-refresh/only-export-components */

// eslint-disable-next-line react-refresh/only-export-components
const RootLayout = () => (
  <>
    <Toaster position="top-right" richColors />
    <Outlet />
  </>
);

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        element: <AuthGuard />,
        errorElement: <ServerErrorPage />,
        children: [
          {
            element: <Shell />,
            children: [
              { path: '/', element: <DashboardPage /> },
              { path: '/kindergartens', element: <KindergartensListPage /> },
              { path: '/kindergartens/new', element: <KindergartenCreatePage /> },
              {
                path: '/kindergartens/:id',
                children: [
                  { index: true, element: <KindergartenDetailPage /> },
                  { path: 'admins', element: <KindergartenAdminsPage /> },
                  { path: 'settings', element: <KindergartenSettingsPage /> },
                  { path: 'subscription', element: <KindergartenSubscriptionPage /> },
                  { path: 'flags', element: <KindergartenFlagsPage /> },
                  { path: 'view-as', element: <KindergartenViewAsPage /> },
                ],
              },
              { path: '/subscriptions', element: <SubscriptionsPage /> },
              { path: '/feature-flags', element: <FeatureFlagsPage /> },
              { path: '/users', element: <UsersPage /> },
              { path: '/users/new', element: <UsersNewPage /> },
              { path: '/users/:id', element: <UsersEditPage /> },
              { path: '/operations/billing', element: <OperationsBillingPage /> },
              { path: '/operations/content', element: <OperationsContentPage /> },
              {
                path: '/operations/schedule-rollout',
                element: <OperationsScheduleRolloutPage />,
              },
              { path: '/operations/lifecycle-dlq', element: <OperationsLifecycleDlqPage /> },
              { path: '/system-status', element: <SystemStatusPage /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
