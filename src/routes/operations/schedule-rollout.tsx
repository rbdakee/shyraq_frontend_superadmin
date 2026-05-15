import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { CalendarSync } from 'lucide-react';
import { format } from 'date-fns';

import { PageHeader } from '@/components/layout/page-header';
import { TriggerCard } from '@/components/operations/trigger-card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Stat } from '@/components/feedback/stat';
import { useWeeklyRollout } from '@/hooks/use-schedule-rollout';
import { useOperationsStore } from '@/stores/operations-store';
import { formatRelativeTime } from '@/lib/format';

// openapi.d.ts types schedule/meal as Record<string, never> (inline object limitation)
// We define the actual shapes here based on endpoints.md §7.1 contract
interface RolloutScheduleResult {
  copiedGroups: number;
  skippedGroups: number;
  totalEvents: number;
}

interface RolloutMealResult {
  plansCreated: number;
  plansSkipped: number;
}

interface RolloutKgItem {
  kindergartenId: string;
  name: string;
  schedule: RolloutScheduleResult;
  meal: RolloutMealResult;
  error?: string | null;
}

interface RolloutTotals {
  kindergartens: number;
  copiedGroups: number;
  skippedGroups: number;
  totalEvents: number;
  plansCreated: number;
  plansSkipped: number;
  errors: number;
}

interface RolloutSummary {
  fromMonday: string;
  source: 'manual' | 'cron';
  kindergartens: RolloutKgItem[];
  totals: RolloutTotals;
}

export default function OperationsScheduleRolloutPage() {
  const { t } = useTranslation(['operations']);
  const [fromMonday, setFromMonday] = useState<Date | undefined>(undefined);
  const mut = useWeeklyRollout();
  const stored = useOperationsStore((s) => s.results['rollout']) as
    | { ts: number; result: unknown }
    | undefined;
  const setResult = useOperationsStore((s) => s.setResult);

  const handleTrigger = async () => {
    try {
      const result = await mut.mutateAsync({
        fromMonday: fromMonday ? format(fromMonday, 'yyyy-MM-dd') : undefined,
      });
      setResult('rollout', result);
    } catch (err: unknown) {
      const status =
        err != null &&
        typeof err === 'object' &&
        'status' in err &&
        typeof (err as { status: unknown }).status === 'number'
          ? (err as { status: number }).status
          : undefined;
      if (status === 429) {
        toast.error(t('operations:rollout.toast_error_rate_limit'));
      } else {
        toast.error(t('operations:rollout.toast_error_generic'));
      }
      console.error('[ops/rollout]', err);
    }
  };

  const formFields = (
    <div className="flex flex-col gap-1.5">
      <Label>{t('operations:rollout.from_monday_label')}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start">
            <CalendarSync className="mr-2 size-4" />
            {fromMonday
              ? format(fromMonday, 'yyyy-MM-dd')
              : t('operations:rollout.from_monday_hint')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={fromMonday}
            onSelect={setFromMonday}
            disabled={(d) => d.getDay() !== 1}
          />
        </PopoverContent>
      </Popover>
      <p className="text-xs text-muted-foreground">{t('operations:rollout.from_monday_hint')}</p>
    </div>
  );

  const resultData = stored?.result as RolloutSummary | undefined;
  const resultNode = mut.isPending ? (
    <RolloutPending labelRunning={t('operations:rollout.running')} />
  ) : resultData ? (
    <RolloutResultView data={resultData} ts={stored!.ts} />
  ) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('operations:rollout.page_title')}
        subtitle={t('operations:rollout.page_subtitle')}
      />
      <TriggerCard
        title={t('operations:rollout.page_title')}
        icon={<CalendarSync className="size-5" />}
        description={t('operations:rollout.page_subtitle')}
        formFields={formFields}
        onTrigger={handleTrigger}
        triggerLabel={t('operations:rollout.trigger')}
        triggerPendingLabel={t('operations:rollout.running')}
        isPending={mut.isPending}
        confirmTitle={t('operations:rollout.confirm_title')}
        confirmDescription={t('operations:rollout.confirm_description')}
        confirmLabel={t('operations:rollout.trigger')}
        cancelLabel={t('operations:rollout.cancel')}
        result={resultNode}
      />
    </div>
  );
}

