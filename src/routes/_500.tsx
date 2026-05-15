import { useTranslation } from 'react-i18next';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ServerErrorPageProps {
  error?: unknown;
  resetErrorBoundary?: (...args: unknown[]) => void;
}

export default function ServerErrorPage(props: ServerErrorPageProps) {
  const { resetErrorBoundary } = props;
  const { t } = useTranslation(['errors']);

  const errorId = window.__SHYRAQ_LAST_ERROR_ID__;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="grid size-22 place-items-center rounded-2xl border border-error-soft-border bg-error-soft">
          <AlertTriangle size={38} className="text-error" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">{t('errors:server_error.title')}</h1>

        <p className="text-text-secondary">{t('errors:server_error.subtitle')}</p>

        {errorId && (
          <p className="font-mono text-xs text-text-secondary">
            {t('errors:server_error.error_id_prefix')}
            {errorId}
          </p>
        )}

        <Button
          onClick={() => (resetErrorBoundary ? resetErrorBoundary() : window.location.reload())}
        >
          <RefreshCcw className="mr-2 size-4" />
          {t('errors:server_error.cta_retry')}
        </Button>
      </div>
    </div>
  );
}
