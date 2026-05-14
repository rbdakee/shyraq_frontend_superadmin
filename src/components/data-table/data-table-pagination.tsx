import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DataTablePaginationProps {
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  rangeLabel: string;
  prevLabel: string;
  nextLabel: string;
}

export function DataTablePagination({
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  rangeLabel,
  prevLabel,
  nextLabel,
}: DataTablePaginationProps) {
  return (
    <div className="flex items-center justify-between pt-3">
      <span className="text-sm text-text-secondary">{rangeLabel}</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={!hasPrev} onClick={onPrev}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          {prevLabel}
        </Button>
        <Button variant="outline" size="sm" disabled={!hasNext} onClick={onNext}>
          {nextLabel}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
