import { createBrowserRouter, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Shell } from '@/components/layout/shell';
import LoginPage from '@/routes/login';
import DashboardPage from '@/routes/dashboard';
import SystemStatusPage from '@/routes/system-status';
import KindergartensListPage from '@/routes/kindergartens';
import KindergartenCreatePage from '@/routes/kindergartens/new';
import KindergartenDetailPage from '@/routes/kindergartens/$id';
import KindergartenSettingsPage from '@/routes/kindergartens/$id/settings';
import KindergartenSubscriptionPage from '@/routes/kindergartens/$id/subscription';
import KindergartenFlagsPage from '@/routes/kindergartens/$id/flags';
import KindergartenViewAsPage from '@/routes/kindergartens/$id/view-as';
import SubscriptionsPage from '@/routes/subscriptions';
import FeatureFlagsPage from '@/routes/feature-flags';
import UsersPage from '@/routes/users/index';
import UsersNewPage from '@/routes/users/new';
import UsersEditPage from '@/routes/users/$id';
import OperationsBillingPage from '@/routes/operations/billing';
import OperationsContentPage from '@/routes/operations/content';
import OperationsScheduleRolloutPage from '@/routes/operations/schedule-rollout';
import OperationsLifecycleDlqPage from '@/routes/operations/lifecycle-dlq';
import NotFoundPage from '@/routes/_404';
import ServerErrorPage from '@/routes/_500';

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
