import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  badge?: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
}

export default function MetricCard({ title, value, description, badge }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</CardTitle>
          {badge && <div>{badge}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
        {description && <CardDescription className="mt-2 text-xs">{description}</CardDescription>}
      </CardContent>
    </Card>
  );
}
