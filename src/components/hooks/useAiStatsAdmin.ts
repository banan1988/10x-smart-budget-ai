import { useState, useEffect, useCallback } from "react";

interface DateRange {
  startDate: string;
  endDate: string;
}

interface CategoryStats {
  categoryId: number;
  categoryName: string;
  categoryKey: string;
  aiCount: number;
  manualCount: number;
  total: number;
  aiPercentage: number;
  trend?: {
    direction: "up" | "down" | "neutral";
    percentage?: number;
  };
}

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
  categoryBreakdown: CategoryStats[];
  trendData: {
    date: string;
    percentage: number;
  }[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UseAiStatsAdminReturn {
  stats: AiCategorizationStatsDto | null;
  isLoading: boolean;
  error: Error | null;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  refetch: () => void;
  exportToCSV: (filename?: string) => void;
}

/**
 * Get default date range (last 30 days)
 */
function getDefaultDateRange(): DateRange {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 30);

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
}

/**
 * Custom hook for managing AI categorization statistics
 */
export function useAiStatsAdmin(initialDateRange?: DateRange): UseAiStatsAdminReturn {
  const [stats, setStats] = useState<AiCategorizationStatsDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [dateRange, setDateRangeState] = useState<DateRange>(initialDateRange || getDefaultDateRange());

  /**
   * Fetch stats from API
   */
  const fetchStats = useCallback(async (range: DateRange) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        startDate: range.startDate,
        endDate: range.endDate,
      });

      const response = await fetch(`/api/admin/ai-stats?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage = `HTTP error! status: ${response.status}`;

        // Read body once to avoid "body stream already read" error
        const bodyText = await response.text();

        if (contentType?.includes("application/json")) {
          try {
            const data = JSON.parse(bodyText);
            errorMessage = data.error || data.message || errorMessage;
          } catch {
            // If JSON parsing fails, use the text as-is
            errorMessage = bodyText.substring(0, 200) || errorMessage;
          }
        } else {
          // Log non-JSON response for debugging
          // eslint-disable-next-line no-console
          console.error("Non-JSON response from /api/admin/ai-stats:", bodyText.substring(0, 200));
        }

        throw new Error(errorMessage);
      }

      const contentType = response.headers.get("content-type");
      // eslint-disable-next-line no-console
      console.log("[useAiStatsAdmin] Response status:", response.status, "Content-Type:", contentType);

      // Try to parse JSON
      let data: AiCategorizationStatsDto;
      try {
        const responseText = await response.text();
        // eslint-disable-next-line no-console
        console.log("[useAiStatsAdmin] Response body (first 500 chars):", responseText.substring(0, 500));
        data = JSON.parse(responseText) as AiCategorizationStatsDto;
      } catch (parseErr) {
        // eslint-disable-next-line no-console
        console.error("[useAiStatsAdmin] Failed to parse response as JSON:", parseErr);
        throw new Error("Invalid response format: server did not return valid JSON");
      }

      setStats(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      // eslint-disable-next-line no-console
      console.error("Error fetching AI stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch initial stats on mount and when date range changes
   */
  useEffect(() => {
    fetchStats(dateRange);
  }, [dateRange, fetchStats]);

  /**
   * Handle date range change
   */
  const handleDateRangeChange = useCallback(
    (newRange: DateRange) => {
      setDateRangeState(newRange);
      fetchStats(newRange);
    },
    [fetchStats]
  );

  /**
   * Refetch stats with current date range
   */
  const refetch = useCallback(() => {
    fetchStats(dateRange);
  }, [dateRange, fetchStats]);

  /**
   * Export stats to CSV
   */
  const exportToCSV = useCallback(
    (filename = "ai-stats.csv") => {
      if (!stats) {
        // eslint-disable-next-line no-console
        console.warn("No stats data to export");
        return;
      }

      // Prepare CSV header
      const headers = ["Kategoria", "AI", "Ręczne", "% AI", "Trend"];

      // Prepare CSV rows
      const rows = stats.categoryBreakdown.map((cat) => [
        cat.categoryName,
        cat.aiCount.toString(),
        cat.manualCount.toString(),
        `${cat.aiPercentage.toFixed(2)}%`,
        cat.trend?.direction || "neutral",
      ]);

      // Add overall stats
      const overallRow = [
        "RAZEM",
        stats.overall.aiCategorized.toString(),
        stats.overall.manuallyCategorized.toString(),
        `${stats.overall.aiPercentage.toFixed(2)}%`,
        "",
      ];

      // Combine all rows
      const allRows = [headers, ...rows, overallRow];

      // Convert to CSV string
      const csvContent = allRows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

      // Create blob and trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [stats]
  );

  return {
    stats,
    isLoading,
    error,
    dateRange,
    setDateRange: handleDateRangeChange,
    refetch,
    exportToCSV,
  };
}
