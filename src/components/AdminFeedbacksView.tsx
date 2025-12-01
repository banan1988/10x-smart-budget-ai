import React, { useMemo, useState } from 'react';
import FeedbackFilterControls from './admin/FeedbackFilterControls';
import RatingDistributionChart from './admin/RatingDistributionChart';
import FeedbacksTable from './admin/FeedbacksTable';
import MetricCard from './admin/MetricCard';
import TrendBadge from './admin/TrendBadge';
import EmptyStateAdmin from './EmptyStateAdmin';
import {
  MetricCardSkeleton,
  ChartSkeleton,
  FilterSkeleton,
  TableSkeleton,
} from './SkeletonsAdmin';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './ui/pagination';
import { useAdminFeedbacks } from './hooks/useAdminFeedbacks';
import type { FeedbackFilters } from '../types';

interface AdminFeedbacksViewProps {
  initialPage?: number;
}

export default function AdminFeedbacksView({
  initialPage = 1,
}: AdminFeedbacksViewProps) {
  const {
    feedbacks,
    totalCount,
    page,
    totalPages,
    isLoading,
    error,
    filters,
    setPage,
    setFilters,
    refetch,
  } = useAdminFeedbacks({ page: initialPage });

  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Calculate statistics
  const stats = useMemo(() => {
    if (feedbacks.length === 0) {
      return {
        totalFeedbacks: totalCount,
        averageRating: 0,
        ratingDistribution: [
          { rating: 5, count: 0 },
          { rating: 4, count: 0 },
          { rating: 3, count: 0 },
          { rating: 2, count: 0 },
          { rating: 1, count: 0 },
        ],
      };
    }

    const avgRating =
      feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;

    // Calculate rating distribution from current page
    const distribution = [
      { rating: 5, count: feedbacks.filter((f) => f.rating === 5).length },
      { rating: 4, count: feedbacks.filter((f) => f.rating === 4).length },
      { rating: 3, count: feedbacks.filter((f) => f.rating === 3).length },
      { rating: 2, count: feedbacks.filter((f) => f.rating === 2).length },
      { rating: 1, count: feedbacks.filter((f) => f.rating === 1).length },
    ];

    return {
      totalFeedbacks: totalCount,
      averageRating: Math.round(avgRating * 100) / 100,
      ratingDistribution: distribution,
    };
  }, [feedbacks, totalCount]);

  // Sorted feedbacks
  const sortedFeedbacks = useMemo(() => {
    const sorted = [...feedbacks];

    sorted.sort((a, b) => {
      let aVal: any = a[sortField as keyof typeof a];
      let bVal: any = b[sortField as keyof typeof b];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [feedbacks, sortField, sortDirection]);

  const handleFilterChange = (newFilters: FeedbackFilters) => {
    setFilters(newFilters);
  };

  const handleSort = (field: string, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleRetry = () => {
    refetch();
  };

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
          <h3 className="mb-2 font-semibold text-red-900 dark:text-red-50">
            Błąd podczas ładowania
          </h3>
          <p className="mb-4 text-sm text-red-800 dark:text-red-200">{error}</p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading && feedbacks.length === 0) {
    return (
      <div className="space-y-6">
        {/* Metrics skeleton */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>

        {/* Chart skeleton */}
        <ChartSkeleton />

        {/* Filter skeleton */}
        <FilterSkeleton />

        {/* Table skeleton */}
        <TableSkeleton />
      </div>
    );
  }

  // Empty state - no feedbacks at all
  if (totalCount === 0 && !isLoading) {
    return (
      <div className="space-y-6">
        <EmptyStateAdmin
          title="Brak feedbacków"
          description="Nie ma jeszcze żadnych opinii użytkowników. Opinie pojawią się tutaj, gdy użytkownicy je prześlą."
          icon="📝"
        />
      </div>
    );
  }

  // Main content
  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          title="Liczba Feedbacków"
          value={totalCount.toString()}
          description="Łączna liczba otrzymanych feedbacków"
          badge={<TrendBadge direction="up" percentage={12} variant="success" />}
        />

        <MetricCard
          title="Średnia Ocena"
          value={stats.averageRating.toFixed(2)}
          description="Średnia z wszystkich ocen"
          badge={<TrendBadge direction="up" percentage={5} variant="success" />}
        />

        <MetricCard
          title="Ocena 5 ⭐"
          value={stats.ratingDistribution.find((r) => r.rating === 5)?.count || 0}
          description={`${Math.round((stats.ratingDistribution.find((r) => r.rating === 5)?.count || 0) / Math.max(totalCount, 1) * 100)}% wszystkich`}
          badge={<TrendBadge direction="neutral" variant="neutral" />}
        />
      </div>

      {/* Chart */}
      {isLoading ? (
        <ChartSkeleton />
      ) : (
        <RatingDistributionChart data={stats.ratingDistribution} isLoading={false} />
      )}

      {/* Filters */}
      {isLoading ? (
        <FilterSkeleton />
      ) : (
        <FeedbackFilterControls
          onFilterChange={handleFilterChange}
          isLoading={isLoading}
          defaultValues={filters}
        />
      )}

      {/* Table section */}
      {isLoading ? (
        <TableSkeleton />
      ) : feedbacks.length === 0 ? (
        <EmptyStateAdmin
          title="Brak wyników"
          description="Nie znaleziono feedbacków spełniających wybrane kryteria filtrowania. Spróbuj zmienić filtry."
          icon="🔍"
          action={{
            label: 'Wyczyść filtry',
            onClick: () => setFilters({}),
          }}
        />
      ) : (
        <>
          <FeedbacksTable
            data={sortedFeedbacks}
            onSort={handleSort}
            isLoading={isLoading}
            sortField={sortField}
            sortDirection={sortDirection}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      isDisabled={page === 1}
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(page - 1);
                      }}
                      className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          isActive={page === pageNum}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(pageNum);
                          }}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  {totalPages > 5 && (
                    <>
                      <PaginationItem>
                        <span className="px-3 py-2">...</span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          isActive={page === totalPages}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(totalPages);
                          }}
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      isDisabled={page === totalPages}
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(page + 1);
                      }}
                      className={
                        page === totalPages ? 'pointer-events-none opacity-50' : ''
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          {/* Info text */}
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Wyświetlanie {feedbacks.length > 0 ? (page - 1) * 20 + 1 : 0} -{' '}
            {Math.min(page * 20, totalCount)} z {totalCount} feedbacków
          </div>
        </>
      )}
    </div>
  );
}
