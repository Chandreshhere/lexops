import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "primary" | "warning" | "danger" | "default";

interface StatusBadgeProps {
  status: string;
  variant?: BadgeVariant;
  className?: string;
}

const STATUS_MAP: Record<string, BadgeVariant> = {
  active: "success",
  paid: "success",
  completed: "success",
  done: "success",
  approved: "success",

  pending: "primary",
  "in progress": "primary",
  "to do": "primary",

  "awaiting response": "warning",
  "partially paid": "warning",
  "on hold": "warning",

  overdue: "danger",
  urgent: "danger",
  rejected: "danger",
  cancelled: "danger",
  withdrawn: "danger",
};

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-success-bg text-success",
  primary: "bg-primary-50 text-primary",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  default: "bg-[#F1F5F9] text-text-secondary",
};

function resolveVariant(status: string): BadgeVariant {
  return STATUS_MAP[status.toLowerCase()] ?? "default";
}

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const resolved = variant ?? resolveVariant(status);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[resolved],
        className
      )}
    >
      {status}
    </span>
  );
}
