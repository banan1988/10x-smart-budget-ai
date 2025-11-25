import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { CategoryBreakdownVM } from '@/types';

interface ExpensesPieChartProps {
  data: CategoryBreakdownVM[];
}

/**
 * Chart colors optimized for both light and dark modes
 * Using vibrant colors that work well in both themes
 */
const CHART_COLORS = [
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ef4444', // Red
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#84cc16', // Lime
  '#f43f5e', // Rose
];

/**
 * Get color for a specific category index
 */
function getCategoryColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

/**
 * Custom tooltip for the donut chart
 */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0];
  const value = data.value as number;
  const percentage = data.payload.percentage as number;
  const formattedValue = new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(value);

  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg">
      <p className="text-sm font-semibold text-foreground">{data.name}</p>
      <p className="text-sm font-medium text-foreground">{formattedValue}</p>
      <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
    </div>
  );
}

/**
 * Custom label for donut chart segments
 */
function renderCustomLabel(entry: any) {
  const percentage = entry.percentage || 0;
  // Only show label if percentage is >= 5%
  if (percentage >= 5) {
    return `${percentage.toFixed(0)}%`;
  }
  return '';
}

/**
 * Donut chart component displaying expense breakdown by category
 * Optimized for both light and dark modes
 */
export function ExpensesPieChart({ data }: ExpensesPieChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rozkład wydatków</CardTitle>
        <CardDescription>Wydatki według kategorii</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={110}
              innerRadius={70}
              fill="hsl(var(--primary))"
              dataKey="total"
              nameKey="name"
              stroke="hsl(var(--background))"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getCategoryColor(index)} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => <span className="text-sm">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

