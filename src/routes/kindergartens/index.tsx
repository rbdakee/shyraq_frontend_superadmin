'use no memo';

import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Search } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

import { useKindergartens } from '@/hooks/use-kindergartens';
import { useDebounce } from '@/hooks/use-debounce';
import type { components } from '@/api/types/openapi';

type Kindergarten = components['schemas']['KindergartenDto'];
import { formatPhoneE164, formatRelativeTime } from '@/lib/format';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { DataTable, DataTableToolbar, DataTableRowActions } from '@/components/data-table';

const LIMIT = 50;
const SENTINEL_ALL = '__all__';

export default function KindergartensListPage() {
  const { t, i18n } = useTranslation(['kindergartens']);
  const navigate = useNavigate();

  const [plan, setPlan] = useState<string>(SENTINEL_ALL);
  const [statusFilter, setStatusFilter] = useState<string>(SENTINEL_ALL);
  const [archivedFilter, setArchivedFilter] = useState<string>(SENTINEL_ALL);
  const [search, setSearch] = useState<string>('');
  const debouncedSearch = useDebounce(search, 300);
  const [offset, setOffset] = useState<number>(0);

  const handleSearchChange = (v: string) => {
    setSearch(v);
    setOffset(0);
  };

  const handlePlanChange = (v: string) => {
    setPlan(v);
    setOffset(0);
  };
  const handleStatusChange = (v: string) => {
    setStatusFilter(v);
    setOffset(0);
  };
  const handleArchivedChange = (v: string) => {
    setArchivedFilter(v);
    setOffset(0);
  };

  const isActive =
    statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined;

  const archived =
    archivedFilter === 'only_archived'
      ? true
      : archivedFilter === 'only_active'
        ? false
        : undefined;

  const queryParams = {
    plan: plan === SENTINEL_ALL ? undefined : plan,
    is_active: isActive,
    archived,
    name_search: debouncedSearch.trim() || undefined,
    limit: LIMIT,
    offset,
  };

  const { data, isLoading, isError, error, refetch } = useKindergartens(queryParams);

  const state: 'loading' | 'loaded' | 'empty' | 'error' = isLoading
    ? 'loading'
    : isError
      ? 'error'
      : (data?.items.length ?? 0) === 0
        ? 'empty'
        : 'loaded';

  const locale: 'ru' | 'kk' = i18n.language === 'kk' ? 'kk' : 'ru';

  const columns = useMemo<ColumnDef<Kindergarten, unknown>[]>(
    () => [
      {
        id: 'name',
        header: t('kindergartens:columns.name'),
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-text-primary">{row.original.name}</div>
            <div className="text-xs text-text-secondary">{row.original.slug}</div>
          </div>
        ),
      },
      {
        id: 'status',
        header: t('kindergartens:columns.status'),
        cell: ({ row }) => {
          if (row.original.archived_at) {
            return (
              <Badge variant="neutral" dot>
                <span className="mr-1.5 inline-block size-1.5 rounded-full bg-current" />
                {t('kindergartens:status.archived')}
              </Badge>
            );
          }
          if (row.original.is_active) {
            return (
              <Badge variant="success" dot>
                <span className="mr-1.5 inline-block size-1.5 rounded-full bg-current" />
                {t('kindergartens:status.active')}
              </Badge>
            );
          }
          return (
            <Badge variant="neutral" dot>
              <span className="mr-1.5 inline-block size-1.5 rounded-full bg-current" />
              {t('kindergartens:status.inactive')}
            </Badge>
          );
        },
      },
      {
        id: 'plan',
        header: t('kindergartens:columns.plan'),
        cell: ({ row }) => <Badge variant="secondary">{row.original.plan}</Badge>,
      },
      {
        // TODO(B7)#01: wire active_subscriptions when /saas/saas-subscriptions ships
        id: 'subscription',
        header: t('kindergartens:columns.subscription'),
        cell: () => (
          <span className="text-text-secondary">{t('kindergartens:subscription.placeholder')}</span>
        ),
      },
      {
        id: 'phone',
        header: t('kindergartens:columns.phone'),
        cell: ({ row }) => <span>{formatPhoneE164(row.original.phone) || '—'}</span>,
      },
      {
        id: 'created',
        header: t('kindergartens:columns.created'),
        cell: ({ row }) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-sm">{formatRelativeTime(row.original.created_at, locale)}</span>
            </TooltipTrigger>
            <TooltipContent>{row.original.created_at}</TooltipContent>
          </Tooltip>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <DataTableRowActions ariaLabel={t('kindergartens:columns.actions')}>
            <DropdownMenuItem onClick={() => navigate(`/kindergartens/${row.original.id}`)}>
              {t('kindergartens:row_actions.open')}
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              {t('kindergartens:row_actions.invite_admin')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {row.original.is_active && !row.original.archived_at ? (
              <DropdownMenuItem disabled className="text-error">
                {t('kindergartens:row_actions.archive')}
              </DropdownMenuItem>
            ) : row.original.archived_at ? (
              <DropdownMenuItem disabled>{t('kindergartens:row_actions.restore')}</DropdownMenuItem>
            ) : null}
          </DataTableRowActions>
        ),
      },
    ],
    [t, navigate, locale],
  );

  const from = (data?.offset ?? 0) + 1;
  const to = (data?.offset ?? 0) + (data?.items.length ?? 0);
  const total = data?.total ?? 0;
  const hasPrev = offset > 0;
  const hasNext = (data?.offset ?? 0) + (data?.items.length ?? 0) < total;

  return (
    <TooltipProvider>
      <PageHeader
        title={t('kindergartens:title')}
        subtitle={t('kindergartens:subtitle')}
        actions={
          <Button asChild>
            <Link to="/kindergartens/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('kindergartens:cta_new')}
            </Link>
          </Button>
        }
      />

      <DataTable<Kindergarten>
        data={data?.items ?? []}
        columns={columns}
        state={state}
        toolbar={
          <DataTableToolbar>
            <div className="relative w-full max-w-[280px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <Input
                placeholder={t('kindergartens:search_placeholder')}
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={plan} onValueChange={handlePlanChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('kindergartens:filters.plan.label')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SENTINEL_ALL}>{t('kindergartens:filters.plan.all')}</SelectItem>
                <SelectItem value="standard">standard</SelectItem>
                <SelectItem value="pro">pro</SelectItem>
                <SelectItem value="enterprise">enterprise</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('kindergartens:filters.status.label')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SENTINEL_ALL}>
                  {t('kindergartens:filters.status.all')}
                </SelectItem>
                <SelectItem value="active">{t('kindergartens:filters.status.active')}</SelectItem>
                <SelectItem value="inactive">
                  {t('kindergartens:filters.status.inactive')}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={archivedFilter} onValueChange={handleArchivedChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('kindergartens:filters.archived.label')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SENTINEL_ALL}>
                  {t('kindergartens:filters.archived.all')}
                </SelectItem>
                <SelectItem value="only_active">
                  {t('kindergartens:filters.archived.only_active')}
                </SelectItem>
                <SelectItem value="only_archived">
                  {t('kindergartens:filters.archived.only_archived')}
                </SelectItem>
              </SelectContent>
            </Select>
          </DataTableToolbar>
        }
        pagination={
          total > 0
            ? {
                hasPrev,
                hasNext,
                onPrev: () => setOffset((o) => Math.max(0, o - LIMIT)),
                onNext: () => setOffset((o) => o + LIMIT),
                rangeLabel: t('kindergartens:pagination.range', {
                  from,
                  to,
                  total,
                }),
                prevLabel: t('kindergartens:pagination.prev'),
                nextLabel: t('kindergartens:pagination.next'),
              }
            : undefined
        }
        emptyState={{
          title: t('kindergartens:empty.title'),
          description: t('kindergartens:empty.description'),
          cta: (
            <Button asChild>
              <Link to="/kindergartens/new">
                <Plus className="mr-2 h-4 w-4" />
                {t('kindergartens:empty.cta')}
              </Link>
            </Button>
          ),
        }}
        errorState={{
          error,
          onRetry: () => refetch(),
          title: t('kindergartens:error.title'),
          retryLabel: t('kindergartens:error.retry'),
        }}
        onRowClick={(row) => navigate(`/kindergartens/${row.id}`)}
      />
    </TooltipProvider>
  );
}
