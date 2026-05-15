import { useTranslation } from 'react-i18next';
import { Monitor } from 'lucide-react';

export function MobileNotSupported() {
  const { t } = useTranslation('common');
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-canvas px-6 text-center">
      <Monitor className="text-text-secondary" size={64} aria-hidden />
      <h1 className="text-xl font-semibold text-text-primary">{t('mobile_alert.title')}</h1>
      <p className="max-w-md text-text-secondary">{t('mobile_alert.body')}</p>
    </div>
  );
}
