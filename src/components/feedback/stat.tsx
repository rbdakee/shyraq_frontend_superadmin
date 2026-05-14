import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface StatProps {
  label: string;
  value: ReactNode;
  badge?: ReactNode;
  divider?: boolean;
  className?: string;
}

export function Stat({ label, value, badge, divider, className }: StatProps) {
  return (
    <div className={cn('flex flex-col gap-1', divider && 'border-b border-border pb-3', className)}>
      <span className="text-xs uppercase tracking-wider text-text-tertiary">{label}</span>
      <span className="text-2xl font-semibold text-text-primary">{value}</span>
      {badge != null && <div>{badge}</div>}
    </div>
  );
}
