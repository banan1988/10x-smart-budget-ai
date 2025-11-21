import { useState, useEffect, useCallback } from 'react';
import type { DashboardVM, MetricCardVM, CategoryBreakdownVM, DailyBreakdownVM, TransactionStatsDto } from '@/types';

interface UseDashboardStatsResult {
  data: DashboardVM | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Format amount to Polish currency format
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(amount / 100);
}

/**
 * Map TransactionStatsDto to DashboardVM
 */
function mapToDashboardVM(dto: TransactionStatsDto): DashboardVM {
  const balanceValue = dto.balance;
  const balanceSign = balanceValue >= 0 ? '+' : '';
  const balanceFormatted = `${balanceSign}${formatCurrency(balanceValue)}`;

  const metrics: MetricCardVM[] = [
    {
      title: 'Przychody',
      value: formatCurrency(dto.totalIncome),
      variant: 'income',
    },
    {
      title: 'Wydatki',
      value: formatCurrency(dto.totalExpenses),
      variant: 'expense',
    },
    {
      title: 'Bilans',
      value: balanceFormatted,
      variant: balanceValue >= 0 ? 'balance-positive' : 'balance-negative',
    },
  ];

  // Map category breakdown with percentage
  const categoryBreakdown: CategoryBreakdownVM[] = dto.categoryBreakdown
    .map((category) => ({
      name: category.categoryName,
      total: category.total / 100, // Convert from cents to PLN for chart
      percentage: category.percentage,
    }));

  // Map daily breakdown
  const dailyBreakdown: DailyBreakdownVM[] = dto.dailyBreakdown.map((day) => ({
    date: day.date,
    day: new Date(day.date).getDate().toString(),
    income: day.income / 100, // Convert from cents to PLN
    expenses: day.expenses / 100, // Convert from cents to PLN
  }));

  return {
    metrics,
    categoryBreakdown,
    dailyBreakdown,
    aiSummary: dto.aiSummary,
  };
}

/**
 * Custom hook for fetching and managing dashboard statistics
 */
export function useDashboardStats(month: string): UseDashboardStatsResult {
  const [data, setData] = useState<DashboardVM | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        month,
        includeAiSummary: 'true',
      });

      const response = await fetch(`/api/transactions/stats?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }

      const dto: TransactionStatsDto = await response.json();
      const viewModel = mapToDashboardVM(dto);
      setData(viewModel);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refetch = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}

