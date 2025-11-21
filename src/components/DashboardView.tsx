import { useState } from 'react';
import { useDashboardStats } from '@/components/hooks/useDashboardStats';
import { MetricCard } from '@/components/MetricCard';
import { ExpensesPieChart } from '@/components/ExpensesPieChart';
import { DailyIncomeExpensesChart } from '@/components/DailyIncomeExpensesChart';
import { AiSummary } from '@/components/AiSummary';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Get current month in YYYY-MM format
 */
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Main dashboard view component
 */
export function DashboardView() {
  const currentMonth = getCurrentMonth();
  const { data, isLoading, error, refetch } = useDashboardStats(currentMonth);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleAddTransaction = () => {
    setIsAddDialogOpen(true);
  };

  const handleTransactionSuccess = () => {
    setIsAddDialogOpen(false);
    refetch();
  };

  // Loading state
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            Wystąpił błąd podczas ładowania danych: {error.message}
          </AlertDescription>
        </Alert>
        <Button onClick={refetch}>Spróbuj ponownie</Button>
      </div>
    );
  }

  // Empty state - no data
  if (!data || data.metrics.every((m) => m.value === '0,00 zł')) {
    return (
      <>
        <EmptyState onAddTransaction={handleAddTransaction} />
        <AddTransactionDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSuccess={handleTransactionSuccess}
        />
      </>
    );
  }

  // Success state - display dashboard
  return (
    <div className="space-y-6">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pulpit nawigacyjny</h1>
          <p className="text-muted-foreground">
            Przegląd finansów za {new Date(currentMonth + '-01').toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Button onClick={handleAddTransaction}>Dodaj transakcję</Button>
      </div>

      {/* Metrics cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {data.metrics.map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Expenses pie chart */}
        {data.categoryBreakdown && data.categoryBreakdown.length > 0 && (
          <ExpensesPieChart data={data.categoryBreakdown} />
        )}

        {/* Daily income/expenses bar chart */}
        {data.dailyBreakdown && data.dailyBreakdown.length > 0 && (
          <DailyIncomeExpensesChart data={data.dailyBreakdown} />
        )}
      </div>

      {/* AI Summary */}
      {data.aiSummary && <AiSummary summary={data.aiSummary} />}

      {/* Add Transaction Dialog */}
      <AddTransactionDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleTransactionSuccess}
      />
    </div>
  );
}

