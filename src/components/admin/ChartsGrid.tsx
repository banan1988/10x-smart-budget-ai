import React from "react";
import AiCategorizationChart from "./AiCategorizationChart";
import TrendChart from "./TrendChart";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

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
  categoryBreakdown: { categoryName: string; count: number; percentage: number }[];
  trendData: {
    date: string;
    percentage: number;
  }[];
  pagination?: { page: number; pageSize: number; total: number };
}

interface ChartsGridProps {
  stats: AiCategorizationStatsDto;
}

export default function ChartsGrid({ stats }: ChartsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* AI Categorization Donut Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Proporcja AI vs Ręczne</CardTitle>
        </CardHeader>
        <CardContent>
          <AiCategorizationChart
            aiCount={stats.overall.aiCategorized}
            manualCount={stats.overall.manuallyCategorized}
            height={300}
          />
        </CardContent>
      </Card>

      {/* Trend Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Trend Kategoryzacji AI</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart data={stats.trendData} height={300} />
        </CardContent>
      </Card>
    </div>
  );
}
