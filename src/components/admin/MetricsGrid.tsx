import React from 'react';
import MetricCard from './MetricCard';
import TrendBadge from './TrendBadge';

interface AiCategorizationStatsDto {
  period: {
    startDate: string;
    endDate: string;
  };
  overall: {
    totalTransactions: number;
    aiCategorized: number;
    manuallyCategorized: number;
    aiPercentage: number;
  };
  categoryBreakdown: any[];
  trendData: any[];
  pagination?: any;
}

interface MetricsGridProps {
  stats: AiCategorizationStatsDto;
}

export default function MetricsGrid({ stats }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* AI Categorization Percentage */}
      <MetricCard
        title="% AI Kategoryzacji"
        value={`${stats.overall.aiPercentage.toFixed(1)}%`}
        description="Procent transakcji kategoryzowanych przez AI"
        badge={<TrendBadge direction="up" percentage={5} variant="success" />}
      />

      {/* AI Transactions Count */}
      <MetricCard
        title="Transakcje AI"
        value={stats.overall.aiCategorized.toString()}
        description={`z ${stats.overall.totalTransactions} transakcji`}
        badge={<TrendBadge direction="up" percentage={10} variant="success" />}
      />

      {/* Manual Transactions Count */}
      <MetricCard
        title="Transakcje Ręczne"
        value={stats.overall.manuallyCategorized.toString()}
        description={`z ${stats.overall.totalTransactions} transakcji`}
        badge={<TrendBadge direction="neutral" variant="neutral" />}
      />

      {/* Total Transactions */}
      <MetricCard
        title="Razem Transakcji"
        value={stats.overall.totalTransactions.toString()}
        description={`w okresie ${stats.period.startDate} do ${stats.period.endDate}`}
        badge={<TrendBadge direction="up" percentage={2} variant="success" />}
      />
    </div>
  );
}

