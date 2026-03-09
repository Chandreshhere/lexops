"use client";

import { useRef, useEffect } from "react";
import {
  Briefcase,
  IndianRupee,
  BarChart3,
  UserCog,
  Clock,
  Target,
  Calendar,
  Receipt,
  Download,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import gsap from "gsap";

import { PageHeader } from "@/components/ui/page-header";
import { useToastStore } from "@/store/toast-store";
import { useAuthStore } from "@/store/auth-store";

/* ---------- report definitions ---------- */

interface ReportDef {
  icon: LucideIcon;
  name: string;
  description: string;
  frequency: string;
  iconBg: string;
  iconColor: string;
}

const reports: ReportDef[] = [
  {
    icon: Briefcase,
    name: "Case Status Report",
    description: "Status of all active cases",
    frequency: "Weekly",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: IndianRupee,
    name: "Financial Summary",
    description: "Revenue, expenses, and P&L",
    frequency: "Monthly",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    icon: BarChart3,
    name: "Domain Performance",
    description: "Performance by practice area",
    frequency: "Monthly",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
  {
    icon: UserCog,
    name: "Employee Productivity",
    description: "Workload and task completion",
    frequency: "Monthly",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    icon: Clock,
    name: "Aging Receivables",
    description: "Outstanding payments by age",
    frequency: "Weekly",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
  },
  {
    icon: Target,
    name: "Lead Conversion",
    description: "Enquiry to client conversion rates",
    frequency: "Monthly",
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
  },
  {
    icon: Calendar,
    name: "Hearing Calendar",
    description: "Upcoming hearings schedule",
    frequency: "Daily",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
  },
  {
    icon: Receipt,
    name: "Expense Report",
    description: "Office and client expenses breakdown",
    frequency: "Monthly",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
];

/* ---------- frequency badge colours ---------- */

const freqColors: Record<string, string> = {
  Daily: "bg-success-bg text-success",
  Weekly: "bg-primary-50 text-primary",
  Monthly: "bg-warning-bg text-warning",
};

/* ---------- page ---------- */

export default function ReportsPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const addToast = useToastStore((s) => s.addToast);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const user = useAuthStore((s) => s.user);
  const canExportReports = hasPermission("canExportReports");

  // Filter reports based on role
  const financialReportNames = ["Financial Summary", "Aging Receivables", "Expense Report"];
  const visibleReports = user?.role === "accountant"
    ? reports.filter((r) => financialReportNames.includes(r.name))
    : reports;

  // GSAP page entry animation
  useEffect(() => {
    if (pageRef.current) {
      gsap.fromTo(
        pageRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
      );
    }
  }, []);

  // GSAP stagger on report cards
  useEffect(() => {
    const cards = cardsRef.current?.querySelectorAll("[data-report-card]");
    if (cards && cards.length > 0) {
      gsap.fromTo(
        cards,
        { y: 15, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.06,
          ease: "power2.out",
          delay: 0.2,
        }
      );
    }
  }, []);

  const handleExportAll = () => {
    if (!canExportReports) {
      addToast({
        type: "warning",
        title: "Permission Denied",
        description: "You do not have permission to export reports.",
      });
      return;
    }
    addToast({
      type: "info",
      title: "Generating export...",
      description: "Preparing all reports for download.",
    });
    setTimeout(() => {
      addToast({
        type: "success",
        title: "Export ready!",
        description: "Download will begin shortly.",
      });
    }, 1000);
  };

  const handleGenerateReport = (reportName: string) => {
    addToast({
      type: "info",
      title: `Generating ${reportName}...`,
      description: "Your report is being prepared.",
    });
  };

  return (
    <div ref={pageRef} className="space-y-6">
      <PageHeader
        title="Reports"
        action={
          <button
            type="button"
            onClick={handleExportAll}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm transition-colors ${
              canExportReports
                ? "bg-primary text-white hover:bg-primary-light"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Download className="h-4 w-4" />
            Export All
          </button>
        }
      />

      <div ref={cardsRef} className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {visibleReports.map((report) => {
          const Icon = report.icon;
          return (
            <div
              key={report.name}
              data-report-card
              className="group rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg"
            >
              {/* Icon + frequency */}
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${report.iconBg}`}
                >
                  <Icon className={`h-5 w-5 ${report.iconColor}`} />
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${freqColors[report.frequency] ?? "bg-slate-100 text-slate-600"}`}
                >
                  {report.frequency}
                </span>
              </div>

              {/* Text */}
              <h3 className="mt-4 text-sm font-semibold text-text-primary">
                {report.name}
              </h3>
              <p className="mt-1 text-xs text-text-secondary">
                {report.description}
              </p>

              {/* Generate button */}
              <button
                type="button"
                onClick={() => handleGenerateReport(report.name)}
                className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary group-hover:border-primary group-hover:text-primary"
              >
                {canExportReports ? "Generate" : "View"}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
