import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-sm font-medium mb-2">Dzień {payload[0].payload.day}</p>
      {incomeData && incomeData.value > 0 && (
        <p className="text-sm text-green-600">
          Przychody: {formatCurrency(incomeData.value)}
        </p>
      )}
      {expensesData && expensesData.value > 0 && (
        <p className="text-sm text-red-600">
          Wydatki: {formatCurrency(expensesData.value)}
        </p>
      )}
    </div>
  );
}

/**
 * Bar chart component displaying daily income and expenses breakdown
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
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Przychody i wydatki dzień po dniu</CardTitle>
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
              label={{ value: 'Dzień miesiąca', position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value} zł`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => value === 'income' ? 'Przychody' : 'Wydatki'}
            />
            <Bar
              dataKey="income"
              fill="hsl(142.1 76.2% 36.3%)"
              radius={[8, 8, 0, 0]}
              maxBarSize={40}
              name="income"
            />
            <Bar
              dataKey="expenses"
              fill="hsl(0 84.2% 60.2%)"
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

