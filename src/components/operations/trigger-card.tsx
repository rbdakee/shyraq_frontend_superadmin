import { useState, type ReactNode } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TriggerCardBaseProps {
  title: string;
  icon: ReactNode;
  description: string;
  formFields: ReactNode;
  onTrigger: () => void | Promise<void>;
  triggerLabel: string;
  triggerPendingLabel: string;
  isPending: boolean;
  isDisabled?: boolean;
  result?: ReactNode;
}

type TriggerCardConfirmProps =
  | {
      confirmTitle: string;
      confirmDescription?: string;
      confirmLabel: string;
      cancelLabel: string;
    }
  | {
      confirmTitle?: undefined;
      confirmDescription?: undefined;
      confirmLabel?: undefined;
      cancelLabel?: undefined;
    };

export type TriggerCardProps = TriggerCardBaseProps & TriggerCardConfirmProps;

export function TriggerCard(props: TriggerCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const needsConfirm = !!props.confirmTitle;

  const handleClick = () => {
    if (needsConfirm) {
      setConfirmOpen(true);
    } else {
      void props.onTrigger();
    }
  };

  const handleConfirm = () => {
    void Promise.resolve(props.onTrigger()).then(() => {
      setConfirmOpen(false);
    });
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
            {props.icon}
          </div>
          <div className="flex flex-col gap-1">
            <CardTitle>{props.title}</CardTitle>
            <CardDescription>{props.description}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">{props.formFields}</CardContent>

      <CardFooter className="justify-end">
        <Button onClick={handleClick} disabled={props.isPending || props.isDisabled}>
          {props.isPending ? props.triggerPendingLabel : props.triggerLabel}
        </Button>
      </CardFooter>

      {props.result && <div className="border-t px-4 py-4">{props.result}</div>}

      {needsConfirm && (
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{props.confirmTitle}</DialogTitle>
              {props.confirmDescription && (
                <DialogDescription>{props.confirmDescription}</DialogDescription>
              )}
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setConfirmOpen(false)}
                disabled={props.isPending}
              >
                {props.cancelLabel}
              </Button>
              <Button onClick={handleConfirm} disabled={props.isPending}>
                {props.isPending ? props.triggerPendingLabel : props.confirmLabel}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
