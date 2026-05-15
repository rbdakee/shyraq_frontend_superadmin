import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { KindergartenDetailShell } from '@/components/layout/kindergarten-detail-shell';
import { BlockedFeature } from '@/components/feedback/blocked-feature';
import { useKindergartenFromCache } from '@/hooks/use-kindergartens';
import { Button } from '@/components/ui/button';

export default function KindergartenViewAsPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(['kindergartens']);
  const kg = useKindergartenFromCache(id);

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

  return (
    <KindergartenDetailShell kg={kg} activeTab="view-as">
      <BlockedFeature blockerCode="view_as" featureName={t('kindergartens:detail.tabs.view_as')} />
    </KindergartenDetailShell>
  );
}
