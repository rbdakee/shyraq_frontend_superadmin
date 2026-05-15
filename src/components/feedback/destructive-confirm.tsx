import { useState, type ReactNode } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export interface DestructiveConfirmProps {
  trigger: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmationField?: {
    label: string;
    expectedValue: string;
    placeholder?: string;
  };
  confirmLabel: string;
  cancelLabel: string;
  confirmVariant?: 'destructive' | 'default';
  onConfirm: () => void | Promise<void>;
  isPending?: boolean;
}

export function DestructiveConfirm({
  trigger,
  open: controlledOpen,
  onOpenChange,
  title,
  description,
  confirmationField,
  confirmLabel,
  cancelLabel,
  confirmVariant = 'destructive',
  onConfirm,
  isPending,
}: DestructiveConfirmProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [typed, setTyped] = useState('');

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (next: boolean) => {
    if (isControlled) {
      onOpenChange?.(next);
    } else {
      setInternalOpen(next);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setTyped('');
  };

  const matches = confirmationField ? typed === confirmationField.expectedValue : true;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {confirmationField && (
          <div className="grid gap-2 py-2">
            <Label htmlFor="destructive-confirm-input">{confirmationField.label}</Label>
            <Input
              id="destructive-confirm-input"
              autoComplete="off"
              placeholder={confirmationField.placeholder}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={handleConfirm} disabled={!matches || isPending}>
            {isPending ? '…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
