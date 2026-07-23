'use no memo';

import { useMemo, useState, type ComponentProps } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCcw,
  ShieldAlert,
} from 'lucide-react';

import {
  useBccAccount,
  useCheckBccConnection,
  useDisableBccAccount,
  useRotateBccCallbackCredentials,
  useRotateBccMac,
  useUpsertBccAccount,
  type BccAccountResponseDto,
  type BccCallbackCredentials,
  type UpsertBccAccountDto,
} from '@/hooks/use-bcc-account';
import { useKindergarten } from '@/hooks/use-kindergartens';
import { KindergartenDetailShell } from '@/components/layout/kindergarten-detail-shell';
import { KindergartenDetailFallback } from '@/components/layout/kindergarten-detail-fallback';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DestructiveConfirm } from '@/components/feedback/destructive-confirm';
import { isAppError } from '@/lib/error-guards';
import { formatRelativeTime } from '@/lib/format';

const MAC_REGEX = /^[0-9A-Fa-f]{32}$/;
const TID_REGEX = /^[0-9A-Za-z]{1,64}$/;

type BccEnvironment = 'test' | 'live';

interface BccFormData {
  merchant_id: string;
  terminal_id: string;
  merchant_name: string;
  environment: BccEnvironment;
  mac_key_component_1: string;
  mac_key_component_2: string;
}

const EMPTY_FORM: BccFormData = {
  merchant_id: '',
  terminal_id: '',
  merchant_name: '',
  environment: 'live',
  mac_key_component_1: '',
  mac_key_component_2: '',
};

function buildSchema(tr: (key: string) => string) {
  const mac = z
    .string()
    .trim()
    .regex(MAC_REGEX, tr('bcc:form.err_mac'));
  return z.object({
    merchant_id: z
      .string()
      .trim()
      .min(1, tr('bcc:form.err_required'))
      .max(128, tr('bcc:form.err_merchant_id')),
    terminal_id: z
      .string()
      .trim()
      .min(1, tr('bcc:form.err_required'))
      .regex(TID_REGEX, tr('bcc:form.err_terminal_id')),
    merchant_name: z.string().trim().max(255, tr('bcc:form.err_merchant_name')),
    environment: z.enum(['test', 'live']),
    mac_key_component_1: mac,
    mac_key_component_2: mac,
  });
}

const macSchema = (tr: (key: string) => string) =>
  z.object({
    mac_key_component_1: z.string().trim().regex(MAC_REGEX, tr('bcc:form.err_mac')),
    mac_key_component_2: z.string().trim().regex(MAC_REGEX, tr('bcc:form.err_mac')),
  });

interface CheckFeedback {
  success: boolean;
  rc?: string | null;
  rcText?: string | null;
  message?: string;
}

function toUpsertBody(values: BccFormData): UpsertBccAccountDto {
  const body: UpsertBccAccountDto = {
    merchant_id: values.merchant_id.trim(),
    terminal_id: values.terminal_id.trim(),
    environment: values.environment,
    // Uppercase-normalise MAC components before sending (never logged).
    mac_key_component_1: values.mac_key_component_1.trim().toUpperCase(),
    mac_key_component_2: values.mac_key_component_2.trim().toUpperCase(),
  };
  const name = values.merchant_name.trim();
  if (name) body.merchant_name = name;
  return body;
}

