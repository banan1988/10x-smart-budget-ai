import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface AiCategorizationChartProps {
  aiCount: number;
  manualCount: number;
  height?: number;
  isLoading?: boolean;
}

const COLORS = ['#3b82f6', '#10b981'];

export default function AiCategorizationChart({
  aiCount,
  manualCount,
  height = 300,
  isLoading = false,
}: AiCategorizationChartProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-sm text-gray-500">Ładowanie...</div>
      </div>
    );
  }

  const data = [
    {
      name: 'Kategoryzowane przez AI',
      value: aiCount,
    },
    {
      name: 'Kategoryzowane ręcznie',
      value: manualCount,
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [value.toString(), 'Liczba']}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

