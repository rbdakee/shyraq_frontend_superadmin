import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { routes } from '@/lib/routes';

// Shared loading/not-found fallback for every /kindergartens/:id tab. Detail
// pages have no GET-by-id endpoint and read the kg from the persisted query
// cache (OPEN_QUESTIONS#b8); while that cache is restoring after a hard
// refresh we MUST show loading, not "not found", or Ctrl+R flashes a false
// miss before the list cache rehydrates.
export function KindergartenDetailFallback({ isPending }: { isPending: boolean }) {
  const { t } = useTranslation(['kindergartens']);

  if (isPending) {
    return (
      <div className="flex flex-col gap-4 py-8" aria-busy="true">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-12 text-center">
      <h2 className="text-xl font-semibold">{t('kindergartens:detail.not_found.title')}</h2>
      <p className="text-sm text-text-secondary">{t('kindergartens:detail.not_found.subtitle')}</p>
      <Button asChild>
        <Link to={routes.kindergartens.list()}>{t('kindergartens:detail.not_found.cta')}</Link>
      </Button>
    </div>
  );
}
