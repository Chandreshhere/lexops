"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastStore, type ToastType } from "@/store/toast-store";

const icons: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors: Record<ToastType, string> = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

const iconColors: Record<ToastType, string> = {
  success: "text-green-500",
  error: "text-red-500",
  warning: "text-amber-500",
  info: "text-blue-500",
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <ToastItem key={toast.id}>
            <div
              className={cn(
                "flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-sm",
                "animate-slide-in-right min-w-[320px] max-w-[420px]",
                colors[toast.type]
              )}
            >
              <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", iconColors[toast.type])} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description && (
                  <p className="mt-0.5 text-xs opacity-80">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 rounded-lg p-1 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </ToastItem>
        );
      })}
    </div>
  );
}

function ToastItem({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateX(100%)";
    requestAnimationFrame(() => {
      el.style.transition = "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
      el.style.opacity = "1";
      el.style.transform = "translateX(0)";
    });
  }, []);

  return <div ref={ref}>{children}</div>;
}
