import React, { useState, useCallback } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { AlertCircle } from "lucide-react";

interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateRangeFilterProps {
  onDateRangeChange: (range: DateRange) => void;
  isLoading?: boolean;
  defaultRange?: DateRange;
  showPresets?: boolean;
}

const PRESET_OPTIONS = [
  { label: "Ostatnie 7 dni", days: 7 },
  { label: "Ostatnie 30 dni", days: 30 },
  { label: "Ostatnie 90 dni", days: 90 },
];

/**
 * Get date string in YYYY-MM-DD format
 */
function formatDateToString(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Parse date string in YYYY-MM-DD format
 */
function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Check if date is valid and not in the future
 */
function isValidDate(dateStr: string): { valid: boolean; message?: string } {
  if (!dateStr) {
    return { valid: false, message: "Data jest wymagana" };
  }

  const date = parseDateString(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date > today) {
    return { valid: false, message: "Data nie może być w przyszłości" };
  }

  return { valid: true };
}

/**
 * DateRangeFilter component for selecting date range with presets
 */
export default function DateRangeFilter({
  onDateRangeChange,
  isLoading = false,
  defaultRange,
  showPresets = true,
}: DateRangeFilterProps) {
  // Get default range (last 30 days)
  const getDefaultDateRange = useCallback((): DateRange => {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 30);

    return {
      startDate: formatDateToString(startDate),
      endDate: formatDateToString(endDate),
    };
  }, []);

  const [startDate, setStartDate] = useState(defaultRange?.startDate || getDefaultDateRange().startDate);
  const [endDate, setEndDate] = useState(defaultRange?.endDate || getDefaultDateRange().endDate);
  const [error, setError] = useState<string | null>(null);

  /**
   * Validate and apply date range
   */
  const handleApply = useCallback(() => {
    setError(null);

    // Validate dates
    const startValidation = isValidDate(startDate);
    const endValidation = isValidDate(endDate);

    if (!startValidation.valid) {
      setError(startValidation.message || "Data początkowa jest nieprawidłowa");
      return;
    }

    if (!endValidation.valid) {
      setError(endValidation.message || "Data końcowa jest nieprawidłowa");
      return;
    }

    // Check if start date is before end date
    if (startDate > endDate) {
      setError("Data początkowa nie może być po dacie końcowej");
      return;
    }

    // Apply filter
    onDateRangeChange({ startDate, endDate });
  }, [startDate, endDate, onDateRangeChange]);

  /**
   * Reset to default range
   */
  const handleReset = useCallback(() => {
    const defaultRange = getDefaultDateRange();
    setStartDate(defaultRange.startDate);
    setEndDate(defaultRange.endDate);
    setError(null);
    onDateRangeChange(defaultRange);
  }, [getDefaultDateRange, onDateRangeChange]);

  /**
   * Handle preset option selection
   */
  const handlePreset = useCallback(
    (days: number) => {
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days);

      const newRange = {
        startDate: formatDateToString(startDate),
        endDate: formatDateToString(endDate),
      };

      setStartDate(newRange.startDate);
      setEndDate(newRange.endDate);
      setError(null);
      onDateRangeChange(newRange);
    },
    [onDateRangeChange]
  );

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
      <Label className="block text-sm font-semibold text-gray-900 dark:text-white">Zakres dat</Label>

      {/* Date Inputs */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="startDate" className="text-sm text-gray-700 dark:text-gray-300">
            Od
          </Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={isLoading}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="endDate" className="text-sm text-gray-700 dark:text-gray-300">
            Do
          </Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={isLoading}
            className="mt-1"
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Preset Buttons */}
      {showPresets && (
        <div className="mt-4">
          <Label className="text-sm text-gray-700 dark:text-gray-300">Szybkie opcje</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRESET_OPTIONS.map((preset) => (
              <Button
                key={preset.days}
                variant="outline"
                size="sm"
                onClick={() => handlePreset(preset.days)}
                disabled={isLoading}
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3">
        <Button onClick={handleApply} disabled={isLoading} className="flex-1">
          {isLoading ? "Ładowanie..." : "Zastosuj"}
        </Button>
        <Button onClick={handleReset} variant="outline" disabled={isLoading} className="flex-1">
          Resetuj
        </Button>
      </div>
    </div>
  );
}
