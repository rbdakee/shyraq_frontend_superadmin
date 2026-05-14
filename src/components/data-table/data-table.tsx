'use no memo';

import type { ReactNode } from 'react';
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/cn';
import { DataTableLoading } from './data-table-loading';
import { DataTableEmpty } from './data-table-empty';
import { DataTableError } from './data-table-error';
import { DataTablePagination } from './data-table-pagination';

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  state: 'loading' | 'loaded' | 'empty' | 'error';
  toolbar?: ReactNode;
  pagination?: {
    hasNext: boolean;
    hasPrev: boolean;
    onNext: () => void;
    onPrev: () => void;
    rangeLabel: string;
    prevLabel: string;
    nextLabel: string;
  };
  emptyState?: { title: string; description?: string; cta?: ReactNode };
  errorState?: { error: unknown; onRetry: () => void; title: string; retryLabel: string };
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  data,
  columns,
  state,
  toolbar,
  pagination,
  emptyState,
  errorState,
  onRowClick,
}: DataTableProps<T>) {
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table v8 API is known-incompatible with React Compiler
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
    enableMultiSort: false,
  });

  return (
    <div className="flex flex-col">
      {toolbar}
      <div className="rounded-lg border border-border-default bg-surface">
        {state === 'loading' && <DataTableLoading rows={5} columns={columns.length} />}
        {state === 'error' && errorState && <DataTableError errorState={errorState} />}
        {state === 'empty' && emptyState && <DataTableEmpty emptyState={emptyState} />}
        {state === 'loaded' && (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead key={header.id} className="text-text-secondary">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn(onRowClick && 'cursor-pointer')}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      onClick={
                        cell.column.id === 'actions' ? (e) => e.stopPropagation() : undefined
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      {state === 'loaded' && pagination && <DataTablePagination {...pagination} />}
    </div>
  );
}
