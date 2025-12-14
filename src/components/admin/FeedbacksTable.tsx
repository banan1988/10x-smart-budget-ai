import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { formatDate } from "../../lib/utils";
import type { FeedbackDto } from "../../types";

interface FeedbacksTableProps {
  data: FeedbackDto[];
  onSort?: (field: string, direction: "asc" | "desc") => void;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

export default function FeedbacksTable({
  data,
  onSort,
  isLoading = false,
  sortField = "created_at",
  sortDirection = "desc",
}: FeedbacksTableProps) {
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  const handleSort = (field: string) => {
    if (!onSort) return;

    const newDirection = sortField === field && sortDirection === "desc" ? "asc" : "desc";
    onSort(field, newDirection);
  };

  const getSortIndicator = (field: string) => {
    if (sortField !== field) return " ↕️";
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Ładowanie...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Brak feedbacków</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
      <Table>
        <TableHeader>
          <TableRow className="border-gray-200 dark:border-gray-800">
            <TableHead
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900"
              onClick={() => handleSort("created_at")}
            >
              Data{getSortIndicator("created_at")}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900"
              onClick={() => handleSort("rating")}
            >
              Ocena{getSortIndicator("rating")}
            </TableHead>
            <TableHead>Komentarz</TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900"
              onClick={() => handleSort("user_id")}
            >
              ID Użytkownika{getSortIndicator("user_id")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((feedback) => (
            <React.Fragment key={feedback.id}>
              <TableRow
                className="cursor-pointer border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/50"
                onClick={() => setExpandedRowId(expandedRowId === feedback.id ? null : feedback.id)}
              >
                <TableCell className="text-sm">{formatDate(feedback.created_at)}</TableCell>
                <TableCell className="text-sm">
                  <span className="inline-flex items-center gap-1">
                    {"⭐".repeat(feedback.rating)}
                    <span className="font-semibold text-gray-900 dark:text-white">{feedback.rating}/5</span>
                  </span>
                </TableCell>
                <TableCell className="max-w-xs truncate text-sm text-gray-600 dark:text-gray-400">
                  {feedback.comment || "—"}
                </TableCell>
                <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                  {feedback.user_id.substring(0, 8)}...
                </TableCell>
              </TableRow>

              {/* Expanded row with full comment */}
              {expandedRowId === feedback.id && feedback.comment && (
                <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                  <TableCell colSpan={4} className="py-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Pełny komentarz:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words">
                        {feedback.comment}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">ID Użytkownika: {feedback.user_id}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
