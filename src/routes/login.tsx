import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, Info, AlertCircle, Eye, EyeOff } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';

import { useLogin } from '@/hooks/use-auth';
import { useSessionStore } from '@/stores/session-store';
import { tokenStorage } from '@/lib/token-storage';
import { safeNext } from '@/lib/safe-next';
import { toI18nKey } from '@/lib/error-map';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type LoginInput = z.infer<typeof LoginSchema>;

const AUTH_ERROR_CODES = ['invalid_credentials', 'rate_limit', 'validation'];

function getErrorCode(error: unknown): string | null {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  ) {
    return (error as { code: string }).code;
  }
  return null;
}

function useLoginErrorMessage(error: unknown): string | null {
  const { t } = useTranslation(['auth', 'errors']);

  if (!error) return null;

  const code = getErrorCode(error);
  if (code && AUTH_ERROR_CODES.includes(code)) {
    return t(`auth:errors.${code}`);
  }

  return t(toI18nKey(error));
}

export default function LoginPage() {
  const { t } = useTranslation(['auth', 'errors']);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const sessionExpired = params.get('reason') === 'session_expired';

  useEffect(() => {
    if (sessionExpired) {
      useSessionStore.getState().clearSession();
    }
    if (tokenStorage.getRefresh()) {
      const target = safeNext(params.get('next')) ?? '/';
      navigate(target, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    mode: 'onSubmit',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit((data) => {
    loginMutation.mutate(data);
  });

  const errorMessage = useLoginErrorMessage(loginMutation.error);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="flex w-full max-w-[420px] flex-col items-center gap-7 px-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-shyraq-lg bg-brand font-mono text-base font-semibold tracking-tight text-text-inverse">
            SH
          </div>
          <div>
            <div className="text-[17px] font-semibold tracking-tight">Shyraq</div>
            <div className="text-xs text-text-tertiary">SuperAdmin</div>
          </div>
        </div>

        <Card className="w-full">
          <CardContent className="px-7 py-7">
            <h2 className="mb-1 text-lg font-semibold tracking-tight">{t('auth:title')}</h2>
            <p className="mb-5 text-[13px] text-text-tertiary">{t('auth:subtitle')}</p>

            {sessionExpired && !loginMutation.isError && (
              <Alert variant="default" className="mb-4">
                <Info className="size-4" />
                <AlertDescription>{t('auth:session_expired')}</AlertDescription>
              </Alert>
            )}

            {loginMutation.isError && errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="size-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">{t('auth:email')}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  aria-invalid={!!form.formState.errors.email}
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">{t('auth:password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="pr-10"
                    aria-invalid={!!form.formState.errors.password}
                    {...form.register('password')}
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="mt-1.5 w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  t('auth:submit')
                )}
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="mt-0.5 text-center text-[12.5px] text-text-tertiary underline hover:text-text-secondary"
                  >
                    {t('auth:forgot')}
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('auth:forgot_modal.title')}</DialogTitle>
                    <DialogDescription>{t('auth:forgot_modal.body')}</DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-text-tertiary">v{__APP_VERSION__}</p>
      </div>
    </div>
  );
}
