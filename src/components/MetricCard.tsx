import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MetricCardVM } from '@/types';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  metric: MetricCardVM;
}

/**
 * Get color class based on metric variant
 */
function getVariantClass(variant?: MetricCardVM['variant']): string {
  switch (variant) {
    case 'income':
      return 'text-green-600 dark:text-green-500';
    case 'expense':
      return 'text-red-600 dark:text-red-500';
    case 'balance-positive':
      return 'text-green-600 dark:text-green-500';
    case 'balance-negative':
      return 'text-red-600 dark:text-red-500';
    default:
      return '';
  }
}

/**
 * Card component for displaying a single financial metric
 */
export function MetricCard({ metric }: MetricCardProps) {
  const colorClass = getVariantClass(metric.variant);

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {metric.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn('text-2xl font-bold', colorClass)}>
          {metric.value}
        </p>
      </CardContent>
    </Card>
  );
}

