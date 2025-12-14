import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { toast } from "sonner";

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog component for confirming account deletion.
 * Handles the DELETE /api/user API call and redirects after successful deletion.
 */
export function DeleteAccountDialog({ isOpen, onOpenChange }: DeleteAccountDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/user", {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Sesja wygasła. Zaloguj się ponownie.");
          window.location.href = "/login";
          return;
        }

        const errorData = await response.json();
        const errorMessage = errorData.message || "Nie udało się usunąć konta";
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      // Successful deletion (204 No Content)
      toast.success("Konto zostało usunięte");

      // Sign out and redirect to home page
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      // Small delay to show the toast
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error deleting account:", error);
      const errorMessage = "Błąd połączenia. Sprawdź swoją sieć internetową i spróbuj ponownie.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    if (!isDeleting) {
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">Czy na pewno chcesz usunąć konto?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Ta operacja jest nieodwracalna. Wszystkie Twoje dane zostaną trwale usunięte z naszych serwerów.</p>
            <p className="font-semibold">Nie będziesz mógł odzyskać swoich transakcji, kategorii ani innych danych.</p>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                Błąd: {error}
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isDeleting}>
            Anuluj
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Usuwanie..." : "Usuń konto"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
