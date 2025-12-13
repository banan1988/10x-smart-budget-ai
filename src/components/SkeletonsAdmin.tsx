import React from "react";
import { Card, CardContent, CardHeader } from "./ui/card";

export function MetricCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </CardHeader>
      <CardContent>
        <div className="mb-2 h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </CardContent>
    </Card>
  );
}

export function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </CardHeader>
      <CardContent>
        <div className="flex h-80 items-end justify-between gap-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex-1 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
              style={{ height: `${Math.random() * 60 + 20}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-2 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-4 w-24 flex-shrink-0 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-16 flex-shrink-0 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1">
            <div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FilterSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
      <div className="mb-4 h-5 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-4 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-9 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    </div>
  );
}
