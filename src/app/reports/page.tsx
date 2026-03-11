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
import { useNavbarFilterStore } from "@/store/navbar-filter-store";
import { cases, invoices, employees, upcomingHearings, expenses, clients } from "@/services/mock-data";
import { formatCurrency } from "@/lib/utils";

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
  const activeFilter = useNavbarFilterStore((s) => s.activeFilter);

  // Filter reports based on role
  const financialReportNames = ["Financial Summary", "Aging Receivables", "Expense Report"];
  const roleFilteredReports = user?.role === "accountant"
    ? reports.filter((r) => financialReportNames.includes(r.name))
    : reports;

  // Navbar pill filter
  const visibleReports = activeFilter === "Summary"
    ? roleFilteredReports.filter((r) => r.frequency === "Daily" || r.frequency === "Weekly")
    : activeFilter === "Detailed"
    ? roleFilteredReports.filter((r) => r.frequency === "Monthly")
    : roleFilteredReports;


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

  const downloadCSV = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateReportCSV = (reportName: string): string => {
    const date = new Date().toISOString().split("T")[0];
    switch (reportName) {
      case "Case Status Report": {
        const headers = ["Case ID", "Client", "Domain", "Type", "Status", "Stage", "Priority", "Assigned To", "Fee Agreed", "Outstanding"];
        const rows = cases.map((c) => [c.id, `"${c.clientName}"`, c.domain, `"${c.caseType}"`, c.status, `"${c.currentStage}"`, c.priority, `"${c.assignedTo}"`, c.feeAgreed, c.amountOutstanding]);
        return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      }
      case "Financial Summary": {
        const totalRev = invoices.reduce((s, i) => s + i.paidAmount, 0);
        const totalOut = invoices.reduce((s, i) => s + (i.amount - i.paidAmount), 0);
        const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
        const summary = `Financial Summary Report - ${date}\n\nTotal Revenue,${totalRev}\nTotal Outstanding,${totalOut}\nTotal Expenses,${totalExp}\nNet Profit,${totalRev - totalExp}\n\nInvoice Details\n`;
        const headers = ["Invoice No", "Client", "Amount", "Paid", "Status", "Due Date"];
        const rows = invoices.map((i) => [i.invoiceNumber, `"${i.clientName}"`, i.amount, i.paidAmount, i.status, i.dueDate]);
        return summary + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      }
      case "Domain Performance": {
        const domains = ["Litigation", "RERA", "TNCP", "IMC", "IDA", "Revenue", "Financial Services"];
        const headers = ["Domain", "Total Cases", "Active", "Closed", "Total Fee", "Collected"];
        const rows = domains.map((d) => {
          const dc = cases.filter((c) => c.domain === d);
          return [d, dc.length, dc.filter((c) => c.status === "Active").length, dc.filter((c) => c.status === "Closed").length, dc.reduce((s, c) => s + c.feeAgreed, 0), dc.reduce((s, c) => s + c.amountReceived, 0)];
        });
        return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      }
      case "Employee Productivity": {
        const headers = ["Name", "Designation", "Department", "Active Cases", "Pending Tasks"];
        const rows = employees.map((e) => [`"${e.name}"`, `"${e.designation}"`, e.department, e.activeCases, e.pendingTasks]);
        return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      }
      case "Aging Receivables": {
        const headers = ["Invoice No", "Client", "Amount Due", "Days Overdue", "Status"];
        const now = new Date();
        const rows = invoices.filter((i) => i.status === "Overdue" || i.status === "Pending" || i.status === "Partially Paid").map((i) => {
          const due = new Date(i.dueDate);
          const daysOver = Math.max(0, Math.ceil((now.getTime() - due.getTime()) / 86400000));
          return [i.invoiceNumber, `"${i.clientName}"`, i.amount - i.paidAmount, daysOver, i.status];
        });
        return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      }
      case "Lead Conversion": {
        const headers = ["Client", "Type", "Source", "Referred By", "Since", "Total Cases", "Total Paid"];
        const rows = clients.map((c) => [`"${c.name}"`, c.clientType, c.source, c.referredBy ?? "N/A", c.clientSince, c.totalCases, c.totalPaid]);
        return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      }
      case "Hearing Calendar": {
        const headers = ["Date", "Case", "Client", "Court", "Purpose", "Advocate"];
        const rows = upcomingHearings.map((h) => [h.date, `"${h.caseTitle}"`, `"${h.clientName}"`, `"${h.court}"`, `"${h.purpose}"`, `"${h.advocate}"`]);
        return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      }
      case "Expense Report": {
        const headers = ["Date", "Category", "Description", "Amount", "Paid By", "Type", "Case ID"];
        const rows = expenses.map((e) => [e.date, e.category, `"${e.description}"`, e.amount, `"${e.paidBy}"`, e.type, e.caseId ?? "N/A"]);
        return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      }
      default:
        return "No data available";
    }
  };

  const handleExportAll = () => {
    if (!canExportReports) {
      addToast({
        type: "warning",
        title: "Permission Denied",
        description: "You do not have permission to export reports.",
      });
      return;
    }
    const date = new Date().toISOString().split("T")[0];
    visibleReports.forEach((report) => {
      const csv = generateReportCSV(report.name);
      const safeName = report.name.toLowerCase().replace(/\s+/g, "-");
      downloadCSV(`lexops-${safeName}-${date}.csv`, csv);
    });
    addToast({
      type: "success",
      title: "All reports exported",
      description: `${visibleReports.length} reports downloaded as CSV files.`,
    });
  };

  const handleGenerateReport = (reportName: string) => {
    const date = new Date().toISOString().split("T")[0];
    const csv = generateReportCSV(reportName);
    const safeName = reportName.toLowerCase().replace(/\s+/g, "-");
    downloadCSV(`lexops-${safeName}-${date}.csv`, csv);
    addToast({
      type: "success",
      title: `${reportName} downloaded`,
      description: "Report has been saved as a CSV file.",
    });
  };

  // Auto-trigger export when Export pill is clicked
  useEffect(() => {
    if (activeFilter === "Export" && canExportReports) {
      handleExportAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

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
