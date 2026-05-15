import { useTranslation } from 'react-i18next';
import { BlockedFeature } from '@/components/feedback/blocked-feature';
import { PageHeader } from '@/components/layout/page-header';

export default function UsersEditPage() {
  const { t } = useTranslation('shell');
  return (
    <>
      <PageHeader title={t('nav.users_edit')} />
      <BlockedFeature blockerCode="b11" featureName={t('nav.users_edit')} />
    </>
  );
}