export default function KindergartenBccPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation(['bcc', 'errors']);
  const locale: 'ru' | 'kk' = i18n.language === 'kk' ? 'kk' : 'ru';
  const kgId = id ?? '';

  const { kg, isPending } = useKindergarten(id);
  const { data: account, isLoading, isError, refetch, notOnboarded } = useBccAccount(kgId);

  const upsertMut = useUpsertBccAccount(kgId);
  const checkMut = useCheckBccConnection(kgId);
  const disableMut = useDisableBccAccount(kgId);
  const rotateMacMut = useRotateBccMac(kgId);
  const rotateCbMut = useRotateBccCallbackCredentials(kgId);

  const [editing, setEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showMac, setShowMac] = useState(false);
  const [oneTimeCreds, setOneTimeCreds] = useState<BccCallbackCredentials | null>(null);
  const [checkFeedback, setCheckFeedback] = useState<CheckFeedback | null>(null);
  const [rotateMacOpen, setRotateMacOpen] = useState(false);
  const [showRotateMac, setShowRotateMac] = useState(false);

  const schema = useMemo(() => buildSchema((k) => t(k)), [t]);
  const form = useForm<BccFormData>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_FORM,
    mode: 'onSubmit',
  });

  const macForm = useForm<{ mac_key_component_1: string; mac_key_component_2: string }>({
    resolver: zodResolver(macSchema((k) => t(k))),
    defaultValues: { mac_key_component_1: '', mac_key_component_2: '' },
    mode: 'onSubmit',
  });

  if (!kg) return <KindergartenDetailFallback isPending={isPending} />;

  const showForm = notOnboarded || editing;
  const status = account?.status;
  const canEditCreds = status !== 'active'; // active accounts must be disabled first

  const applyFieldErrors = (
    err: unknown,
    setError: (field: string, msg: string) => void,
    fields: string[],
  ): boolean => {
    if (isAppError(err) && err.status === 422 && err.code === 'validation_error' && err.details) {
      const map = err.details as Record<string, unknown>;
      for (const [field, constraint] of Object.entries(map)) {
        if (typeof constraint !== 'string') continue;
        if (fields.includes(field)) setError(field, t(`errors:${constraint}`));
      }
      return true;
    }
    return false;
  };

  const openCreateForm = () => {
    setFormError(null);
    setShowMac(false);
    form.reset(EMPTY_FORM);
    setEditing(true);
  };

  const openEditForm = () => {
    if (!account) return;
    setFormError(null);
    setShowMac(false);
    form.reset({
      merchant_id: account.merchant_id,
      terminal_id: account.terminal_id,
      merchant_name: account.merchant_name ?? '',
      environment: account.environment,
      mac_key_component_1: '',
      mac_key_component_2: '',
    });
    setEditing(true);
  };

  const closeForm = () => {
    setEditing(false);
    setFormError(null);
    form.reset(EMPTY_FORM);
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const isCreate = notOnboarded;
    try {
      const res = await upsertMut.mutateAsync(toUpsertBody(values));
      if (res.notify_url && res.notify_username && res.notify_password) {
        setOneTimeCreds({
          notify_url: res.notify_url,
          notify_username: res.notify_username,
          notify_password: res.notify_password,
        });
      }
      toast.success(isCreate ? t('bcc:form.toast_saved') : t('bcc:form.toast_updated'));
      closeForm();
    } catch (err) {
      if (
        applyFieldErrors(
          err,
          (f, m) => form.setError(f as keyof BccFormData, { message: m }),
          [
            'merchant_id',
            'terminal_id',
            'merchant_name',
            'environment',
            'mac_key_component_1',
            'mac_key_component_2',
          ],
        )
      ) {
        return;
      }
      if (isAppError(err)) {
        if (
          err.code === 'bcc_account_active' ||
          err.code === 'bcc_mac_components_invalid' ||
          err.code === 'kindergarten_archived'
        ) {
          setFormError(t(`errors:${err.code}`));
          return;
        }
      }
      setFormError(t('errors:unknown_error'));
    }
  });

  const handleCheck = async () => {
    setCheckFeedback(null);
    try {
      const res = await checkMut.mutateAsync();
      if (res.result.success) {
        setCheckFeedback({ success: true, rc: res.result.rc, rcText: res.result.rc_text });
        toast.success(t('bcc:check.toast_success'));
      } else {
        setCheckFeedback({
          success: false,
          rc: res.result.rc,
          rcText: res.result.rc_text,
          message: t('bcc:check.failed_title'),
        });
      }
    } catch (err) {
      let message = t('errors:unknown_error');
      let rc: string | null | undefined;
      let rcText: string | null | undefined;
      if (isAppError(err)) {
        if (err.code === 'bcc_gateway_unavailable' || err.code === 'bcc_connection_check_failed') {
          message = t(`errors:${err.code}`);
        }
        const details = err.details as { rc?: string; rc_text?: string } | undefined;
        rc = details?.rc;
        rcText = details?.rc_text;
      }
      setCheckFeedback({ success: false, message, rc, rcText });
    }
  };

  const handleDisable = async () => {
    try {
      await disableMut.mutateAsync();
      toast.success(t('bcc:disable.toast_success'));
      setCheckFeedback(null);
    } catch {
      toast.error(t('errors:unknown_error'));
    }
  };

  const handleRotateMac = macForm.handleSubmit(async (values) => {
    try {
      await rotateMacMut.mutateAsync({
        mac_key_component_1: values.mac_key_component_1.trim().toUpperCase(),
        mac_key_component_2: values.mac_key_component_2.trim().toUpperCase(),
      });
      toast.success(t('bcc:rotate_mac.toast_success'));
      setCheckFeedback(null);
      setRotateMacOpen(false);
      macForm.reset({ mac_key_component_1: '', mac_key_component_2: '' });
    } catch (err) {
      if (
        applyFieldErrors(
          err,
          (f, m) =>
            macForm.setError(f as 'mac_key_component_1' | 'mac_key_component_2', { message: m }),
          ['mac_key_component_1', 'mac_key_component_2'],
        )
      ) {
        return;
      }
      if (isAppError(err) && err.code === 'bcc_mac_components_invalid') {
        macForm.setError('mac_key_component_1', { message: t('errors:bcc_mac_components_invalid') });
        return;
      }
      toast.error(t('errors:unknown_error'));
    }
  });

  const handleRotateCallback = async () => {
    try {
      const creds = await rotateCbMut.mutateAsync();
      setOneTimeCreds(creds);
      toast.success(t('bcc:rotate_callback.toast_success'));
    } catch {
      toast.error(t('errors:unknown_error'));
    }
  };

  const statusBadge = (s: BccAccountResponseDto['status']) => {
    if (s === 'active') return <Badge variant="success">{t('bcc:status.active')}</Badge>;
    if (s === 'disabled') return <Badge variant="neutral">{t('bcc:status.disabled')}</Badge>;
    return <Badge variant="warning">{t('bcc:status.draft')}</Badge>;
  };

  return (
    <KindergartenDetailShell kg={kg} activeTab="bcc">
      <div className="flex flex-col gap-6">
        {/* One-time callback credentials */}
        {oneTimeCreds && (
          <OneTimeCredentialsPanel
            creds={oneTimeCreds}
            onDismiss={() => setOneTimeCreds(null)}
            t={t}
          />
        )}

        {isLoading ? (
          <Card>
            <CardContent className="space-y-3 pt-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ) : isError ? (
          <Card>
            <CardContent className="flex flex-col items-start gap-3 pt-4">
              <p className="text-sm text-text-secondary">{t('bcc:load_error.title')}</p>
              <Button variant="outline" onClick={() => refetch()}>
                {t('bcc:load_error.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Existing account summary */}
            {account && !showForm && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{t('bcc:account.title')}</CardTitle>
                  {statusBadge(account.status)}
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label={t('bcc:account.merchant_id')} value={account.merchant_id} mono />
                    <Field label={t('bcc:account.terminal_id')} value={account.terminal_id} mono />
                    <Field
                      label={t('bcc:account.merchant_name')}
                      value={account.merchant_name ?? '—'}
                    />
                    <Field
                      label={t('bcc:account.environment')}
                      value={t(`bcc:fields.environment.${account.environment}`)}
                    />
                  </dl>

                  <div className="rounded-lg border border-border-subtle p-3">
                    <div className="mb-1 text-xs font-medium text-text-secondary">
                      {t('bcc:account.last_check')}
                    </div>
                    {account.last_connection_checked_at && account.last_connection_result ? (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        {account.last_connection_result.success ? (
                          <Badge variant="success">{t('bcc:account.check_success')}</Badge>
                        ) : (
                          <Badge variant="error">{t('bcc:account.check_failure')}</Badge>
                        )}
                        <span className="text-text-tertiary">
                          {formatRelativeTime(account.last_connection_checked_at, locale)}
                        </span>
                        {account.last_connection_result.rc && (
                          <span className="font-mono text-xs text-text-secondary">
                            {t('bcc:account.rc', { rc: account.last_connection_result.rc })}
                            {account.last_connection_result.rc_text
                              ? ` · ${account.last_connection_result.rc_text}`
                              : ''}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-text-tertiary">
                        {t('bcc:account.last_check_never')}
                      </span>
                    )}
                  </div>

                  {/* Check feedback */}
                  {checkFeedback && (
                    <Alert variant={checkFeedback.success ? 'default' : 'destructive'}>
                      {checkFeedback.success ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        <AlertCircle className="size-4" />
                      )}
                      <AlertTitle>
                        {checkFeedback.success
                          ? t('bcc:check.toast_success')
                          : (checkFeedback.message ?? t('bcc:check.failed_title'))}
                      </AlertTitle>
                      {(checkFeedback.rc || checkFeedback.rcText) && (
                        <AlertDescription className="font-mono text-xs">
                          {checkFeedback.rc ? t('bcc:check.failed_rc', { rc: checkFeedback.rc }) : ''}
                          {checkFeedback.rcText ? ` · ${checkFeedback.rcText}` : ''}
                        </AlertDescription>
                      )}
                    </Alert>
                  )}

                  {!canEditCreds && (
                    <p className="text-xs text-text-tertiary">
                      {t('bcc:actions.edit_blocked_hint')}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button onClick={handleCheck} disabled={checkMut.isPending}>
                      <RefreshCcw className="size-4" />
                      {checkMut.isPending ? t('bcc:actions.checking') : t('bcc:actions.check')}
                    </Button>

                    <Button variant="outline" onClick={openEditForm} disabled={!canEditCreds}>
                      {t('bcc:actions.edit')}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRotateMac(false);
                        macForm.reset({ mac_key_component_1: '', mac_key_component_2: '' });
                        setRotateMacOpen(true);
                      }}
                    >
                      <KeyRound className="size-4" />
                      {t('bcc:actions.rotate_mac')}
                    </Button>

                    <DestructiveConfirm
                      trigger={
                        <Button variant="outline" disabled={rotateCbMut.isPending}>
                          {t('bcc:actions.rotate_callback')}
                        </Button>
                      }
                      title={t('bcc:rotate_callback.title')}
                      description={t('bcc:rotate_callback.description')}
                      confirmLabel={t('bcc:rotate_callback.confirm')}
                      cancelLabel={t('bcc:rotate_callback.cancel')}
                      confirmVariant="default"
                      onConfirm={handleRotateCallback}
                      isPending={rotateCbMut.isPending}
                    />

                    {status !== 'disabled' && (
                      <DestructiveConfirm
                        trigger={
                          <Button variant="destructive" disabled={disableMut.isPending}>
                            {t('bcc:actions.disable')}
                          </Button>
                        }
                        title={t('bcc:disable.title')}
                        description={t('bcc:disable.description')}
                        confirmLabel={t('bcc:disable.confirm')}
                        cancelLabel={t('bcc:disable.cancel')}
                        onConfirm={handleDisable}
                        isPending={disableMut.isPending}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty state hero (never onboarded, form not yet open) */}
            {notOnboarded && !editing && (
              <Card>
                <CardContent className="flex flex-col items-start gap-3 pt-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="size-5 text-text-tertiary" />
                    <h2 className="text-lg font-semibold">{t('bcc:empty.title')}</h2>
                  </div>
                  <p className="text-sm text-text-secondary">{t('bcc:empty.description')}</p>
                  <Button onClick={openCreateForm}>{t('bcc:empty.cta')}</Button>
                </CardContent>
              </Card>
            )}

            {/* Create / edit form */}
            {showForm && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {notOnboarded ? t('bcc:form.connect_title') : t('bcc:form.edit_title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {formError && (
                      <Alert variant="destructive">
                        <AlertCircle className="size-4" />
                        <AlertDescription>{formError}</AlertDescription>
                      </Alert>
                    )}

                    <TextField
                      id="bcc-merchant-id"
                      label={t('bcc:fields.merchant_id.label')}
                      hint={t('bcc:fields.merchant_id.hint')}
                      error={form.formState.errors.merchant_id?.message}
                      inputProps={{ ...form.register('merchant_id'), className: 'font-mono' }}
                    />

                    <TextField
                      id="bcc-terminal-id"
                      label={t('bcc:fields.terminal_id.label')}
                      hint={t('bcc:fields.terminal_id.hint')}
                      error={form.formState.errors.terminal_id?.message}
                      inputProps={{ ...form.register('terminal_id'), className: 'font-mono' }}
                    />

                    <TextField
                      id="bcc-merchant-name"
                      label={t('bcc:fields.merchant_name.label')}
                      hint={t('bcc:fields.merchant_name.hint')}
                      error={form.formState.errors.merchant_name?.message}
                      inputProps={form.register('merchant_name')}
                    />

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="bcc-environment">{t('bcc:fields.environment.label')}</Label>
                      <Controller
                        control={form.control}
                        name="environment"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="bcc-environment" className="w-[220px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="live">
                                {t('bcc:fields.environment.live')}
                              </SelectItem>
                              <SelectItem value="test">
                                {t('bcc:fields.environment.test')}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t('bcc:form.mac_section')}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowMac((v) => !v)}
                      >
                        {showMac ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        {showMac ? t('bcc:form.mac_hide') : t('bcc:form.mac_show')}
                      </Button>
                    </div>

                    <TextField
                      id="bcc-mac-1"
                      label={t('bcc:fields.mac_1.label')}
                      hint={t('bcc:fields.mac_1.hint')}
                      error={form.formState.errors.mac_key_component_1?.message}
                      inputProps={{
                        ...form.register('mac_key_component_1'),
                        type: showMac ? 'text' : 'password',
                        autoComplete: 'off',
                        className: 'font-mono',
                      }}
                    />

                    <TextField
                      id="bcc-mac-2"
                      label={t('bcc:fields.mac_2.label')}
                      hint={t('bcc:fields.mac_2.hint')}
                      error={form.formState.errors.mac_key_component_2?.message}
                      inputProps={{
                        ...form.register('mac_key_component_2'),
                        type: showMac ? 'text' : 'password',
                        autoComplete: 'off',
                        className: 'font-mono',
                      }}
                    />

                    <div className="flex items-center justify-end gap-2 pt-1">
                      {!notOnboarded && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={closeForm}
                          disabled={upsertMut.isPending}
                        >
                          {t('bcc:form.btn_cancel')}
                        </Button>
                      )}
                      <Button type="submit" disabled={upsertMut.isPending}>
                        {upsertMut.isPending
                          ? t('bcc:form.btn_saving')
                          : notOnboarded
                            ? t('bcc:form.btn_connect')
                            : t('bcc:form.btn_save')}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Rotate MAC dialog */}
      <Dialog open={rotateMacOpen} onOpenChange={setRotateMacOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('bcc:rotate_mac.title')}</DialogTitle>
            <DialogDescription>{t('bcc:rotate_mac.description')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRotateMac} className="flex flex-col gap-3">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowRotateMac((v) => !v)}
              >
                {showRotateMac ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                {showRotateMac ? t('bcc:form.mac_hide') : t('bcc:form.mac_show')}
              </Button>
            </div>
            <TextField
              id="bcc-rotate-mac-1"
              label={t('bcc:fields.mac_1.label')}
              error={macForm.formState.errors.mac_key_component_1?.message}
              inputProps={{
                ...macForm.register('mac_key_component_1'),
                type: showRotateMac ? 'text' : 'password',
                autoComplete: 'off',
                className: 'font-mono',
              }}
            />
            <TextField
              id="bcc-rotate-mac-2"
              label={t('bcc:fields.mac_2.label')}
              error={macForm.formState.errors.mac_key_component_2?.message}
              inputProps={{
                ...macForm.register('mac_key_component_2'),
                type: showRotateMac ? 'text' : 'password',
                autoComplete: 'off',
                className: 'font-mono',
              }}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setRotateMacOpen(false)}
                disabled={rotateMacMut.isPending}
              >
                {t('bcc:rotate_mac.cancel')}
              </Button>
              <Button type="submit" disabled={rotateMacMut.isPending}>
                {t('bcc:rotate_mac.confirm')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </KindergartenDetailShell>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-text-tertiary">{label}</dt>
      <dd className={mono ? 'font-mono text-sm' : 'text-sm'}>{value}</dd>
    </div>
  );
}

function TextField({
  id,
  label,
  hint,
  error,
  inputProps,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  inputProps: ComponentProps<typeof Input>;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} aria-invalid={!!error} {...inputProps} />
      {hint && <p className="text-xs text-text-tertiary">{hint}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function OneTimeCredentialsPanel({
  creds,
  onDismiss,
  t,
}: {
  creds: BccCallbackCredentials;
  onDismiss: () => void;
  t: (key: string) => string;
}) {
  return (
    <Alert>
      <ShieldAlert className="size-4" />
      <AlertTitle>{t('bcc:callback.title')}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <p className="text-warning-text">{t('bcc:callback.warning')}</p>
        <div className="flex flex-col gap-2">
          <CopyRow label={t('bcc:callback.notify_url')} value={creds.notify_url} t={t} />
          <CopyRow label={t('bcc:callback.notify_username')} value={creds.notify_username} t={t} />
          <CopyRow label={t('bcc:callback.notify_password')} value={creds.notify_password} t={t} />
        </div>
        <div>
          <Button variant="outline" size="sm" onClick={onDismiss}>
            {t('bcc:callback.dismiss')}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

function CopyRow({
  label,
  value,
  t,
}: {
  label: string;
  value: string;
  t: (key: string) => string;
}) {
  const handleCopy = () => {
    void navigator.clipboard.writeText(value);
    toast.success(t('bcc:callback.copied'));
  };
  return (
    <div className="flex items-center gap-2 rounded-md border border-border-subtle bg-card px-2.5 py-1.5">
      <div className="min-w-0 flex-1">
        <div className="text-xs text-text-tertiary">{label}</div>
        <div className="truncate font-mono text-sm text-foreground">{value}</div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={t('bcc:callback.copy')}
        onClick={handleCopy}
      >
        <Copy className="size-4" />
      </Button>
    </div>
  );
}
