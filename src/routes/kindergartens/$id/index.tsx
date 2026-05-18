import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Copy, Info } from 'lucide-react';

import {
  useArchiveKindergarten,
  useRestoreKindergarten,
  useInviteAdmin,
  useKindergartenFromCache,
} from '@/hooks/use-kindergartens';
import { KindergartenDetailShell } from '@/components/layout/kindergarten-detail-shell';
import { DestructiveConfirm } from '@/components/feedback/destructive-confirm';
import { PhoneInput } from '@/components/forms/phone-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { formatPhoneE164, formatRelativeTime } from '@/lib/format';
import { isAppError } from '@/lib/error-guards';

const InviteSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/),
});
type InviteData = z.infer<typeof InviteSchema>;

export default function KindergartenDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['kindergartens', 'errors']);
  const kg = useKindergartenFromCache(id);

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const archiveMut = useArchiveKindergarten();
  const restoreMut = useRestoreKindergarten();
  const inviteMut = useInviteAdmin();

  const inviteForm = useForm<InviteData>({
    resolver: zodResolver(InviteSchema),
    defaultValues: { phone: kg?.phone ?? '' },
    mode: 'onSubmit',
  });

  if (!kg) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-12 text-center">
        <h2 className="text-xl font-semibold">{t('kindergartens:detail.not_found.title')}</h2>
        <p className="text-sm text-text-secondary">
          {t('kindergartens:detail.not_found.subtitle')}
        </p>
        <Button asChild>
          <Link to="/kindergartens">{t('kindergartens:detail.not_found.cta')}</Link>
        </Button>
      </div>
    );
  }

  const isArchived = !!kg.archived_at;

  const handleArchive = async () => {
    try {
      await archiveMut.mutateAsync(kg.id);
      toast.success(t('kindergartens:confirms.archive_success', { name: kg.name }));
      setArchiveOpen(false);
      navigate('/kindergartens');
    } catch {
      toast.error(t('kindergartens:confirms.archive_error'));
    }
  };

  const handleRestore = async () => {
    try {
      await restoreMut.mutateAsync(kg.id);
      toast.success(t('kindergartens:confirms.restore_success', { name: kg.name }));
      setRestoreOpen(false);
    } catch {
      toast.error(t('kindergartens:confirms.restore_error'));
    }
  };

  const handleInvite = inviteForm.handleSubmit(async ({ phone }) => {
    try {
      const result = await inviteMut.mutateAsync({ id: kg.id, phone });
      toast.success(
        result.sent
          ? t('kindergartens:confirms.invite_success_sent', { phone })
          : t('kindergartens:confirms.invite_success_not_sent'),
      );
      setInviteOpen(false);
      inviteForm.reset({ phone: kg.phone ?? '' });
    } catch (err) {
      if (isAppError(err)) {
        if (err.status === 409 && err.code === 'kindergarten_archived') {
          toast.error(t('kindergartens:confirms.invite_error_archived'));
          return;
        }
        if (err.status === 400 && err.code === 'invariant_violation') {
          toast.error(t('kindergartens:confirms.invite_error_phone'));
          return;
        }
      }
      toast.error(t('kindergartens:confirms.invite_error_generic'));
      console.error('[kg/invite]', err);
    }
  });

  const handleCopyId = () => {
    void navigator.clipboard.writeText(kg.id);
    toast.success(t('kindergartens:detail.overview.system_id') + ' copied');
  };

  const actions = (
    <>
      {!isArchived && (
        <DestructiveConfirm
          trigger={<Button variant="destructive">{t('kindergartens:actions.archive')}</Button>}
          open={archiveOpen}
          onOpenChange={setArchiveOpen}
          title={t('kindergartens:confirms.archive_title', { name: kg.name })}
          description={t('kindergartens:confirms.archive_description')}
          confirmationField={{
            label: t('kindergartens:confirms.archive_typing_label'),
            expectedValue: kg.slug,
            placeholder: kg.slug,
          }}
          confirmLabel={t('kindergartens:confirms.archive_confirm')}
          cancelLabel={t('kindergartens:confirms.archive_cancel')}
          onConfirm={handleArchive}
          isPending={archiveMut.isPending}
        />
      )}
      {isArchived && (
        <DestructiveConfirm
          trigger={<Button>{t('kindergartens:actions.restore')}</Button>}
          open={restoreOpen}
          onOpenChange={setRestoreOpen}
          title={t('kindergartens:confirms.restore_title', { name: kg.name })}
          description={t('kindergartens:confirms.restore_description')}
          confirmLabel={t('kindergartens:confirms.restore_confirm')}
          cancelLabel={t('kindergartens:confirms.restore_cancel')}
          confirmVariant="default"
          onConfirm={handleRestore}
          isPending={restoreMut.isPending}
        />
      )}
      <Button variant="outline" onClick={() => setInviteOpen(true)}>
        {t('kindergartens:actions.resend_invite')}
      </Button>
    </>
  );

  return (
    <KindergartenDetailShell kg={kg} activeTab="overview" actions={actions}>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* System info card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('kindergartens:detail.overview.system_card_title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-start">
                <dt className="text-sm text-text-secondary">
                  {t('kindergartens:detail.overview.system_id')}
                </dt>
                <dd className="flex items-center gap-1">
                  <code className="font-mono text-xs">{kg.id}</code>
                  <Button size="icon-sm" variant="ghost" onClick={handleCopyId}>
                    <Copy className="size-3" />
                  </Button>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-start">
                <dt className="text-sm text-text-secondary">
                  {t('kindergartens:detail.overview.system_slug')}
                </dt>
                <dd className="font-mono text-sm">{kg.slug}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-start">
                <dt className="text-sm text-text-secondary">
                  {t('kindergartens:detail.overview.system_plan')}
                </dt>
                <dd>
                  <Badge variant="info">{kg.plan}</Badge>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-start">
                <dt className="text-sm text-text-secondary">
                  {t('kindergartens:detail.overview.system_created_at')}
                </dt>
                <dd className="text-sm">{formatRelativeTime(kg.created_at)}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-start">
                <dt className="text-sm text-text-secondary">
                  {t('kindergartens:detail.overview.system_updated_at')}
                </dt>
                <dd className="text-sm">{formatRelativeTime(kg.updated_at)}</dd>
              </div>
              {kg.archived_at && (
                <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-start">
                  <dt className="text-sm text-text-secondary">
                    {t('kindergartens:detail.overview.system_archived_at')}
                  </dt>
                  <dd className="text-sm">{formatRelativeTime(kg.archived_at)}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Contacts card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('kindergartens:detail.overview.contacts_card_title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3">
              <div>
                <dt className="text-sm text-text-secondary">
                  {t('kindergartens:detail.overview.contacts_address')}
                </dt>
                <dd className="text-sm">
                  {kg.address ?? t('kindergartens:detail.overview.contacts_empty')}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-text-secondary">
                  {t('kindergartens:detail.overview.contacts_phone')}
                </dt>
                <dd className="text-sm">
                  {kg.phone
                    ? formatPhoneE164(kg.phone)
                    : t('kindergartens:detail.overview.contacts_empty')}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Settings (read-only) card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('kindergartens:detail.overview.settings_card_title')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Alert>
              <Info className="size-4" />
              <AlertDescription>
                {t('kindergartens:detail.overview.settings_locked_alert')}
              </AlertDescription>
            </Alert>
            <pre className="overflow-auto rounded bg-muted p-3 text-xs">
              {JSON.stringify(kg.settings ?? {}, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('kindergartens:confirms.invite_title')}</DialogTitle>
            <DialogDescription>{t('kindergartens:confirms.invite_description')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-phone">{t('kindergartens:confirms.invite_phone_label')}</Label>
              <Controller
                control={inviteForm.control}
                name="phone"
                render={({ field }) => (
                  <PhoneInput
                    id="invite-phone"
                    value={field.value}
                    onChange={field.onChange}
                    aria-invalid={!!inviteForm.formState.errors.phone}
                  />
                )}
              />
              {inviteForm.formState.errors.phone && (
                <p className="text-sm text-destructive">
                  {inviteForm.formState.errors.phone.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setInviteOpen(false)}
                disabled={inviteMut.isPending}
              >
                {t('kindergartens:confirms.invite_cancel')}
              </Button>
              <Button type="submit" disabled={inviteMut.isPending}>
                {inviteMut.isPending ? '...' : t('kindergartens:confirms.invite_send')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </KindergartenDetailShell>
  );
}
