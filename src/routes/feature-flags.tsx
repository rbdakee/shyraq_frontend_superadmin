import { useTranslation } from 'react-i18next';
import { BlockedFeature } from '@/components/feedback/blocked-feature';
import { PageHeader } from '@/components/layout/page-header';

export default function FeatureFlagsPage() {
  const { t } = useTranslation('shell');
  return (
    <>
      <PageHeader title={t('nav.feature_flags')} />
      <BlockedFeature blockerCode="b10" featureName={t('nav.feature_flags')} />
    </>
  );
}
