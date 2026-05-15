import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { RefreshCcw } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/data-table/data-table';
import { JsonViewer } from '@/components/ui/json-viewer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useFailedJobs, useRetryFailedJob } from '@/hooks/use-lifecycle-jobs';
import { queryKeys } from '@/hooks/query-keys';
import { formatRelativeTime } from '@/lib/format';
import type { components } from '@/api/types/openapi';

type FailedJob = components['schemas']['LifecycleFailedJobDto'];

// TODO(B?)#01: DLQ kindergarten filter (see IMPLEMENTATION_PLAN.md TODO backlog)
// TODO(B?)#02: DLQ "failed_in_last" filter (see IMPLEMENTATION_PLAN.md TODO backlog)

function deriveState(
  isLoading: boolean,
  isError: boolean,
  isEmpty: boolean,
): 'loading' | 'loaded' | 'empty' | 'error' {
  if (isLoading) return 'loading';
  if (isError) return 'error';
  if (isEmpty) return 'empty';
  return 'loaded';
}

export default function OperationsLifecycleDlqPage() {
  const { t } = useTranslation(['operations', 'errors', 'common']);
  const qc = useQueryClient();

  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [prevCursors, setPrevCursors] = useState<string[]>([]);
  const [processorFilter, setProcessorFilter] = useState('');
  const [expandedJob, setExpandedJob] = useState<FailedJob | null>(null);
  const [retryJob, setRetryJob] = useState<FailedJob | null>(null);

  const { data, isLoading, isError, error, refetch } = useFailedJobs({ limit: 50, cursor });
  const retryMut = useRetryFailedJob();

  const filteredItems = useMemo(
    () => (data?.items ?? []).filter((it) => !processorFilter || it.name.includes(processorFilter)),
    [data?.items, processorFilter],
  );

  const nextCursor = data?.next_cursor as string | null | undefined;

  const tableState = deriveState(
    isLoading,
    isError,
    !processorFilter && filteredItems.length === 0,
  );

  const handleRefresh = () => {
    void qc.invalidateQueries({ queryKey: queryKeys.lifecycle.all() });
  };

  const handlePrev = () => {
    if (prevCursors.length === 0) return;
    const prev = prevCursors[prevCursors.length - 1];
    setPrevCursors((s) => s.slice(0, -1));
    setCursor(prev === '__INITIAL__' ? undefined : prev);
  };

  const handleNext = () => {
    if (!nextCursor) return;
    setPrevCursors((s) => [...s, cursor ?? '__INITIAL__']);
    setCursor(nextCursor);
  };

  const handleConfirmRetry = async () => {
    if (!retryJob) return;
    try {
      await retryMut.mutateAsync(retryJob.id);
      toast.success(t('operations:dlq.retry_toast_success'));
      setRetryJob(null);
    } catch (e: unknown) {
      const appErr = e as { code?: string; status?: number };
      const code = appErr.code;
      const status = appErr.status;

      if (status === 404 || code === 'lifecycle_job_not_found') {
        toast.error(t('operations:dlq.retry_toast_not_found'));
      } else if (status === 409 || code === 'lifecycle_job_not_in_failed_state') {
        toast.error(t('operations:dlq.retry_toast_not_failed'));
      } else if (status === 403 || code === 'forbidden') {
        toast.error(t('operations:dlq.retry_toast_forbidden'));
      } else if (status === 429) {
        toast.error(t('errors:too_many_requests'));
      } else {
        toast.error(t('operations:dlq.retry_toast_generic'));
        console.error('[dlq/retry]', e);
      }
    }
  };

  const columns: ColumnDef<FailedJob, unknown>[] = [
    {
      id: 'id',
      header: t('operations:dlq.col_id'),
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => setExpandedJob(row.original)}
          className="font-mono text-xs hover:underline"
        >
          {row.original.id}
        </button>
      ),
    },
    {
      id: 'processor',
      header: t('operations:dlq.col_processor'),
      cell: ({ row }) => (
        <Badge variant="neutral">{row.original.name.replace(/^lifecycle:/, '')}</Badge>
      ),
    },
    {
      id: 'kindergarten',
      header: t('operations:dlq.col_kindergarten'),
      cell: ({ row }) => {
        const payload = row.original.payload as { kindergartenId?: string };
        const kgId = payload.kindergartenId;
        if (!kgId) return <span className="text-text-secondary">--</span>;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-default font-mono text-xs">{kgId.slice(0, 8)}...</span>
            </TooltipTrigger>
            <TooltipContent>{kgId}</TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: 'failed_reason',
      header: t('operations:dlq.col_failed_reason'),
      cell: ({ row }) => {
        const reason = row.original.failed_reason as unknown as string | null;
        if (!reason) return <span className="text-text-secondary">--</span>;
        return (
          <button
            type="button"
            onClick={() => setExpandedJob(row.original)}
            className="block max-w-[40ch] truncate text-left text-sm hover:underline"
            title={reason}
          >
            {reason}
          </button>
        );
      },
    },
    {
      id: 'attempts',
      header: t('operations:dlq.col_attempts'),
      cell: ({ row }) => row.original.attempts_made,
    },
    {
      id: 'failed_at',
      header: t('operations:dlq.col_failed_at'),
      cell: ({ row }) => {
        const finishedOn = row.original.finished_on as unknown as number | null;
        if (!finishedOn) return <span className="text-text-secondary">--</span>;
        return formatRelativeTime(new Date(finishedOn).toISOString());
      },
    },
    {
      id: 'actions',
      header: t('operations:dlq.col_actions'),
      cell: ({ row }) => (
        <Button size="sm" variant="outline" onClick={() => setRetryJob(row.original)}>
          {t('operations:dlq.retry')}
        </Button>
      ),
    },
  ];

  const toolbar = (
    <div className="flex flex-col gap-2 pb-4">
      <Label htmlFor="processor-filter">{t('operations:dlq.filter_processor_label')}</Label>
      <Input
        id="processor-filter"
        placeholder={t('operations:dlq.filter_processor_placeholder')}
        value={processorFilter}
        onChange={(e) => setProcessorFilter(e.target.value)}
        className="max-w-md"
      />
      <p className="text-xs text-text-secondary">{t('operations:dlq.filter_processor_hint')}</p>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        <PageHeader
          title={t('operations:dlq.page_title')}
          subtitle={t('operations:dlq.page_subtitle')}
          actions={
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCcw className="mr-2 size-4" />
              {t('operations:dlq.refresh')}
            </Button>
          }
        />

        <DataTable<FailedJob>
          data={filteredItems}
          columns={columns}
          state={tableState}
          toolbar={toolbar}
          errorState={{
            error,
            onRetry: () => void refetch(),
            title: t('errors:unknown_error'),
            retryLabel: t('operations:dlq.refresh'),
          }}
          emptyState={{
            title: t('operations:dlq.empty_state'),
          }}
          pagination={{
            hasPrev: prevCursors.length > 0,
            hasNext: !!nextCursor,
            onPrev: handlePrev,
            onNext: handleNext,
            rangeLabel: t('common:pagination.shown_count', { count: filteredItems.length }),
            prevLabel: t('common:pagination.prev'),
            nextLabel: t('common:pagination.next'),
          }}
          onRowClick={setExpandedJob}
        />

        {/* Payload expand modal */}
        <Dialog open={!!expandedJob} onOpenChange={(open) => !open && setExpandedJob(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('operations:dlq.expand_full_payload')}</DialogTitle>
              {expandedJob && (
                <DialogDescription>
                  <code className="font-mono">{expandedJob.id}</code>{' '}
                  <code className="font-mono">{expandedJob.name}</code>
                </DialogDescription>
              )}
            </DialogHeader>
            {expandedJob && (
              <div className="flex flex-col gap-4">
                <JsonViewer data={expandedJob.payload} maxHeight="240px" />
                {(expandedJob.failed_reason as unknown as string | null) && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium">
                      {t('operations:dlq.expand_full_reason')}
                    </h4>
                    <pre className="overflow-auto rounded bg-muted p-3 font-mono text-xs">
                      {expandedJob.failed_reason as unknown as string}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Retry confirm modal */}
        <Dialog open={!!retryJob} onOpenChange={(open) => !open && setRetryJob(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {retryJob && t('operations:dlq.retry_confirm_title', { id: retryJob.id })}
              </DialogTitle>
              <DialogDescription>{t('operations:dlq.retry_confirm_description')}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setRetryJob(null)}
                disabled={retryMut.isPending}
              >
                {t('operations:dlq.retry_cancel')}
              </Button>
              <Button onClick={() => void handleConfirmRetry()} disabled={retryMut.isPending}>
                {retryMut.isPending ? '...' : t('operations:dlq.retry_confirm')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
