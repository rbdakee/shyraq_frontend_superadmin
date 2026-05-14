import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCcw, AlertCircle } from 'lucide-react';

import { useHealthReady } from '@/hooks/use-health';
import { useNow } from '@/hooks/use-now';
import { queryKeys } from '@/hooks/query-keys';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { PulseDot } from '@/components/feedback/pulse-dot';
import { HealthRow } from '@/components/feedback/health-row';

interface HistoryEntry {
  ts: number;
  status: 'ok' | 'degraded';
  checks: { db: 'up' | 'down'; redis: 'up' | 'down' };
}

export default function SystemStatusPage() {
  const { t } = useTranslation(['shell', 'dashboard']);
  const queryClient = useQueryClient();
  const { data, isLoading, isError, dataUpdatedAt } = useHealthReady();
  const now = useNow();

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [prevDataUpdatedAt, setPrevDataUpdatedAt] = useState(0);

  // Append to history during render when dataUpdatedAt changes.
  // This is React's recommended pattern for adjusting state based on
  // changed props/query results without useEffect.
  if (data && dataUpdatedAt && dataUpdatedAt !== prevDataUpdatedAt) {
    setPrevDataUpdatedAt(dataUpdatedAt);
    setHistory((prev) => {
      if (prev[0]?.ts === dataUpdatedAt) return prev;
      return [
        {
          ts: dataUpdatedAt,
          status: data.status,
          checks: {
            db: data.checks.db ?? 'down',
            redis: data.checks.redis ?? 'down',
          },
        },
        ...prev,
      ].slice(0, 10);
    });
  }

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.health.ready() });
  };

  const tone = isError
    ? 'error'
    : data?.status === 'ok'
      ? 'success'
      : data?.status === 'degraded'
        ? 'warning'
        : 'neutral';

  const statusText = isError
    ? t('dashboard:health.error')
    : data?.status === 'degraded'
      ? t('dashboard:health.degraded')
      : data?.status === 'ok'
        ? t('dashboard:health.ok')
        : t('dashboard:health.error');

  const seconds = dataUpdatedAt > 0 ? Math.max(0, Math.floor((now - dataUpdatedAt) / 1000)) : -1;

  const subtitleText =
    dataUpdatedAt > 0
      ? `${new Date(dataUpdatedAt).toLocaleString('ru-RU')} (${seconds === 0 ? t('dashboard:health.updated_now') : t('dashboard:health.updated_ago', { seconds })})`
      : '—';

  const downServices: string[] = [];
  if (data?.status === 'degraded') {
    if (data.checks.db === 'down') {
      downServices.push(
        `${t('dashboard:health.components.db')} ${t('dashboard:health.status.down')}`,
      );
    }
    if (data.checks.redis === 'down') {
      downServices.push(
        `${t('dashboard:health.components.redis')} ${t('dashboard:health.status.down')}`,
      );
    }
  }

  const isInitialLoading = isLoading && !data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('shell:nav.system_status')}
        subtitle={subtitleText}
        actions={
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCcw className="size-4" />
            {t('dashboard:system_status.refresh')}
          </Button>
        }
      />

      {/* Top status block */}
      <Card>
        <CardContent className="pt-2">
          <div className="flex items-center gap-3">
            <PulseDot tone={tone} size="md" />
            <span className="text-lg font-semibold">{statusText}</span>
          </div>
          {downServices.length > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="size-4" />
              <AlertDescription>{downServices.join(', ')}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Components table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard:health.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isInitialLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : (
            <div className="space-y-3">
              <HealthRow
                name={t('dashboard:health.components.api')}
                status="up"
                lastCheckedAt={dataUpdatedAt || null}
              />
              <HealthRow
                name={t('dashboard:health.components.db')}
                status={data?.checks.db ?? 'down'}
                lastCheckedAt={dataUpdatedAt || null}
              />
              <HealthRow
                name={t('dashboard:health.components.redis')}
                status={data?.checks.redis ?? 'down'}
                lastCheckedAt={dataUpdatedAt || null}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* History block */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard:system_status.history_title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('dashboard:system_status.history_empty')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <div className="grid grid-cols-4 gap-4 border-b pb-2 text-xs font-medium text-muted-foreground">
                <span>Time</span>
                <span>DB</span>
                <span>Redis</span>
                <span>Result</span>
              </div>
              {history.map((entry) => (
                <div
                  key={entry.ts}
                  className="grid grid-cols-4 items-center gap-4 border-b py-2 last:border-b-0"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {new Date(entry.ts).toLocaleTimeString('ru-RU')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <PulseDot tone={entry.checks.db === 'up' ? 'success' : 'error'} />
                    <span className="text-xs">
                      {t(`dashboard:health.status.${entry.checks.db}`)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <PulseDot tone={entry.checks.redis === 'up' ? 'success' : 'error'} />
                    <span className="text-xs">
                      {t(`dashboard:health.status.${entry.checks.redis}`)}
                    </span>
                  </div>
                  <span className="text-xs font-medium">
                    {entry.status === 'ok'
                      ? t('dashboard:system_status.result_ok')
                      : t('dashboard:system_status.result_degraded')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
