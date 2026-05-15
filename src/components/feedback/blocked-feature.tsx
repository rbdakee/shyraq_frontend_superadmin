import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlockedFeatureProps {
  blockerCode: 'b8' | 'b9' | 'b10' | 'b11' | 'view_as';
  featureName: string;
  description?: ReactNode;
  actionsBelow?: ReactNode;
}

export function BlockedFeature({
  blockerCode,
  featureName,
  description,
  actionsBelow,
}: BlockedFeatureProps) {
  const { t } = useTranslation('errors');
  const body = description ?? t(`blocked.${blockerCode}`);
  const seeMoreCode = blockerCode === 'view_as' ? 'b3' : blockerCode;

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-6 px-8 py-16 text-center">
      <Construction className="text-text-secondary" size={64} aria-hidden />
      <h2 className="text-2xl font-semibold text-text-primary">
        {t('blocked.header', { featureName })}
      </h2>
      <p className="leading-relaxed text-text-secondary">{body}</p>
      <p className="text-sm text-text-secondary">
        <a
          href={`https://github.com/your-org/shyraq-superadmin/blob/main/docs/OPEN_QUESTIONS.md#${seeMoreCode}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-text-primary"
        >
          {t('blocked.see_more', { code: seeMoreCode })}
        </a>
      </p>
      {actionsBelow ?? (
        <Button asChild variant="outline">
          <Link to="/">{t('blocked.cta_home')}</Link>
        </Button>
      )}
    </div>
  );
}
