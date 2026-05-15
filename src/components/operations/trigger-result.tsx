import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/format';

export interface TriggerResultRow {
  label: string;
  value: ReactNode;
}

export interface TriggerResultProps {
  ts: number;
  variant: 'async-enqueued' | 'sync-counters' | 'error';
  title: string;
  rows: TriggerResultRow[];
  detailsLabel?: string;
  details?: ReactNode;
}

const BADGE_VARIANT_MAP: Record<TriggerResultProps['variant'], 'success' | 'info' | 'error'> = {
  'async-enqueued': 'success',
  'sync-counters': 'info',
  error: 'error',
};

export function TriggerResult({
  ts,
  variant,
  title,
  rows,
  detailsLabel,
  details,
}: TriggerResultProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Badge variant={BADGE_VARIANT_MAP[variant]}>{title}</Badge>
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(new Date(ts).toISOString())}
        </span>
      </div>

      <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-sm">
        {rows.map((row, i) => (
          <div key={i} className="contents">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>

      {detailsLabel && details && (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm text-muted-foreground">{detailsLabel}</summary>
          <div className="mt-2">{details}</div>
        </details>
      )}
    </div>
  );
}
