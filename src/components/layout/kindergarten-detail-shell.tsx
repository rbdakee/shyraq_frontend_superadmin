import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { formatPhoneE164 } from '@/lib/format';
import type { components } from '@/api/types/openapi';

type Kindergarten = components['schemas']['KindergartenDto'];
type TabKey = 'overview' | 'admins' | 'settings' | 'subscription' | 'flags' | 'view-as';

interface KindergartenDetailShellProps {
  kg: Kindergarten;
  activeTab: TabKey;
  actions?: ReactNode;
  children: ReactNode;
}

const TAB_KEYS: TabKey[] = ['overview', 'admins', 'settings', 'subscription', 'flags', 'view-as'];

function tabPath(kgId: string, tab: TabKey): string {
  if (tab === 'overview') return `/kindergartens/${kgId}`;
  return `/kindergartens/${kgId}/${tab}`;
}

function tabI18nKey(tab: TabKey): string {
  return `kindergartens:detail.tabs.${tab.replace('-', '_')}`;
}

export function KindergartenDetailShell({
  kg,
  activeTab,
  actions,
  children,
}: KindergartenDetailShellProps) {
  const { t } = useTranslation(['kindergartens']);
  const isArchived = !!kg.archived_at;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/kindergartens"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="size-4" />
          {t('kindergartens:detail.back_link')}
        </Link>
      </div>

      <header className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{kg.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
            <span className="font-mono">{kg.slug}</span>
            <Badge variant={isArchived ? 'neutral' : 'success'}>
              {isArchived ? t('kindergartens:status.archived') : t('kindergartens:status.active')}
            </Badge>
            <Badge variant="info">{kg.plan}</Badge>
          </div>
          <div className="text-sm text-text-tertiary">
            {kg.address ?? '—'} &middot; {formatPhoneE164(kg.phone) || '—'}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>

      <Tabs value={activeTab}>
        <TabsList>
          {TAB_KEYS.map((tab) => (
            <TabsTrigger key={tab} value={tab} asChild>
              <Link to={tabPath(kg.id, tab)}>{t(tabI18nKey(tab))}</Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div>{children}</div>
    </div>
  );
}
