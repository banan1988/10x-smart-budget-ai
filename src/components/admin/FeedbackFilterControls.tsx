import React, { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import type { FeedbackFilters } from '../../types';

interface FeedbackFilterControlsProps {
  onFilterChange: (filters: FeedbackFilters) => void;
  isLoading?: boolean;
  defaultValues?: FeedbackFilters;
}

export default function FeedbackFilterControls({
  onFilterChange,
  isLoading = false,
  defaultValues = {},
}: FeedbackFilterControlsProps) {
  const [startDate, setStartDate] = useState(defaultValues.startDate || '');
  const [endDate, setEndDate] = useState(defaultValues.endDate || '');
  const [rating, setRating] = useState(defaultValues.rating?.toString() || '');

  const handleApply = useCallback(() => {
    const filters: FeedbackFilters = {};

    if (startDate) {
      filters.startDate = startDate;
    }
    if (endDate) {
      filters.endDate = endDate;
    }
    if (rating && rating !== '' && rating !== 'all') {
      filters.rating = parseInt(rating, 10);
    }

    onFilterChange(filters);
  }, [startDate, endDate, rating, onFilterChange]);

  const handleClear = useCallback(() => {
    setStartDate('');
    setEndDate('');
    setRating('');
    onFilterChange({});
  }, [onFilterChange]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
      <div className="flex flex-col gap-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Filtry</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Start Date */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Od
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isLoading}
              className="dark:bg-gray-900"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Do
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isLoading}
              className="dark:bg-gray-900"
            />
          </div>

          {/* Rating Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Ocena
            </label>
            <Select value={rating} onValueChange={setRating} disabled={isLoading}>
              <SelectTrigger className="dark:bg-gray-900">
                <SelectValue placeholder="Wszystkie oceny" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie oceny</SelectItem>
                <SelectItem value="5">5 ⭐</SelectItem>
                <SelectItem value="4">4 ⭐</SelectItem>
                <SelectItem value="3">3 ⭐</SelectItem>
                <SelectItem value="2">2 ⭐</SelectItem>
                <SelectItem value="1">1 ⭐</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 justify-end">
            <div className="flex gap-2">
              <Button
                onClick={handleApply}
                disabled={isLoading}
                className="flex-1"
                variant="default"
              >
                Zastosuj
              </Button>
              <Button
                onClick={handleClear}
                disabled={isLoading}
                className="flex-1"
                variant="outline"
              >
                Wyczyść
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

