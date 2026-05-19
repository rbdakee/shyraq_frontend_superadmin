import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { KindergartenDetailShell } from '@/components/layout/kindergarten-detail-shell';
import { KindergartenDetailFallback } from '@/components/layout/kindergarten-detail-fallback';
import { BlockedFeature } from '@/components/feedback/blocked-feature';
import { useKindergarten } from '@/hooks/use-kindergartens';

export default function KindergartenFlagsPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(['kindergartens']);
  const { kg, isPending } = useKindergarten(id);

  if (!kg) return <KindergartenDetailFallback isPending={isPending} />;

  return (
    <KindergartenDetailShell kg={kg} activeTab="flags">
      <BlockedFeature blockerCode="b10" featureName={t('kindergartens:detail.tabs.flags')} />
    </KindergartenDetailShell>
  );
}
