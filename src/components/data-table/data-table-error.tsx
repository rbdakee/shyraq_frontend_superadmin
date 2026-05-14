import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface DataTableErrorProps {
  errorState: {
    error: unknown;
    onRetry: () => void;
    title: string;
    retryLabel: string;
  };
}

export function DataTableError({ errorState }: DataTableErrorProps) {
  return (
    <div className="p-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{errorState.title}</AlertTitle>
        <AlertDescription className="mt-3">
          <Button variant="outline" size="sm" onClick={errorState.onRetry}>
            {errorState.retryLabel}
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
