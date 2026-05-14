import type { ReactNode } from 'react';

interface DataTableToolbarProps {
  children: ReactNode;
}

export function DataTableToolbar({ children }: DataTableToolbarProps) {
  return <div className="flex flex-wrap items-center gap-3 pb-4">{children}</div>;
}
