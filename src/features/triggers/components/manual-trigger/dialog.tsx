"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ManualTriggerDialog = ({ open, onOpenChange }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manual Trigger</DialogTitle>
          <DialogDescription>
            Configure settings for the manual trigger node.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="text-sm leading-relaxed">
            This trigger allows you to manually execute the workflow. It does
            not require any configuration and produces no initial payload.
          </div>

          <p className="text-sm  mt-3">
            Use it when you need to run the workflow on demand or for testing
            purposes.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
