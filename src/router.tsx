import { createBrowserRouter, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Shell } from '@/components/layout/shell';
import LoginPage from '@/routes/login';
import DashboardPage from '@/routes/dashboard';
import SystemStatusPage from '@/routes/system-status';
import KindergartensListPage from '@/routes/kindergartens';
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
              { path: '/kindergartens/new', element: <div>kindergartens/new</div> },
              {
                path: '/kindergartens/:id',
                children: [
                  { index: true, element: <div>kindergartens/:id (overview)</div> },
                  { path: 'settings', element: <div>kindergartens/:id/settings</div> },
                  { path: 'subscription', element: <div>kindergartens/:id/subscription</div> },
                  { path: 'flags', element: <div>kindergartens/:id/flags</div> },
                  { path: 'view-as', element: <div>kindergartens/:id/view-as</div> },
                ],
              },
              { path: '/subscriptions', element: <div>subscriptions</div> },
              { path: '/feature-flags', element: <div>feature-flags</div> },
              { path: '/users', element: <div>users</div> },
              { path: '/users/new', element: <div>users/new</div> },
              { path: '/users/:id', element: <div>users/:id</div> },
              { path: '/operations/billing', element: <div>operations/billing</div> },
              { path: '/operations/content', element: <div>operations/content</div> },
              {
                path: '/operations/schedule-rollout',
                element: <div>operations/schedule-rollout</div>,
              },
              { path: '/operations/lifecycle-dlq', element: <div>operations/lifecycle-dlq</div> },
              { path: '/system-status', element: <SystemStatusPage /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
