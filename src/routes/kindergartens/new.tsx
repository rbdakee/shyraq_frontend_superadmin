import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Building2, Loader2, User } from 'lucide-react';

import type { components } from '@/api/types/openapi';
import { useCreateKindergarten } from '@/hooks/use-kindergartens';
import { slugify } from '@/lib/slug';
import { toI18nKey } from '@/lib/error-map';
import { PhoneInput } from '@/components/forms/phone-input';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

type CreateKindergartenDto = components['schemas']['CreateKindergartenDto'];

function isAppError(e: unknown): e is { status: number; code: string } {
  return (
    !!e &&
    typeof e === 'object' &&
    'status' in e &&
    typeof (e as Record<string, unknown>).status === 'number' &&
    'code' in e &&
    typeof (e as Record<string, unknown>).code === 'string'
  );
}

const KgStep1Schema = z.object({
  name: z.string().trim().min(1).max(255),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  phone: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/)
    .optional()
    .or(z.literal('')),
  plan: z.enum(['standard', 'pro', 'enterprise']),
  settings: z.object({
    timezone: z.string().optional(),
    currency: z.string().optional(),
    late_pickup_fee_amount: z.number().nonnegative().optional(),
    otp_expiry_seconds: z.number().int().positive().optional(),
    payment_grace_days: z.number().int().nonnegative().optional(),
  }),
});

type KgStep1Data = z.infer<typeof KgStep1Schema>;

const KgStep2Schema = z.object({
  full_name: z.string().trim().min(1).max(255),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/),
  locale: z.enum(['ru', 'kk']),
});

type KgStep2Data = z.infer<typeof KgStep2Schema>;

const PLAN_OPTIONS = ['standard', 'pro', 'enterprise'] as const;

function StepIndicator({ step, labels }: { step: 1 | 2; labels: [string, string] }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div
        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium ${
          step === 1 ? 'bg-brand/10 text-brand' : 'text-text-tertiary'
        }`}
      >
        <Building2 className="size-4" />
        <span>1. {labels[0]}</span>
      </div>
      <span className="text-text-quaternary">/</span>
      <div
        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium ${
          step === 2 ? 'bg-brand/10 text-brand' : 'text-text-tertiary'
        }`}
      >
        <User className="size-4" />
        <span>2. {labels[1]}</span>
      </div>
    </div>
  );
}

