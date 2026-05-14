import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus, Receipt, CalendarSync, AlertTriangle } from 'lucide-react';
import { useHealthReady } from '@/hooks/use-health';
import { useNow } from '@/hooks/use-now';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PulseDot } from '@/components/feedback/pulse-dot';
import { HealthRow } from '@/components/feedback/health-row';
import { QuickAction } from '@/components/feedback/quick-action';
import { Stat } from '@/components/feedback/stat';

export default function DashboardPage() {
  const { t } = useTranslation(['dashboard']);
  const { data, isLoading, isError, dataUpdatedAt } = useHealthReady();
  const now = useNow();

  const tone = isError
    ? 'error'
    : data?.status === 'ok'
      ? 'success'
      : data?.status === 'degraded'
        ? 'warning'
        : 'neutral';

  const seconds = dataUpdatedAt === 0 ? 0 : Math.max(0, Math.floor((now - dataUpdatedAt) / 1000));

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">{t('dashboard:title')}</h1>
        <p className="text-sm text-text-secondary">{t('dashboard:subtitle')}</p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('dashboard:health.title')}</CardTitle>
              <PulseDot tone={tone} size="md" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : isError ? (
              <p className="text-sm text-error">{t('dashboard:health.error')}</p>
            ) : data ? (
              <div className="flex flex-col gap-3">
                <HealthRow
                  name={t('dashboard:health.components.db')}
                  status={data.checks.db ?? 'down'}
                />
                <HealthRow
                  name={t('dashboard:health.components.redis')}
                  status={data.checks.redis ?? 'down'}
                />
              </div>
            ) : null}

            <p className="mt-3 text-xs text-text-secondary">
              {dataUpdatedAt === 0
                ? t('dashboard:health.updated_now')
                : t('dashboard:health.updated_ago', { seconds })}
            </p>

            <div className="mt-3 flex justify-end">
              <Link to="/system-status" className="text-sm text-brand hover:underline">
                {t('dashboard:health.details')}
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard:quick.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <QuickAction
                to="/kindergartens/new"
                icon={Plus}
                label={t('dashboard:quick.create_kg')}
              />
              <QuickAction
                to="/operations/billing"
                icon={Receipt}
                label={t('dashboard:quick.monthly_run')}
              />
              <QuickAction
                to="/operations/schedule-rollout"
                icon={CalendarSync}
                label={t('dashboard:quick.rollout')}
              />
              <QuickAction
                to="/operations/lifecycle-dlq"
                icon={AlertTriangle}
                label={t('dashboard:quick.failed_jobs')}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('dashboard:platform.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-8">
            {/* TODO(B4): wire active_kgs via useKindergartens({is_active:true,limit:1}).total once hook lands in B4 */}
            <Stat
              label={t('dashboard:platform.active_kgs')}
              value={t('dashboard:platform.placeholder')}
            />
            <Stat
              label={t('dashboard:platform.archived_kgs')}
              value={t('dashboard:platform.placeholder')}
            />
            <Stat
              label={t('dashboard:platform.active_subscriptions')}
              value={t('dashboard:platform.placeholder')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
