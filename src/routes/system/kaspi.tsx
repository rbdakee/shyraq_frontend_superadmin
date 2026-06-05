'use no memo';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { RefreshCcw, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

import {
  useKaspiConfig,
  useUpdateKaspiConfig,
  useProbeKaspiVersion,
  type UpdateKaspiConfigBody,
} from '@/hooks/use-kaspi';
import { useHealthReady } from '@/hooks/use-health';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PulseDot } from '@/components/feedback/pulse-dot';
import { isAppError } from '@/lib/error-guards';
import { formatRelativeTime } from '@/lib/format';

// Backend types kaspi_detail as a bare object (no declared props in OpenAPI) —
// the real shape per endpoints.md §9.2 is { build, checked_at }.
interface KaspiDetail {
  build?: string;
  checked_at?: string;
}

const EDITABLE_FIELDS = [
  'app_build',
  'app_version',
  'platform_ver',
  'model',
  'brand',
  'ua_native',
  'ua_browser',
  'entrance_url',
  'mtoken_url',
  'qrpay_url',
] as const;

type FieldName = (typeof EDITABLE_FIELDS)[number];

type ConfigFormData = Record<FieldName, string>;

// Defense-in-depth against SSRF: the backend dials these Kaspi base URLs
// server-side (version-probe + payment flows), so the authoritative host
// validation MUST live there (post-DNS-resolution, DNS-rebinding safe — see
// OPEN_QUESTIONS#b20). This frontend refinement is only a first line: it
// rejects obviously-internal hosts so an operator can't fat-finger one in.
function isPublicHostUrl(value: string): boolean {
  let host: string;
  try {
    host = new URL(value).hostname.toLowerCase().replace(/\.$/, '');
  } catch {
    return false;
  }
  return !/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.0\.0\.0$|::1)/.test(
    host,
  );
}

function buildConfigSchema(tr: (key: string) => string) {
  const requiredStr = z.string().min(1, tr('kaspi:form.err_required'));
  const safeUrl = z
    .string()
    .min(1, tr('kaspi:form.err_required'))
    .url(tr('kaspi:form.err_url'))
    .refine(isPublicHostUrl, { message: tr('kaspi:form.err_internal_url') });
  return z.object({
    app_build: requiredStr,
    app_version: requiredStr,
    platform_ver: requiredStr,
    model: requiredStr,
    brand: requiredStr,
    ua_native: requiredStr,
    ua_browser: requiredStr,
    entrance_url: safeUrl,
    mtoken_url: safeUrl,
    qrpay_url: safeUrl,
  });
}

const EMPTY_FORM: ConfigFormData = {
  app_build: '',
  app_version: '',
  platform_ver: '',
  model: '',
  brand: '',
  ua_native: '',
  ua_browser: '',
  entrance_url: '',
  mtoken_url: '',
  qrpay_url: '',
};

const FIELD_DEFS: { name: FieldName; type: 'input' | 'textarea'; highlight?: boolean }[] = [
  { name: 'app_build', type: 'input', highlight: true },
  { name: 'app_version', type: 'input' },
  { name: 'platform_ver', type: 'input' },
  { name: 'model', type: 'input' },
  { name: 'brand', type: 'input' },
  { name: 'ua_native', type: 'textarea' },
  { name: 'ua_browser', type: 'textarea' },
  { name: 'entrance_url', type: 'input' },
  { name: 'mtoken_url', type: 'input' },
  { name: 'qrpay_url', type: 'input' },
];

