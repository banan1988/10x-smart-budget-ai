import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  onAddTransaction: () => void;
}

/**
 * Component displayed when there are no transactions for the selected month
 */
export function EmptyState({ onAddTransaction }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 text-4xl">📊</div>
        <h3 className="mb-2 text-lg font-semibold">Brak transakcji</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          Nie masz jeszcze żadnych transakcji w tym miesiącu.
          <br />
          Dodaj pierwszą transakcję, aby zobaczyć swoje statystyki.
        </p>
        <Button onClick={onAddTransaction}>Dodaj transakcję</Button>
      </CardContent>
    </Card>
  );
}
