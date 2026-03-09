import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  trend: number;
  trendLabel: string;
  icon: LucideIcon;
  className?: string;
}

export function StatCard({
  title,
  value,
  trend,
  trendLabel,
  icon: Icon,
  className,
}: StatCardProps) {
  const isPositive = trend >= 0;

  return (
    <div
      className={cn(
        "rounded-xl bg-card p-6 shadow-sm border border-border",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="rounded-lg bg-primary-50 p-2.5">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        <p className="mt-1 text-sm text-text-secondary">{title}</p>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-success" />
        ) : (
          <TrendingDown className="h-4 w-4 text-danger" />
        )}
        <span
          className={cn(
            "text-sm font-medium",
            isPositive ? "text-success" : "text-danger"
          )}
        >
          {isPositive ? "+" : ""}
          {trend}%
        </span>
        <span className="text-sm text-text-muted">{trendLabel}</span>
      </div>
    </div>
  );
}
