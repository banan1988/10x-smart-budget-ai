import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendBadgeProps {
  direction: "up" | "down" | "neutral";
  percentage?: number;
  variant?: "success" | "danger" | "neutral";
}

export default function TrendBadge({ direction, percentage = 0, variant = "neutral" }: TrendBadgeProps) {
  let icon;
  let bgColor;
  let textColor;

  switch (direction) {
    case "up":
      icon = <TrendingUp size={16} />;
      bgColor = "bg-green-50 dark:bg-green-900/20";
      textColor = "text-green-700 dark:text-green-300";
      break;
    case "down":
      icon = <TrendingDown size={16} />;
      bgColor = "bg-red-50 dark:bg-red-900/20";
      textColor = "text-red-700 dark:text-red-300";
      break;
    case "neutral":
      icon = <Minus size={16} />;
      bgColor = "bg-gray-50 dark:bg-gray-800";
      textColor = "text-gray-700 dark:text-gray-300";
      break;
  }

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${bgColor} ${textColor}`}
    >
      {icon}
      {percentage !== 0 && (
        <span>
          {direction === "up" && "+"}
          {percentage}%
        </span>
      )}
      {percentage === 0 && direction === "neutral" && <span>→ 0%</span>}
    </div>
  );
}
