import React, { useState } from "react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Download } from "lucide-react";

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

interface ExportButtonProps {
  data: CategoryStats[];
  trendData?: {
    date: string;
    percentage: number;
  }[];
  fileName?: string;
  isLoading?: boolean;
  onExport?: () => void;
}

export default function ExportButton({ data, fileName = "ai-stats", isLoading = false, onExport }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      // Prepare CSV header
      const headers = ["Kategoria", "AI", "Ręczne", "% AI", "Trend"];

      // Prepare CSV rows
      const rows = data.map((cat) => [
        cat.categoryName,
        cat.aiCount.toString(),
        cat.manualCount.toString(),
        `${cat.aiPercentage.toFixed(2)}%`,
        cat.trend?.direction || "neutral",
      ]);

      // Add total row
      const totalAi = data.reduce((sum, cat) => sum + cat.aiCount, 0);
      const totalManual = data.reduce((sum, cat) => sum + cat.manualCount, 0);
      const totalPercentage = totalAi + totalManual > 0 ? (totalAi / (totalAi + totalManual)) * 100 : 0;

      const totalRow = ["RAZEM", totalAi.toString(), totalManual.toString(), `${totalPercentage.toFixed(2)}%`, ""];

      // Combine all rows
      const allRows = [headers, ...rows, totalRow];

      // Convert to CSV string
      const csvContent = allRows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

      // Create blob and trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", `${fileName}-${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onExport?.();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error exporting CSV:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isLoading || isExporting || data.length === 0} variant="outline" className="gap-2">
          <Download size={16} />
          {isExporting ? "Eksportowanie..." : "Eksportuj"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV} disabled={isExporting}>
          <span>Eksportuj jako CSV</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
