import { cn } from '@/lib/cn';

type PulseDotTone = 'success' | 'warning' | 'error' | 'neutral';
type PulseDotSize = 'sm' | 'md';

interface PulseDotProps {
  tone: PulseDotTone;
  size?: PulseDotSize;
  className?: string;
}

const toneClasses: Record<PulseDotTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  neutral: 'bg-text-quaternary',
};

const sizeClasses: Record<PulseDotSize, string> = {
  sm: 'size-2',
  md: 'size-3',
};

export function PulseDot({ tone, size = 'sm', className }: PulseDotProps) {
  const colorClass = toneClasses[tone];
  const sizeClass = sizeClasses[size];

  return (
    <span className={cn('relative inline-flex', sizeClass, className)}>
      <span className={cn('absolute inset-0 rounded-full opacity-75 animate-ping', colorClass)} />
      <span className={cn('relative inline-flex rounded-full', sizeClass, colorClass)} />
    </span>
  );
}
