import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface FeedbackDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  children?: ReactNode;
}

/**
 * Modal dialog for feedback form.
 * Manages dialog state and contains the FeedbackForm component.
 */
export function FeedbackDialog({ isOpen, onOpenChange, children }: FeedbackDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Prześlij opinię</DialogTitle>
          <DialogDescription>Pomóż nam ulepszyć aplikację. Powiedz nam, co myślisz!</DialogDescription>
        </DialogHeader>
        <div className="py-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
