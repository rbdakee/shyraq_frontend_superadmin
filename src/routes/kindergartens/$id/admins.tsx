'use no memo';

import { useCallback, useMemo, useState } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

import { useKgAdmins, useCreateKgAdmin } from '@/hooks/use-kg-admins';
import type { KindergartenAdminDto } from '@/hooks/use-kg-admins';
import { useInviteAdmin, useKindergartenFromCache } from '@/hooks/use-kindergartens';
import { KindergartenDetailShell } from '@/components/layout/kindergarten-detail-shell';
import { PhoneInput } from '@/components/forms/phone-input';
import { DataTable, DataTableToolbar, DataTableRowActions } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { formatPhoneE164, formatRelativeTime } from '@/lib/format';
import { isAppError } from '@/lib/error-guards';
import { routes } from '@/lib/routes';

const FILTER_PARAM = 'status';
const FILTER_ACTIVE = 'active';
const FILTER_ALL = 'all';

const AddAdminSchema = z.object({
  full_name: z.string().min(1),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/),
  locale: z.enum(['ru', 'kk']),
});
type AddAdminData = z.infer<typeof AddAdminSchema>;

export default function KindergartenAdminsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['kindergartens', 'errors']);
  const [searchParams, setSearchParams] = useSearchParams();
  const kg = useKindergartenFromCache(id);

  const statusParam = searchParams.get(FILTER_PARAM);
  const isActiveFilter = statusParam === FILTER_ALL ? undefined : true;

  const { data, isLoading, isError, error, refetch } = useKgAdmins(id ?? '', {
    isActive: isActiveFilter,
  });

  const createMut = useCreateKgAdmin(id ?? '');
  const inviteMut = useInviteAdmin();

  const [addOpen, setAddOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const addForm = useForm<AddAdminData>({
    resolver: zodResolver(AddAdminSchema),
    defaultValues: { full_name: '', phone: '', locale: 'ru' },
    mode: 'onSubmit',
  });

  const locale: 'ru' | 'kk' = i18n.language === 'kk' ? 'kk' : 'ru';

  const admins = data ?? [];
  const isArchived = !!kg?.archived_at;
  const kgId = kg?.id ?? '';

  const handleResendInvite = useCallback(
    async (admin: KindergartenAdminDto) => {
      if (!admin.phone || !kgId) return;
      try {
        const result = await inviteMut.mutateAsync({ id: kgId, phone: admin.phone });
        if (result.sent) {
          toast.success(t('kindergartens:detail.admins.toast_resend_sent', { phone: admin.phone }));
        } else {
          toast.warning(t('kindergartens:detail.admins.toast_resend_not_sent'));
        }
      } catch {
        toast.error(t('errors:unknown_error'));
      }
    },
    [kgId, inviteMut, t],
  );

  const columns = useMemo<ColumnDef<KindergartenAdminDto, unknown>[]>(
    () => [
      {
        id: 'name',
        header: t('kindergartens:detail.admins.columns.name'),
        cell: ({ row }) => <span className="font-medium">{row.original.full_name ?? '—'}</span>,
      },
      {
        id: 'phone',
        header: t('kindergartens:detail.admins.columns.phone'),
        cell: ({ row }) => (
          <span>{row.original.phone ? formatPhoneE164(row.original.phone) : '—'}</span>
        ),
      },
      {
        id: 'locale',
        header: t('kindergartens:detail.admins.columns.locale'),
        cell: ({ row }) =>
          row.original.locale ? (
            <Badge variant="secondary">{row.original.locale.toUpperCase()}</Badge>
          ) : (
            <span>{'—'}</span>
          ),
      },
      {
        id: 'status',
        header: t('kindergartens:detail.admins.columns.status'),
        cell: ({ row }) =>
          row.original.is_active ? (
            <Badge variant="success">{t('kindergartens:detail.admins.status.active')}</Badge>
          ) : (
            <Badge variant="neutral">{t('kindergartens:detail.admins.status.deactivated')}</Badge>
          ),
      },
      {
        id: 'hired_at',
        header: t('kindergartens:detail.admins.columns.hired_at'),
        cell: ({ row }) => {
          const { hired_at, fired_at, is_active } = row.original;
          if (!hired_at) return <span>{'—'}</span>;
          return (
            <div>
              <span className="text-sm">{hired_at}</span>
              {!is_active && fired_at && (
                <div className="text-xs text-text-tertiary">
                  {hired_at ? `${hired_at} → ${fired_at}` : `→ ${fired_at}`}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: 'created_at',
        header: t('kindergartens:detail.admins.columns.created_at'),
        cell: ({ row }) => (
          <span className="text-sm">{formatRelativeTime(row.original.created_at, locale)}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <DataTableRowActions ariaLabel={t('kindergartens:detail.admins.columns.actions')}>
            <DropdownMenuItem
              disabled={!row.original.phone}
              onClick={() => handleResendInvite(row.original)}
            >
              {t('kindergartens:detail.admins.row_action_resend')}
            </DropdownMenuItem>
          </DataTableRowActions>
        ),
      },
    ],
    [t, locale, handleResendInvite],
  );

  const state: 'loading' | 'loaded' | 'empty' | 'error' = isLoading
    ? 'loading'
    : isError
      ? 'error'
      : admins.length === 0
        ? 'empty'
        : 'loaded';

  if (!kg) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-12 text-center">
        <h2 className="text-xl font-semibold">{t('kindergartens:detail.not_found.title')}</h2>
        <p className="text-sm text-text-secondary">
          {t('kindergartens:detail.not_found.subtitle')}
        </p>
        <Button asChild>
          <Link to={routes.kindergartens.list()}>{t('kindergartens:detail.not_found.cta')}</Link>
        </Button>
      </div>
    );
  }

  const handleFilterChange = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === FILTER_ACTIVE) {
        next.delete(FILTER_PARAM);
      } else {
        next.set(FILTER_PARAM, value);
      }
      return next;
    });
  };

  const currentFilterValue = statusParam === FILTER_ALL ? FILTER_ALL : FILTER_ACTIVE;

  const openAddModal = () => {
    setFormError(null);
    addForm.reset({ full_name: '', phone: '', locale: 'ru' });
    setAddOpen(true);
  };

  const handleAdd = addForm.handleSubmit(async (values) => {
    setFormError(null);
    try {
      const result = await createMut.mutateAsync({
        full_name: values.full_name,
        phone: values.phone,
        locale: values.locale,
      });
      if (result.invite_sms_sent) {
        toast.success(
          t('kindergartens:detail.admins.toast_added_sms_sent', { phone: values.phone }),
        );
      } else {
        toast.warning(t('kindergartens:detail.admins.toast_added_sms_not_sent'));
      }
      setAddOpen(false);
      addForm.reset({ full_name: '', phone: '', locale: 'ru' });
    } catch (err) {
      if (isAppError(err)) {
        if (err.status === 422 && err.code === 'validation_error' && err.details) {
          const fields = err.details as Record<string, unknown>;
          for (const [field, constraint] of Object.entries(fields)) {
            if (typeof constraint !== 'string') continue;
            if (field === 'phone' || field === 'full_name' || field === 'locale') {
              addForm.setError(field, { message: t(`errors:${constraint}`) });
            }
          }
          return;
        }
        if (
          err.code === 'admin_already_exists' ||
          err.code === 'staff_already_exists' ||
          err.code === 'kindergarten_archived'
        ) {
          setFormError(t(`errors:${err.code}`));
          return;
        }
        if (err.code === 'kindergarten_not_found') {
          toast.error(t('errors:kindergarten_not_found'));
          navigate(routes.kindergartens.list());
          return;
        }
        if (err.code === 'invariant_violation') {
          addForm.setError('phone', { message: t('errors:invariant_violation') });
          return;
        }
      }
      toast.error(t('errors:unknown_error'));
      console.error('[kg/admins/add]', err);
    }
  });

  const addButton = isArchived ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0}>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            {t('kindergartens:detail.admins.cta_add')}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{t('kindergartens:detail.admins.cta_add_tooltip_archived')}</TooltipContent>
    </Tooltip>
  ) : (
    <Button onClick={openAddModal}>
      <Plus className="mr-2 h-4 w-4" />
      {t('kindergartens:detail.admins.cta_add')}
    </Button>
  );

  return (
    <TooltipProvider>
      <KindergartenDetailShell kg={kg} activeTab="admins">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {t('kindergartens:detail.admins.title', { count: admins.length })}
            </h2>
            {addButton}
          </div>

          <DataTable<KindergartenAdminDto>
            data={admins}
            columns={columns}
            state={state}
            toolbar={
              <DataTableToolbar>
                <Select value={currentFilterValue} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ACTIVE}>
                      {t('kindergartens:detail.admins.filter.only_active')}
                    </SelectItem>
                    <SelectItem value={FILTER_ALL}>
                      {t('kindergartens:detail.admins.filter.all')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </DataTableToolbar>
            }
            emptyState={{
              title: t('kindergartens:detail.admins.empty_title'),
              cta: !isArchived ? (
                <Button onClick={openAddModal}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('kindergartens:detail.admins.empty_cta')}
                </Button>
              ) : undefined,
            }}
            errorState={{
              error,
              onRetry: () => refetch(),
              title: t('kindergartens:detail.admins.error_title'),
              retryLabel: t('kindergartens:detail.admins.error_retry'),
            }}
          />
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('kindergartens:detail.admins.modal.title')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              {formError && (
                <p className="rounded bg-destructive/10 p-2 text-sm text-destructive">
                  {formError}
                </p>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="admin-name">
                  {t('kindergartens:detail.admins.modal.field_name')}
                </Label>
                <Input
                  id="admin-name"
                  {...addForm.register('full_name')}
                  aria-invalid={!!addForm.formState.errors.full_name}
                />
                {addForm.formState.errors.full_name && (
                  <p className="text-sm text-destructive">
                    {addForm.formState.errors.full_name.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="admin-phone">
                  {t('kindergartens:detail.admins.modal.field_phone')}
                </Label>
                <Controller
                  control={addForm.control}
                  name="phone"
                  render={({ field }) => (
                    <PhoneInput
                      id="admin-phone"
                      value={field.value}
                      onChange={field.onChange}
                      aria-invalid={!!addForm.formState.errors.phone}
                    />
                  )}
                />
                {addForm.formState.errors.phone && (
                  <p className="text-sm text-destructive">
                    {addForm.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="admin-locale">
                  {t('kindergartens:detail.admins.modal.field_locale')}
                </Label>
                <Controller
                  control={addForm.control}
                  name="locale"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="admin-locale">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ru">
                          {t('kindergartens:detail.admins.modal.locale_ru')}
                        </SelectItem>
                        <SelectItem value="kk">
                          {t('kindergartens:detail.admins.modal.locale_kk')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setAddOpen(false)}
                  disabled={createMut.isPending}
                >
                  {t('kindergartens:detail.admins.modal.btn_cancel')}
                </Button>
                <Button type="submit" disabled={createMut.isPending}>
                  {createMut.isPending
                    ? t('kindergartens:detail.admins.modal.btn_submitting')
                    : t('kindergartens:detail.admins.modal.btn_submit')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </KindergartenDetailShell>
    </TooltipProvider>
  );
}
