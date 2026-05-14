import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
  const { t } = useTranslation(['errors']);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="grid size-22 place-items-center rounded-2xl border border-border-default bg-surface-2">
          <Lock size={38} className="text-text-tertiary" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          {t('errors:forbidden_page.title')}
        </h1>

        <p className="text-text-secondary">{t('errors:forbidden_page.subtitle')}</p>

        <Button asChild>
          <Link to="/">{t('errors:forbidden_page.cta_home')}</Link>
        </Button>
      </div>
    </div>
  );
}
