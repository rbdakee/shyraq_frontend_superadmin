import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, KeyRound, LogOut, Menu, User } from 'lucide-react';
import { useUiStore } from '@/stores/ui-store';
import { useSessionStore } from '@/stores/session-store';
import { useCurrentUser, useLogout } from '@/hooks/use-auth';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function getInitials(name: string | undefined | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

function normalizeSegment(seg: string): string {
  return seg.replaceAll('-', '_');
}

function TopbarBreadcrumbs() {
  const { pathname } = useLocation();
  const { t } = useTranslation(['shell']);

  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{t('shell:nav.dashboard')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/">{t('shell:nav.dashboard')}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((seg, i) => {
          const path = '/' + segments.slice(0, i + 1).join('/');
          const label = t(`shell:nav.${normalizeSegment(seg)}`, seg);
          const isLast = i === segments.length - 1;

          return (
            <BreadcrumbItem key={path}>
              <BreadcrumbSeparator />
              {isLast ? (
                <BreadcrumbPage>{label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={path}>{label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function LanguageSwitcher() {
  const { t } = useTranslation(['shell']);
  const locale = useUiStore((s) => s.locale);
  const setLocale = useUiStore((s) => s.setLocale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 text-xs font-medium">
          {locale.toUpperCase()}
          <ChevronDown className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-28">
        <DropdownMenuItem
          onClick={() => setLocale('ru')}
          className={cn(locale === 'ru' && 'font-semibold')}
        >
          {t('shell:lang.ru')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLocale('kk')}
          className={cn(locale === 'kk' && 'font-semibold')}
        >
          {t('shell:lang.kk')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu() {
  const { t } = useTranslation(['shell', 'errors']);
  const { data: currentUser } = useCurrentUser();
  const email = useSessionStore((s) => s.email);
  const role = useSessionStore((s) => s.role);
  const logoutMutation = useLogout();

  const fullName = currentUser?.full_name;
  const initials = getInitials(fullName);

  const roleBadgeClasses =
    role === 'super_admin'
      ? 'bg-role-super-soft text-role-super-text'
      : 'bg-role-support-soft text-role-support-text';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 rounded-full px-2">
          <div className="grid size-7 place-items-center rounded-full bg-brand-soft text-[11px] font-semibold text-brand-text-on-soft">
            {initials}
          </div>
          <span className="max-w-32 truncate text-[13px] font-medium">{fullName ?? ' '}</span>
          <ChevronDown className="size-3 text-text-tertiary" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {email ?? '—'}
        </DropdownMenuLabel>
        {role && (
          <DropdownMenuLabel>
            <span
              className={cn(
                'inline-block rounded-full px-2 py-0.5 text-[11px] font-medium',
                roleBadgeClasses,
              )}
            >
              {t(`shell:role.${role}`)}
            </span>
          </DropdownMenuLabel>
        )}
        <DropdownMenuSeparator />
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <DropdownMenuItem disabled>
                  <User className="mr-2 h-4 w-4" />
                  {t('shell:user_menu.profile')}
                </DropdownMenuItem>
              </span>
            </TooltipTrigger>
            <TooltipContent>{t('errors:blocked.b11_short')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <DropdownMenuItem disabled>
                  <KeyRound className="mr-2 h-4 w-4" />
                  {t('shell:user_menu.change_password')}
                </DropdownMenuItem>
              </span>
            </TooltipTrigger>
            <TooltipContent>{t('errors:blocked.b11_short')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground" aria-label="App version">
          v{__APP_VERSION__}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="#" rel="noopener noreferrer">
            {t('shell:user_menu.docs')}
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => logoutMutation.mutate()}>
          <LogOut className="size-4" />
          {t('shell:user_menu.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Topbar() {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const { t } = useTranslation(['common']);

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border-default bg-surface px-5">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        aria-label={t('common:actions.toggle_sidebar')}
      >
        <Menu className="size-4" />
      </Button>

      <div className="min-w-0 flex-1">
        <TopbarBreadcrumbs />
      </div>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <UserMenu />
      </div>
    </header>
  );
}
