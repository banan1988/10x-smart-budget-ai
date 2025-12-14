import React, { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useAiStatsAdmin } from "./hooks/useAiStatsAdmin";
import DateRangeFilter from "./admin/DateRangeFilter";
import MetricsGrid from "./admin/MetricsGrid";
import ChartsGrid from "./admin/ChartsGrid";
import CategoryStatsTable from "./admin/CategoryStatsTable";
import ExportButton from "./admin/ExportButton";
import { Skeleton } from "./ui/skeleton";

interface DateRange {
  startDate: string;
  endDate: string;
}

interface SortConfig {
  field: string;
  direction: "asc" | "desc";
}

export default function AiStatsView() {
  const { stats, isLoading, error, dateRange, setDateRange, refetch, exportToCSV } = useAiStatsAdmin();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: "category", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);

  // Handle errors with toast
  useEffect(() => {
    if (error) {
      toast.error("Błąd podczas ładowania statystyk", {
        description: error.message,
        action: {
          label: "Spróbuj ponownie",
          onClick: refetch,
        },
      });
    }
  }, [error, refetch]);

  const handleDateRangeChange = useCallback(
    (range: DateRange) => {
      setDateRange(range);
      setCurrentPage(1); // Reset to first page when changing date range
    },
    [setDateRange]
  );

  const handleSort = useCallback((field: string, direction: "asc" | "desc") => {
    setSortConfig({ field, direction });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleExport = useCallback(() => {
    try {
      exportToCSV();
      toast.success("Dane zostały wyeksportowane", {
        description: "Plik CSV został pobrany pomyślnie",
      });
    } catch (err) {
      toast.error("Nie udało się wyeksportować danych", {
        description: err instanceof Error ? err.message : "Nieznany błąd",
      });
    }
  }, [exportToCSV]);

  // Get sorted category stats
  const sortedCategories = stats
    ? [...stats.categoryBreakdown].sort((a, b) => {
        let aValue: number | string = 0;
        let bValue: number | string = 0;

        switch (sortConfig.field) {
          case "category":
            aValue = a.categoryName;
            bValue = b.categoryName;
            break;
          case "ai":
            aValue = a.aiCount;
            bValue = b.aiCount;
            break;
          case "manual":
            aValue = a.manualCount;
            bValue = b.manualCount;
            break;
          case "aiPercentage":
            aValue = a.aiPercentage;
            bValue = b.aiPercentage;
            break;
          default:
            return 0;
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }

        const diff = (aValue as number) - (bValue as number);
        return sortConfig.direction === "asc" ? diff : -diff;
      })
    : [];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Statystyki AI Kategoryzacji</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitorowanie efektywności automatycznej kategoryzacji wydatków
          </p>
        </div>
        <ExportButton
          data={stats?.categoryBreakdown || []}
          trendData={stats?.trendData}
          isLoading={isLoading}
          onExport={handleExport}
        />
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter
        onDateRangeChange={handleDateRangeChange}
        isLoading={isLoading}
        defaultRange={dateRange}
        showPresets={true}
      />

      {/* Metrics Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : stats ? (
        <MetricsGrid stats={stats} />
      ) : null}

      {/* Charts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      ) : stats ? (
        <ChartsGrid stats={stats} />
      ) : null}

      {/* Category Stats Table */}
      {isLoading ? (
        <Skeleton className="h-96" />
      ) : stats && stats.categoryBreakdown.length > 0 ? (
        <>
          <CategoryStatsTable data={sortedCategories} onSort={handleSort} isLoading={isLoading} />

          {/* Pagination */}
          {stats.pagination && stats.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="rounded-md px-3 py-2 text-sm font-medium disabled:opacity-50"
              >
                Poprzednia
              </button>
              <span className="text-sm font-medium">
                Strona {currentPage} z {stats.pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(Math.min(stats.pagination.totalPages, currentPage + 1))}
                disabled={currentPage === stats.pagination.totalPages}
                className="rounded-md px-3 py-2 text-sm font-medium disabled:opacity-50"
              >
                Następna
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">Brak danych</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Nie znaleziono transakcji w wybranym zakresie dat.
            </p>
            <button
              onClick={() => handleDateRangeChange({ startDate: "", endDate: "" })}
              className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              Resetuj filtry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