function RolloutPending({ labelRunning }: { labelRunning: string }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">{labelRunning}</p>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

function RolloutResultView({ data, ts }: { data: RolloutSummary; ts: number }) {
  const { t } = useTranslation(['operations']);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t('operations:rollout.result_title')}</h3>
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(new Date(ts).toISOString())}
        </span>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
          {t('operations:rollout.totals_label')}
        </h4>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat
            label={t('operations:rollout.totals_kgs', {
              count: data.totals.kindergartens,
            })}
            value={data.totals.kindergartens}
          />
          <Stat
            label={t('operations:rollout.totals_groups_copied', {
              count: data.totals.copiedGroups,
            })}
            value={data.totals.copiedGroups}
          />
          <Stat
            label={t('operations:rollout.totals_groups_skipped', {
              count: data.totals.skippedGroups,
            })}
            value={data.totals.skippedGroups}
          />
          <Stat
            label={t('operations:rollout.totals_events', {
              count: data.totals.totalEvents,
            })}
            value={data.totals.totalEvents}
          />
          <Stat
            label={t('operations:rollout.totals_plans_created', {
              count: data.totals.plansCreated,
            })}
            value={data.totals.plansCreated}
          />
          <Stat
            label={t('operations:rollout.totals_plans_skipped', {
              count: data.totals.plansSkipped,
            })}
            value={data.totals.plansSkipped}
          />
          <Stat
            label={t('operations:rollout.totals_errors', {
              count: data.totals.errors,
            })}
            value={data.totals.errors}
          />
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
          {t('operations:rollout.per_kg_title')}
        </h4>
        <Accordion type="multiple" className="w-full">
          {data.kindergartens.map((kg) => (
            <AccordionItem key={kg.kindergartenId} value={kg.kindergartenId}>
              <AccordionTrigger>
                <div className="flex w-full items-center gap-3 pr-3">
                  <span className="font-mono text-xs">{kg.kindergartenId.slice(0, 8)}</span>
                  <span className="font-medium">{kg.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {kg.schedule.copiedGroups}/{kg.schedule.totalEvents}
                    {' · '}
                    {t('operations:rollout.per_kg_meal')} {kg.meal.plansCreated}
                  </span>
                  {kg.error && <Badge variant="error">err</Badge>}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <h5 className="text-xs font-medium uppercase text-muted-foreground">
                      {t('operations:rollout.per_kg_schedule')}
                    </h5>
                    <ul className="mt-1 text-sm">
                      <li>
                        {t('operations:rollout.totals_groups_copied', {
                          count: kg.schedule.copiedGroups,
                        })}
                      </li>
                      <li>
                        {t('operations:rollout.totals_groups_skipped', {
                          count: kg.schedule.skippedGroups,
                        })}
                      </li>
                      <li>
                        {t('operations:rollout.totals_events', {
                          count: kg.schedule.totalEvents,
                        })}
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-xs font-medium uppercase text-muted-foreground">
                      {t('operations:rollout.per_kg_meal')}
                    </h5>
                    <ul className="mt-1 text-sm">
                      <li>
                        {t('operations:rollout.totals_plans_created', {
                          count: kg.meal.plansCreated,
                        })}
                      </li>
                      <li>
                        {t('operations:rollout.totals_plans_skipped', {
                          count: kg.meal.plansSkipped,
                        })}
                      </li>
                    </ul>
                  </div>
                  {kg.error && (
                    <div className="md:col-span-2">
                      <h5 className="text-xs font-medium uppercase text-muted-foreground">
                        {t('operations:rollout.per_kg_error')}
                      </h5>
                      <pre className="mt-1 rounded bg-muted p-2 text-xs">{kg.error}</pre>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
