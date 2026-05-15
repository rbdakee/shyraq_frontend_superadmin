import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Calendar as CalIcon, Percent, AlertCircle } from 'lucide-react';
import { format, startOfMonth, endOfDay } from 'date-fns';

import { PageHeader } from '@/components/layout/page-header';
import { TriggerCard } from '@/components/operations/trigger-card';
import { TriggerResult } from '@/components/operations/trigger-result';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useMonthlyRun, useDiscountExpireRun, useOverdueRun } from '@/hooks/use-billing-ops';
import { useOperationsStore } from '@/stores/operations-store';

interface BillingAsyncResult {
  job_id: string;
  status: string;
}

export default function OperationsBillingPage() {
  const { t } = useTranslation(['operations', 'common']);

  const [monthlyDate, setMonthlyDate] = useState<Date>(() => startOfMonth(new Date()));
  const [discountNow, setDiscountNow] = useState<Date | undefined>(undefined);
  const [overdueNow, setOverdueNow] = useState<Date | undefined>(undefined);

  const monthlyMut = useMonthlyRun();
  const discountMut = useDiscountExpireRun();
  const overdueMut = useOverdueRun();

  const monthlyResult = useOperationsStore((s) => s.results['billing.monthly']);
  const discountResult = useOperationsStore((s) => s.results['billing.discount']);
  const overdueResult = useOperationsStore((s) => s.results['billing.overdue']);

  const handleMonthly = async () => {
    try {
      const result = await monthlyMut.mutateAsync({
        period_start: format(monthlyDate, 'yyyy-MM-dd'),
      });
      useOperationsStore.getState().setResult('billing.monthly', result);
      toast.success(t('operations:billing.monthly.toast_enqueued', { jobId: result.job_id }));
    } catch {
      toast.error(t('operations:billing.monthly.toast_error'));
    }
  };

  const handleDiscount = async () => {
    try {
      const result = await discountMut.mutateAsync({
        now: discountNow ? endOfDay(discountNow).toISOString() : undefined,
      });
      useOperationsStore.getState().setResult('billing.discount', result);
      toast.success(t('operations:billing.discount.toast_enqueued', { jobId: result.job_id }));
    } catch {
      toast.error(t('operations:billing.monthly.toast_error'));
    }
  };

  const handleOverdue = async () => {
    try {
      const result = await overdueMut.mutateAsync({
        now: overdueNow ? endOfDay(overdueNow).toISOString() : undefined,
      });
      useOperationsStore.getState().setResult('billing.overdue', result);
      toast.success(t('operations:billing.overdue.toast_enqueued', { jobId: result.job_id }));
    } catch {
      toast.error(t('operations:billing.monthly.toast_error'));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('operations:billing.page_title')}
        subtitle={t('operations:billing.page_subtitle')}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Invoice Generation */}
        <TriggerCard
          title={t('operations:billing.monthly.title')}
          icon={<CalIcon className="size-5" />}
          description={t('operations:billing.monthly.description')}
          formFields={
            <div className="flex flex-col gap-1.5">
              <Label>{t('operations:billing.monthly.period_label')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    <CalIcon className="mr-2 size-4" />
                    {format(monthlyDate, 'yyyy-MM-dd')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={monthlyDate}
                    onSelect={(d) => d && setMonthlyDate(d)}
                    disabled={(d) => d.getDate() !== 1}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                {t('operations:billing.monthly.period_hint')}
              </p>
            </div>
          }
          onTrigger={handleMonthly}
          triggerLabel={t('operations:billing.monthly.trigger')}
          triggerPendingLabel="..."
          isPending={monthlyMut.isPending}
          confirmTitle={t('operations:billing.monthly.confirm_title')}
          confirmDescription={t('operations:billing.monthly.confirm_description', {
            month: format(monthlyDate, 'yyyy-MM'),
          })}
          confirmLabel={t('operations:billing.monthly.trigger')}
          cancelLabel={t('common:cancel')}
          result={
            monthlyResult ? (
              <TriggerResult
                ts={monthlyResult.ts}
                variant="async-enqueued"
                title={t('operations:billing.monthly.title')}
                rows={[
                  {
                    label: 'job_id',
                    value: (
                      <code className="font-mono text-xs">
                        {(monthlyResult.result as BillingAsyncResult).job_id}
                      </code>
                    ),
                  },
                  {
                    label: 'status',
                    value: (monthlyResult.result as BillingAsyncResult).status,
                  },
                ]}
              />
            ) : undefined
          }
        />

        {/* Discount Expire Run */}
        <TriggerCard
          title={t('operations:billing.discount.title')}
          icon={<Percent className="size-5" />}
          description={t('operations:billing.discount.description')}
          formFields={
            <div className="flex flex-col gap-1.5">
              <Label>{t('operations:billing.discount.now_label')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    <CalIcon className="mr-2 size-4" />
                    {discountNow
                      ? format(discountNow, 'yyyy-MM-dd')
                      : t('operations:billing.discount.now_placeholder')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={discountNow} onSelect={setDiscountNow} />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                {t('operations:billing.discount.now_hint')}
              </p>
            </div>
          }
          onTrigger={handleDiscount}
          triggerLabel={t('operations:billing.discount.trigger')}
          triggerPendingLabel="..."
          isPending={discountMut.isPending}
          confirmTitle={t('operations:billing.discount.confirm_title')}
          confirmLabel={t('operations:billing.discount.trigger')}
          cancelLabel={t('common:cancel')}
          result={
            discountResult ? (
              <TriggerResult
                ts={discountResult.ts}
                variant="async-enqueued"
                title={t('operations:billing.discount.title')}
                rows={[
                  {
                    label: 'job_id',
                    value: (
                      <code className="font-mono text-xs">
                        {(discountResult.result as BillingAsyncResult).job_id}
                      </code>
                    ),
                  },
                  {
                    label: 'status',
                    value: (discountResult.result as BillingAsyncResult).status,
                  },
                ]}
              />
            ) : undefined
          }
        />

        {/* Overdue Invoice Sweep */}
        <TriggerCard
          title={t('operations:billing.overdue.title')}
          icon={<AlertCircle className="size-5" />}
          description={t('operations:billing.overdue.description')}
          formFields={
            <div className="flex flex-col gap-1.5">
              <Label>{t('operations:billing.overdue.now_label')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    <CalIcon className="mr-2 size-4" />
                    {overdueNow
                      ? format(overdueNow, 'yyyy-MM-dd')
                      : t('operations:billing.overdue.now_placeholder')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={overdueNow} onSelect={setOverdueNow} />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                {t('operations:billing.overdue.now_hint')}
              </p>
            </div>
          }
          onTrigger={handleOverdue}
          triggerLabel={t('operations:billing.overdue.trigger')}
          triggerPendingLabel="..."
          isPending={overdueMut.isPending}
          confirmTitle={t('operations:billing.overdue.confirm_title')}
          confirmLabel={t('operations:billing.overdue.trigger')}
          cancelLabel={t('common:cancel')}
          result={
            overdueResult ? (
              <TriggerResult
                ts={overdueResult.ts}
                variant="async-enqueued"
                title={t('operations:billing.overdue.title')}
                rows={[
                  {
                    label: 'job_id',
                    value: (
                      <code className="font-mono text-xs">
                        {(overdueResult.result as BillingAsyncResult).job_id}
                      </code>
                    ),
                  },
                  {
                    label: 'status',
                    value: (overdueResult.result as BillingAsyncResult).status,
                  },
                ]}
              />
            ) : undefined
          }
        />
      </div>
    </div>
  );
}