export default function SystemKaspiPage() {
  const { t, i18n } = useTranslation(['kaspi', 'errors']);
  const locale: 'ru' | 'kk' = i18n.language === 'kk' ? 'kk' : 'ru';

  const { data: config, isLoading, isError, refetch } = useKaspiConfig();
  const health = useHealthReady();
  const updateMut = useUpdateKaspiConfig();
  const probeMut = useProbeKaspiVersion();

  const [probeResult, setProbeResult] = useState<{
    build: string;
    accepted: boolean;
    alarm?: string | null;
  } | null>(null);

  const formValues = useMemo<ConfigFormData>(() => {
    if (!config) return EMPTY_FORM;
    return {
      app_build: config.app_build,
      app_version: config.app_version,
      platform_ver: config.platform_ver,
      model: config.model,
      brand: config.brand,
      ua_native: config.ua_native,
      ua_browser: config.ua_browser,
      entrance_url: config.entrance_url,
      mtoken_url: config.mtoken_url,
      qrpay_url: config.qrpay_url,
    };
  }, [config]);

  const schema = useMemo(() => buildConfigSchema((key) => t(key)), [t]);

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_FORM,
    values: formValues,
    mode: 'onSubmit',
  });

  const gateStatus = health.data?.checks.kaspi;
  const gateTone = gateStatus === 'up' ? 'success' : gateStatus === 'down' ? 'error' : 'neutral';
  const gateLabel = gateStatus
    ? t(`kaspi:gate.status.${gateStatus}`)
    : t('kaspi:gate.status.unknown');
  const kaspiDetail = health.data?.kaspi_detail as unknown as KaspiDetail | undefined;

  const handleProbe = async () => {
    try {
      const res = await probeMut.mutateAsync(undefined);
      setProbeResult(res);
    } catch (err) {
      toast.error(t('errors:unknown_error'));
      console.error('[kaspi/probe]', err);
    }
  };

  const handleSave = form.handleSubmit(async (values) => {
    const dirty = form.formState.dirtyFields;
    const body: UpdateKaspiConfigBody = {};
    for (const name of EDITABLE_FIELDS) {
      if (dirty[name]) body[name] = values[name];
    }
    if (Object.keys(body).length === 0) return;

    try {
      await updateMut.mutateAsync(body);
      toast.success(t('kaspi:form.toast_saved'));
    } catch (err) {
      if (isAppError(err) && err.status === 422 && err.code === 'validation_error' && err.details) {
        const fields = err.details as Record<string, unknown>;
        for (const [field, constraint] of Object.entries(fields)) {
          if (typeof constraint !== 'string') continue;
          if ((EDITABLE_FIELDS as readonly string[]).includes(field)) {
            form.setError(field as FieldName, { message: t(`errors:${constraint}`) });
          }
        }
        return;
      }
      toast.error(t('errors:unknown_error'));
      console.error('[kaspi/config/save]', err);
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('kaspi:page_title')}
        subtitle={t('kaspi:page_subtitle')}
        actions={
          <Button variant="outline" onClick={handleProbe} disabled={probeMut.isPending}>
            <RefreshCcw className="size-4" />
            {probeMut.isPending ? t('kaspi:probe.running') : t('kaspi:probe.cta')}
          </Button>
        }
      />

      {gateStatus === 'down' && (
        <Alert variant="destructive">
          <ShieldAlert className="size-4" />
          <AlertDescription>{t('kaspi:gate.down_banner')}</AlertDescription>
        </Alert>
      )}

      {/* Gate status */}
      <Card>
        <CardHeader>
          <CardTitle>{t('kaspi:gate.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {health.isLoading && !health.data ? (
            <Skeleton className="h-6 w-64" />
          ) : (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-2">
                <PulseDot tone={gateTone} size="md" />
                <span className="font-semibold">{gateLabel}</span>
              </div>
              {kaspiDetail?.build && (
                <span className="text-sm text-text-secondary">
                  {t('kaspi:gate.build', { build: kaspiDetail.build })}
                </span>
              )}
              {kaspiDetail?.checked_at && (
                <span className="text-sm text-text-tertiary">
                  {t('kaspi:gate.checked_at', {
                    when: formatRelativeTime(kaspiDetail.checked_at, locale),
                  })}
                </span>
              )}
            </div>
          )}
          <p className="mt-3 text-xs text-text-tertiary">{t('kaspi:gate.hint')}</p>
        </CardContent>
      </Card>

      {/* Probe result */}
      {probeResult && (
        <Alert variant={probeResult.accepted ? 'default' : 'destructive'}>
          {probeResult.accepted ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <AlertCircle className="size-4" />
          )}
          <AlertDescription>
            {probeResult.accepted
              ? t('kaspi:probe.accepted', { build: probeResult.build })
              : t('kaspi:probe.blocked', {
                  build: probeResult.build,
                  alarm: probeResult.alarm ?? t('kaspi:probe.blocked_unknown'),
                })}
          </AlertDescription>
        </Alert>
      )}

      {/* Config form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('kaspi:form.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && !config ? (
            <div className="space-y-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-2/3" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-text-secondary">{t('kaspi:form.load_error')}</p>
              <Button variant="outline" onClick={() => refetch()}>
                {t('kaspi:form.retry')}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              {FIELD_DEFS.map(({ name, type, highlight }) => {
                const error = form.formState.errors[name];
                return (
                  <div key={name} className="flex flex-col gap-1.5">
                    <Label htmlFor={`kaspi-${name}`}>
                      {t(`kaspi:fields.${name}.label`)}
                      {highlight && <span className="ml-1 text-error">*</span>}
                    </Label>
                    {type === 'textarea' ? (
                      <Textarea
                        id={`kaspi-${name}`}
                        rows={2}
                        className="font-mono text-xs"
                        {...form.register(name)}
                        aria-invalid={!!error}
                      />
                    ) : (
                      <Input
                        id={`kaspi-${name}`}
                        className={highlight ? 'font-mono font-semibold' : undefined}
                        {...form.register(name)}
                        aria-invalid={!!error}
                      />
                    )}
                    <p className="text-xs text-text-tertiary">{t(`kaspi:fields.${name}.hint`)}</p>
                    {error && <p className="text-sm text-destructive">{error.message}</p>}
                  </div>
                );
              })}

              <div className="flex items-center justify-end gap-2 pt-2">
                {config?.updated_at && (
                  <span className="mr-auto text-xs text-text-tertiary">
                    {t('kaspi:form.updated_at', {
                      when: formatRelativeTime(config.updated_at, locale),
                    })}
                  </span>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => form.reset(formValues)}
                  disabled={!form.formState.isDirty || updateMut.isPending}
                >
                  {t('kaspi:form.btn_reset')}
                </Button>
                <Button type="submit" disabled={!form.formState.isDirty || updateMut.isPending}>
                  {updateMut.isPending ? t('kaspi:form.btn_saving') : t('kaspi:form.btn_save')}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
