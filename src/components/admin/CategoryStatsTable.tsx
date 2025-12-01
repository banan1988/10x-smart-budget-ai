import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import TrendBadge from './TrendBadge';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface CategoryStats {
  categoryId: number;
  categoryName: string;
  categoryKey: string;
  aiCount: number;
  manualCount: number;
  total: number;
  aiPercentage: number;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage?: number;
  };
}

interface CategoryStatsTableProps {
  data: CategoryStats[];
  onSort: (field: string, direction: 'asc' | 'desc') => void;
  isLoading?: boolean;
}

type SortField = 'category' | 'ai' | 'manual' | 'aiPercentage';

export default function CategoryStatsTable({
  data,
  onSort,
  isLoading = false,
}: CategoryStatsTableProps) {
  const [sortField, setSortField] = useState<SortField>('category');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: SortField) => {
    const newDirection =
      sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    onSort(field, newDirection);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ArrowUp size={16} className="inline ml-1" />
    ) : (
      <ArrowDown size={16} className="inline ml-1" />
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-12 dark:border-gray-800 dark:bg-gray-950">
        <div className="text-sm text-gray-500">Ładowanie...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-12 dark:border-gray-800 dark:bg-gray-950">
        <div className="text-sm text-gray-500">Brak danych do wyświetlenia</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              onClick={() => handleSort('category')}
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              Kategoria
              <SortIcon field="category" />
            </TableHead>
            <TableHead
              onClick={() => handleSort('ai')}
              className="cursor-pointer text-right hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              AI
              <SortIcon field="ai" />
            </TableHead>
            <TableHead
              onClick={() => handleSort('manual')}
              className="cursor-pointer text-right hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              Ręczne
              <SortIcon field="manual" />
            </TableHead>
            <TableHead
              onClick={() => handleSort('aiPercentage')}
              className="cursor-pointer text-right hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              % AI
              <SortIcon field="aiPercentage" />
            </TableHead>
            <TableHead className="text-right">Trend</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((stat) => {
            const isLowAiPercentage = stat.aiPercentage < 50;
            const rowClass = isLowAiPercentage
              ? 'bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
              : 'hover:bg-gray-50 dark:hover:bg-gray-900';

            return (
              <TableRow key={stat.categoryId} className={rowClass}>
                <TableCell className="font-medium">{stat.categoryName}</TableCell>
                <TableCell className="text-right">{stat.aiCount}</TableCell>
                <TableCell className="text-right">{stat.manualCount}</TableCell>
                <TableCell className="text-right font-semibold">
                  {stat.aiPercentage.toFixed(1)}%
                </TableCell>
                <TableCell className="text-right">
                  {stat.trend && (
                    <TrendBadge
                      direction={stat.trend.direction}
                      percentage={stat.trend.percentage}
                      variant={
                        stat.trend.direction === 'up'
                          ? 'success'
                          : stat.trend.direction === 'down'
                            ? 'danger'
                            : 'neutral'
                      }
                    />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

