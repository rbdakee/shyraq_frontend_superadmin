import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ErrorBoundary } from 'react-error-boundary';
import ServerErrorPage from '@/routes/_500';
import { AppRoot } from '@/components/app-root';
import './lib/i18n';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  </StrictMode>,
);
