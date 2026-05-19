import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { ErrorBoundary } from 'react-error-boundary';
import ServerErrorPage from '@/routes/_500';
import { AppRoot } from '@/components/app-root';
import './lib/i18n';
import './styles/globals.css';

// Persist the query cache to sessionStorage so a hard refresh (Ctrl+R) keeps
// list-row data alive — detail pages (/kindergartens/:id) read the kg from it
// since there is no GET /saas/kindergartens/:id endpoint yet. See
// OPEN_QUESTIONS#b8. gcTime must outlive maxAge or restored entries get
// collected before they're read.
const CACHE_MAX_AGE = 1000 * 60 * 60 * 24;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: CACHE_MAX_AGE,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.sessionStorage,
  key: 'shyraq.sa.qcache',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: CACHE_MAX_AGE, buster: __APP_VERSION__ }}
    >
      <ErrorBoundary
        FallbackComponent={ServerErrorPage}
        onError={(error) => {
          const errorId = crypto.randomUUID();
          console.error('[errorId=', errorId, ']', error);
          window.__SHYRAQ_LAST_ERROR_ID__ = errorId;
        }}
      >
        <AppRoot />
      </ErrorBoundary>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </PersistQueryClientProvider>
  </StrictMode>,
);
