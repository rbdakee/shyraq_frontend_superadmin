import { cn } from '@/lib/cn';
import { PulseDot } from '@/components/feedback/pulse-dot';

interface HealthRowProps {
  name: string;
  status: 'up' | 'down';
  lastCheckedAt?: Date | number | string | null;
  className?: string;
}

function formatTimestamp(value: Date | number | string): string {
  if (typeof value === 'string') return value;
  return new Date(value).toLocaleTimeString();
}

export function HealthRow({ name, status, lastCheckedAt, className }: HealthRowProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <PulseDot tone={status === 'up' ? 'success' : 'error'} />
      <span className="flex-1 text-sm text-text-primary">{name}</span>
      <span className="text-xs text-text-secondary">{status}</span>
      {lastCheckedAt != null && (
        <span className="text-xs text-text-tertiary">{formatTimestamp(lastCheckedAt)}</span>
      )}
    </div>
  );
}
