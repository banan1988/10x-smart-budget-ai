import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface RatingDistribution {
  rating: number;
  count: number;
}

interface RatingDistributionChartProps {
  data: RatingDistribution[];
  height?: number;
  isLoading?: boolean;
}

export default function RatingDistributionChart({
  data,
  height = 300,
  isLoading = false,
}: RatingDistributionChartProps) {
  // Transform data for Recharts
  const chartData = data.map((item) => ({
    name: `${item.rating} ⭐`,
    count: item.count,
    rating: item.rating,
  }));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rozkład Ocen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center" style={{ height }}>
            <p className="text-gray-500 dark:text-gray-400">Ładowanie...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rozkład Ocen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center" style={{ height }}>
            <p className="text-gray-500 dark:text-gray-400">Brak danych</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rozkład Ocen</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              formatter={(value) => [value, "Liczba feedbacków"]}
              labelFormatter={(label) => `Rating: ${label}`}
            />
            <Legend />
            <Bar dataKey="count" fill="#3b82f6" name="Liczba feedbacków" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
