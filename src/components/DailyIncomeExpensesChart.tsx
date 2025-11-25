import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DailyBreakdownVM } from '@/types';

interface DailyIncomeExpensesChartProps {
  data: DailyBreakdownVM[];
}

/**
 * Custom tooltip for the bar chart
 */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const incomeData = payload.find((p: any) => p.dataKey === 'income');
  const expensesData = payload.find((p: any) => p.dataKey === 'expenses');

  const formatCurrency = (value: number) => new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(value);

  return (
    <div className="rounded-lg border bg-card text-card-foreground p-3 shadow-lg">
      <p className="text-sm font-semibold mb-2">Dzień {payload[0].payload.day}</p>
      {incomeData && incomeData.value > 0 && (
        <p className="text-sm font-medium text-green-600 dark:text-green-400">
          Przychody: {formatCurrency(incomeData.value)}
        </p>
      )}
      {expensesData && expensesData.value > 0 && (
        <p className="text-sm font-medium text-red-600 dark:text-red-400">
          Wydatki: {formatCurrency(expensesData.value)}
        </p>
      )}
    </div>
  );
}

/**
 * Bar chart component displaying daily income and expenses breakdown
 * Optimized for both light and dark modes
 */
export function DailyIncomeExpensesChart({ data }: DailyIncomeExpensesChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  // Filter out days with no transactions to make the chart cleaner
  const filteredData = data.filter(day => day.income > 0 || day.expenses > 0);

  if (filteredData.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Przychody i wydatki</CardTitle>
        <CardDescription>Dzienny rozkład transakcji</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <XAxis
              dataKey="day"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#888888' }}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#888888' }}
              tickFormatter={(value) => `${value} zł`}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}
              contentStyle={{ backgroundColor: 'transparent', border: 'none' }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => value === 'income' ? 'Przychody' : 'Wydatki'}
            />
            <Bar
              dataKey="income"
              fill="#10b981"
              radius={[8, 8, 0, 0]}
              maxBarSize={40}
              name="income"
            />
            <Bar
              dataKey="expenses"
              fill="#ef4444"
              radius={[8, 8, 0, 0]}
              maxBarSize={40}
              name="expenses"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

