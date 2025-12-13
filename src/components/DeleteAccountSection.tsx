import React, { useState } from "react";
import { Button } from "./ui/button";
import { DeleteAccountDialog } from "./DeleteAccountDialog";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

/**
 * Component containing the "Delete Account" button and managing the deletion dialog.
 * Displays warning about the irreversibility of account deletion.
 */
export function DeleteAccountSection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <section className="rounded-lg border border-destructive/50 bg-card p-6" aria-labelledby="delete-account-heading">
      <div className="mb-6">
        <h2 id="delete-account-heading" className="text-2xl font-semibold text-destructive">
          Strefa niebezpieczna
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">Trwałe usunięcie konta i wszystkich danych</p>
      </div>

      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Uwaga!</AlertTitle>
        <AlertDescription>
          Usunięcie konta jest nieodwracalne. Wszystkie Twoje dane, w tym transakcje, kategorie i ustawienia, zostaną
          trwale usunięte.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">Po usunięciu konta:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>Utracisz dostęp do wszystkich swoich danych</li>
            <li>Wszystkie transakcje zostaną trwale usunięte</li>
            <li>Ustawienia i preferencje zostaną usunięte</li>
            <li>Nie będzie możliwości odzyskania danych</li>
          </ul>
        </div>

        <Button variant="destructive" onClick={() => setIsDialogOpen(true)} className="mt-4">
          Usuń konto
        </Button>
      </div>

      <DeleteAccountDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </section>
  );
}
