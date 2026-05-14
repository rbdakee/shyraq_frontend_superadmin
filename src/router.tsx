import { createBrowserRouter, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';

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
      { path: '/login', element: <div>login</div> },
      { path: '/', element: <div>dashboard</div> },
      { path: '/kindergartens', element: <div>kindergartens</div> },
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
      { path: '/operations/schedule-rollout', element: <div>operations/schedule-rollout</div> },
      { path: '/operations/lifecycle-dlq', element: <div>operations/lifecycle-dlq</div> },
      { path: '/system-status', element: <div>system-status</div> },
      { path: '/404', element: <div>404 not found</div> },
      { path: '/403', element: <div>403 forbidden</div> },
      { path: '/500', element: <div>500 server error</div> },
      { path: '*', element: <div>not found</div> },
    ],
  },
]);