export default function KindergartenCreatePage() {
  const { t } = useTranslation(['kindergartens', 'errors']);
  const navigate = useNavigate();
  const createMutation = useCreateKindergarten();
  const [step, setStep] = useState<1 | 2>(1);

  const step1Form = useForm<KgStep1Data>({
    resolver: zodResolver(KgStep1Schema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      slug: '',
      address: '',
      phone: '',
      plan: 'standard',
      settings: {
        timezone: 'Asia/Almaty',
        currency: 'KZT',
        late_pickup_fee_amount: undefined,
        otp_expiry_seconds: undefined,
        payment_grace_days: undefined,
      },
    },
  });

  const step2Form = useForm<KgStep2Data>({
    resolver: zodResolver(KgStep2Schema),
    mode: 'onChange',
    defaultValues: {
      full_name: '',
      phone: '',
      locale: 'ru',
    },
  });

  const handleNameBlur = () => {
    const slugDirty = step1Form.formState.dirtyFields.slug;
    if (!slugDirty) {
      const nameValue = step1Form.getValues('name');
      if (nameValue) {
        step1Form.setValue('slug', slugify(nameValue), { shouldValidate: true });
      }
    }
  };

  const handleCancel = () => {
    const isDirty = step1Form.formState.isDirty || step2Form.formState.isDirty;
    if (isDirty) {
      if (!window.confirm(t('kindergartens:wizard.buttons.cancel') + '?')) {
        return;
      }
    }
    navigate('/kindergartens');
  };

  const handleNext = async () => {
    const valid = await step1Form.trigger();
    if (valid) setStep(2);
  };

  const onSubmit = step2Form.handleSubmit(async (step2) => {
    const step1 = step1Form.getValues();
    const body: CreateKindergartenDto = {
      name: step1.name,
      slug: step1.slug,
      address: step1.address || undefined,
      phone: step1.phone || undefined,
      plan: step1.plan,
      settings: step1.settings as CreateKindergartenDto['settings'],
      admin: {
        full_name: step2.full_name,
        phone: step2.phone,
        locale: step2.locale,
      },
    };

    try {
      const result = await createMutation.mutateAsync(body);
      toast.success(t('kindergartens:wizard.toast_success', { phone: step2.phone }));
      navigate(`/kindergartens/${result.kindergarten.id}`);
    } catch (err) {
      if (isAppError(err)) {
        if (err.status === 409 && err.code === 'kindergarten_slug_taken') {
          setStep(1);
          step1Form.setError('slug', {
            message: t('errors:kindergarten_slug_taken'),
          });
          toast.error(t('kindergartens:wizard.toast_error_slug_taken'));
          return;
        }
        if (err.status === 400 && err.code === 'invariant_violation') {
          toast.error(t('kindergartens:wizard.toast_error_invariant'));
          return;
        }
      }
      toast.error(t('kindergartens:wizard.toast_error_generic'));
      console.error('[kg/new] unexpected error', err, toI18nKey(err));
    }
  });

  return (
    <div>
      <PageHeader title={t('kindergartens:wizard.title')} />

      <div className="mx-auto max-w-[720px]">
        <StepIndicator
          step={step}
          labels={[t('kindergartens:wizard.steps.kg'), t('kindergartens:wizard.steps.admin')]}
        />

        {step === 1 && (
          <Card>
            <CardContent className="space-y-5 px-6 py-6">
              <h2 className="text-base font-semibold">
                {t('kindergartens:wizard.kg.section_title')}
              </h2>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="kg-name">{t('kindergartens:wizard.kg.name_label')} *</Label>
                <Input
                  id="kg-name"
                  placeholder={t('kindergartens:wizard.kg.name_placeholder')}
                  aria-invalid={!!step1Form.formState.errors.name}
                  {...step1Form.register('name', { onBlur: handleNameBlur })}
                />
                {step1Form.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {step1Form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="kg-slug">{t('kindergartens:wizard.kg.slug_label')} *</Label>
                <Input
                  id="kg-slug"
                  placeholder={t('kindergartens:wizard.kg.slug_placeholder')}
                  className="lowercase"
                  aria-invalid={!!step1Form.formState.errors.slug}
                  {...step1Form.register('slug')}
                />
                <p className="text-xs text-text-tertiary">
                  {t('kindergartens:wizard.kg.slug_hint')}
                </p>
                {step1Form.formState.errors.slug && (
                  <p className="text-sm text-destructive">
                    {step1Form.formState.errors.slug.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="kg-address">{t('kindergartens:wizard.kg.address_label')}</Label>
                <Textarea
                  id="kg-address"
                  rows={2}
                  placeholder={t('kindergartens:wizard.kg.address_placeholder')}
                  aria-invalid={!!step1Form.formState.errors.address}
                  {...step1Form.register('address')}
                />
                {step1Form.formState.errors.address && (
                  <p className="text-sm text-destructive">
                    {step1Form.formState.errors.address.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="kg-phone">{t('kindergartens:wizard.kg.phone_label')}</Label>
                <Controller
                  control={step1Form.control}
                  name="phone"
                  render={({ field }) => (
                    <PhoneInput
                      id="kg-phone"
                      placeholder={t('kindergartens:wizard.kg.phone_placeholder')}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      aria-invalid={!!step1Form.formState.errors.phone}
                    />
                  )}
                />
                {step1Form.formState.errors.phone && (
                  <p className="text-sm text-destructive">
                    {step1Form.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>{t('kindergartens:wizard.kg.plan_label')} *</Label>
                <Controller
                  control={step1Form.control}
                  name="plan"
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex gap-4"
                    >
                      {PLAN_OPTIONS.map((p) => (
                        <div key={p} className="flex items-center gap-2">
                          <RadioGroupItem value={p} id={`plan-${p}`} />
                          <Label htmlFor={`plan-${p}`} className="cursor-pointer font-normal">
                            {t(`kindergartens:wizard.kg.plan_options.${p}`)}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                />
              </div>

              <Accordion type="single" collapsible>
                <AccordionItem value="settings" className="border-none">
                  <AccordionTrigger className="text-sm font-medium text-text-secondary">
                    {t('kindergartens:wizard.kg.settings_title')}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4 pt-2 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="s-tz">
                          {t('kindergartens:wizard.kg.settings.timezone_label')}
                        </Label>
                        <Input id="s-tz" {...step1Form.register('settings.timezone')} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="s-cur">
                          {t('kindergartens:wizard.kg.settings.currency_label')}
                        </Label>
                        <Input id="s-cur" {...step1Form.register('settings.currency')} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="s-fee">
                          {t('kindergartens:wizard.kg.settings.late_pickup_fee_label')}
                        </Label>
                        <Input
                          id="s-fee"
                          type="number"
                          min={0}
                          {...step1Form.register('settings.late_pickup_fee_amount', {
                            setValueAs: (v: string) => (v === '' ? undefined : Number(v)),
                          })}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="s-otp">
                          {t('kindergartens:wizard.kg.settings.otp_expiry_label')}
                        </Label>
                        <Input
                          id="s-otp"
                          type="number"
                          min={1}
                          {...step1Form.register('settings.otp_expiry_seconds', {
                            setValueAs: (v: string) => (v === '' ? undefined : Number(v)),
                          })}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="s-grace">
                          {t('kindergartens:wizard.kg.settings.grace_label')}
                        </Label>
                        <Input
                          id="s-grace"
                          type="number"
                          min={0}
                          {...step1Form.register('settings.payment_grace_days', {
                            setValueAs: (v: string) => (v === '' ? undefined : Number(v)),
                          })}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={handleCancel}>
                  {t('kindergartens:wizard.buttons.cancel')}
                </Button>
                <Button type="button" disabled={!step1Form.formState.isValid} onClick={handleNext}>
                  {t('kindergartens:wizard.buttons.next')}
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardContent className="space-y-5 px-6 py-6">
              <h2 className="text-base font-semibold">
                {t('kindergartens:wizard.admin.section_title')}
              </h2>

              <form onSubmit={onSubmit} className="space-y-5">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="admin-name">
                    {t('kindergartens:wizard.admin.full_name_label')} *
                  </Label>
                  <Input
                    id="admin-name"
                    placeholder={t('kindergartens:wizard.admin.full_name_placeholder')}
                    aria-invalid={!!step2Form.formState.errors.full_name}
                    {...step2Form.register('full_name')}
                  />
                  {step2Form.formState.errors.full_name && (
                    <p className="text-sm text-destructive">
                      {step2Form.formState.errors.full_name.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="admin-phone">
                    {t('kindergartens:wizard.admin.phone_label')} *
                  </Label>
                  <Controller
                    control={step2Form.control}
                    name="phone"
                    render={({ field }) => (
                      <PhoneInput
                        id="admin-phone"
                        placeholder={t('kindergartens:wizard.admin.phone_placeholder')}
                        value={field.value}
                        onChange={field.onChange}
                        aria-invalid={!!step2Form.formState.errors.phone}
                      />
                    )}
                  />
                  <p className="text-xs text-text-tertiary">
                    {t('kindergartens:wizard.admin.phone_hint')}
                  </p>
                  {step2Form.formState.errors.phone && (
                    <p className="text-sm text-destructive">
                      {step2Form.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>{t('kindergartens:wizard.admin.locale_label')} *</Label>
                  <Controller
                    control={step2Form.control}
                    name="locale"
                    render={({ field }) => (
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex gap-4"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="ru" id="locale-ru" />
                          <Label htmlFor="locale-ru" className="cursor-pointer font-normal">
                            {t('kindergartens:wizard.admin.locale_options.ru')}
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="kk" id="locale-kk" />
                          <Label htmlFor="locale-kk" className="cursor-pointer font-normal">
                            {t('kindergartens:wizard.admin.locale_options.kk')}
                          </Label>
                        </div>
                      </RadioGroup>
                    )}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-2 size-4" />
                    {t('kindergartens:wizard.buttons.back')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={!step2Form.formState.isValid || createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        {t('kindergartens:wizard.buttons.submitting')}
                      </>
                    ) : (
                      t('kindergartens:wizard.buttons.submit')
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
