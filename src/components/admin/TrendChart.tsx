import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface TrendChartProps {
  data: {
    date: string;
    percentage: number;
  }[];
  height?: number;
  isLoading?: boolean;
}

export default function TrendChart({
  data,
  height = 300,
  isLoading = false,
}: TrendChartProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-sm text-gray-500">Ładowanie...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-sm text-gray-500">Brak danych do wyświetlenia</div>
      </div>
    );
  }

  // Transform dates to more readable format (DD-MM)
  const chartData = data.map(point => ({
    ...point,
    displayDate: new Date(point.date).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="displayDate"
          stroke="#6b7280"
          style={{ fontSize: '0.875rem' }}
        />
        <YAxis
          stroke="#6b7280"
          style={{ fontSize: '0.875rem' }}
          domain={[0, 100]}
          label={{ value: '%', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '0.375rem',
          }}
          formatter={(value: number) => [`${value.toFixed(2)}%`, 'Procent AI']}
          labelFormatter={(label) => `Data: ${label}`}
        />
        <Area
          type="monotone"
          dataKey="percentage"
          stroke="#3b82f6"
          fillOpacity={1}
          fill="url(#colorPercentage)"
          dot={{ fill: '#3b82f6', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

