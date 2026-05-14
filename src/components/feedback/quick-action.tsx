import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

type QuickActionTone = 'default' | 'warning';

interface QuickActionProps {
  to: string;
  icon: LucideIcon;
  label: string;
  badge?: ReactNode;
  tone?: QuickActionTone;
  className?: string;
}

export function QuickAction({
  to,
  icon: Icon,
  label,
  badge,
  tone = 'default',
  className,
}: QuickActionProps) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-2.5 rounded-shyraq-md border px-3 py-2.5',
        'text-sm font-medium no-underline',
        'transition-all hover:-translate-y-px hover:shadow-shyraq-sm',
        tone === 'warning'
          ? 'border-warning-soft-border bg-warning-soft text-warning-text hover:bg-warning-soft'
          : 'border-border-default bg-surface-2 text-text-primary hover:bg-surface-hover',
        className,
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {badge != null && <span className="ml-auto">{badge}</span>}
    </Link>
  );
}
