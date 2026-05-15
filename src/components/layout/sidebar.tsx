import { type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Building2,
  CreditCard,
  Flag,
  Users,
  Wrench,
  Receipt,
  FileText,
  CalendarSync,
  AlertTriangle,
  Activity,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useUiStore } from '@/stores/ui-store';
import { cn } from '@/lib/cn';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface NavItemDef {
  labelKey: string;
  to: string;
  icon: ReactNode;
  soon?: boolean;
}

const NAV_ITEMS: NavItemDef[] = [
  { labelKey: 'dashboard', to: '/', icon: <Home className="size-4" /> },
  {
    labelKey: 'kindergartens',
    to: '/kindergartens',
    icon: <Building2 className="size-4" />,
  },
  {
    labelKey: 'subscriptions',
    to: '/subscriptions',
    icon: <CreditCard className="size-4" />,
    soon: true,
  },
  {
    labelKey: 'feature_flags',
    to: '/feature-flags',
    icon: <Flag className="size-4" />,
    soon: true,
  },
  { labelKey: 'users', to: '/users', icon: <Users className="size-4" />, soon: true },
];

const OPS_ITEMS: NavItemDef[] = [
  {
    labelKey: 'billing',
    to: '/operations/billing',
    icon: <Receipt className="size-4" />,
  },
  {
    labelKey: 'content',
    to: '/operations/content',
    icon: <FileText className="size-4" />,
  },
  {
    labelKey: 'schedule_rollout',
    to: '/operations/schedule-rollout',
    icon: <CalendarSync className="size-4" />,
  },
  {
    labelKey: 'lifecycle_dlq',
    to: '/operations/lifecycle-dlq',
    icon: <AlertTriangle className="size-4" />,
  },
];

const navLinkBase =
  'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13.5px] font-medium text-text-secondary transition-colors hover:bg-surface-hover';
const navLinkActive = 'bg-brand-soft text-brand-text-on-soft hover:bg-brand-soft';

function SidebarNavLink({
  item,
  collapsed,
  indent,
}: {
  item: NavItemDef;
  collapsed: boolean;
  indent?: boolean;
}) {
  const { t } = useTranslation(['shell']);
  const label = t(`shell:nav.${item.labelKey}`);

  const link = (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        cn(
          navLinkBase,
          isActive && navLinkActive,
          collapsed && 'relative justify-center px-0 py-2',
          !collapsed && indent && 'pl-5',
        )
      }
    >
      {item.icon}
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && item.soon && (
        <Badge variant="secondary" className="ml-auto px-1.5 py-0 text-[10px]">
          soon
        </Badge>
      )}
      {collapsed && item.soon && (
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-warning" aria-hidden />
      )}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const { t } = useTranslation(['shell']);
  const navigate = useNavigate();

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border-default bg-surface transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex h-14 shrink-0 cursor-pointer items-center gap-2.5 border-b border-border-default',
          collapsed ? 'justify-center px-4' : 'px-4',
        )}
        onClick={() => navigate('/')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') navigate('/');
        }}
      >
        <div className="grid size-7 place-items-center rounded-lg bg-brand font-mono text-[13px] font-semibold tracking-tight text-text-inverse">
          SH
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-[13.5px] font-semibold">Shyraq</span>
            <span className="text-[11px] text-text-tertiary">SuperAdmin</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <TooltipProvider delayDuration={100}>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden p-2">
          {NAV_ITEMS.map((item) => (
            <SidebarNavLink key={item.to} item={item} collapsed={collapsed} />
          ))}

          <Separator className="mx-2 my-2.5" />

          {/* Operations group */}
          {collapsed ? (
            OPS_ITEMS.map((item) => (
              <SidebarNavLink key={item.to} item={item} collapsed={collapsed} />
            ))
          ) : (
            <Accordion type="single" collapsible defaultValue="ops" className="border-none">
              <AccordionItem value="ops" className="border-none">
                <AccordionTrigger className="px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wider text-text-tertiary hover:no-underline">
                  <span className="flex items-center gap-2">
                    <Wrench className="size-4" />
                    {t('shell:nav.operations')}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="flex flex-col gap-0.5">
                    {OPS_ITEMS.map((item) => (
                      <SidebarNavLink key={item.to} item={item} collapsed={false} indent />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {/* Spacer to push bottom items down */}
          <div className="flex-1" />

          <Separator className="mx-2 my-2.5" />

          {/* System status */}
          <SidebarNavLink
            item={{
              labelKey: 'system_status',
              to: '/system-status',
              icon: <Activity className="size-4" />,
            }}
            collapsed={collapsed}
          />
        </nav>
      </TooltipProvider>

      {/* Collapse toggle */}
      <div className="flex shrink-0 items-center justify-center border-t border-border-default p-2">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </Button>
      </div>
    </aside>
  );
}
