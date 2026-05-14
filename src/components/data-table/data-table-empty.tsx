import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface DataTableEmptyProps {
  emptyState: {
    title: string;
    description?: string;
    cta?: ReactNode;
  };
}

export function DataTableEmpty({ emptyState }: DataTableEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <Inbox className="h-12 w-12 text-text-tertiary" />
      <div className="space-y-1">
        <p className="text-base font-medium text-text-primary">{emptyState.title}</p>
        {emptyState.description && (
          <p className="text-sm text-text-secondary">{emptyState.description}</p>
        )}
      </div>
      {emptyState.cta && <div className="pt-2">{emptyState.cta}</div>}
    </div>
  );
}
