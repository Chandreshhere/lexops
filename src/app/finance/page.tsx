"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  DollarSign,
  AlertCircle,
  TrendingUp,
  Receipt,
  Plus,
  FileText,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import gsap from "gsap";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { invoices, expenses, clients, cases } from "@/services/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToastStore } from "@/store/toast-store";
import { useAuthStore } from "@/store/auth-store";
import { useNavbarFilterStore } from "@/store/navbar-filter-store";
import type { Invoice, Expense } from "@/types";

// -- Mock chart data --
const revenueVsOutstanding = [
  { month: "Sep", revenue: 1200000, outstanding: 280000 },
  { month: "Oct", revenue: 1450000, outstanding: 320000 },
  { month: "Nov", revenue: 1380000, outstanding: 250000 },
  { month: "Dec", revenue: 1620000, outstanding: 190000 },
  { month: "Jan", revenue: 1780000, outstanding: 410000 },
  { month: "Feb", revenue: 1680000, outstanding: 350000 },
  { month: "Mar", revenue: 1845000, outstanding: 500000 },
];

const monthlyCollections = [
  { month: "Sep", collections: 920000 },
  { month: "Oct", collections: 1130000 },
  { month: "Nov", collections: 1130000 },
  { month: "Dec", collections: 1430000 },
  { month: "Jan", collections: 1370000 },
  { month: "Feb", collections: 1330000 },
  { month: "Mar", collections: 1345000 },
];

// -- Format compact currency for chart axis --
function compactCurrency(value: number): string {
  if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return String(value);
}

// -- Invoice columns --
const invoiceColumns: ColumnDef<Invoice>[] = [
  {
    accessorKey: "invoiceNumber",
    header: "Invoice #",
    cell: ({ getValue }) => (
      <span className="font-mono text-sm text-primary-light">
        {getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: "clientName",
    header: "Client",
    cell: ({ getValue }) => (
      <span className="font-medium">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "caseId",
    header: "Case",
    cell: ({ getValue }) => (
      <span className="text-sm text-text-secondary">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ getValue }) => (
      <span className="font-semibold">{formatCurrency(getValue<number>())}</span>
    ),
  },
  {
    accessorKey: "paidAmount",
    header: "Paid",
    cell: ({ getValue }) => (
      <span className="text-success">{formatCurrency(getValue<number>())}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
  },
  {
    accessorKey: "dueDate",
    header: "Due Date",
    cell: ({ getValue }) => {
      const due = getValue<string>();
      const isOverdue = new Date(due) < new Date();
      return (
        <span className={isOverdue ? "font-medium text-danger" : "text-text-secondary"}>
          {formatDate(due)}
        </span>
      );
    },
  },
];

// -- Expense columns --
const expenseColumns: ColumnDef<Expense>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ getValue }) => (
      <span className="text-text-secondary">{formatDate(getValue<string>())}</span>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ getValue }) => (
      <span className="text-sm text-text-secondary">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ getValue }) => (
      <span className="font-semibold">{formatCurrency(getValue<number>())}</span>
    ),
  },
  {
    accessorKey: "paidBy",
    header: "Paid By",
    cell: ({ getValue }) => (
      <span className="text-text-secondary">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
  },
];

// Build client-to-cases map for dependent select
const clientCaseMap: Record<string, { id: string; label: string }[]> = {};
for (const m of cases) {
  if (!clientCaseMap[m.clientName]) {
    clientCaseMap[m.clientName] = [];
  }
  clientCaseMap[m.clientName].push({
    id: m.id,
    label: `${m.id} - ${m.caseType}`,
  });
}

const clientNames = [...new Set(clients.map((c) => c.name))];

const inputClass =
  "w-full rounded-xl border-[1.5px] border-border bg-card px-4 py-2.5 text-sm text-text-primary shadow-sm placeholder:text-text-muted outline-none transition-all hover:border-primary-light/40 focus:border-primary-light focus:shadow-[0_0_0_3px_rgb(37_99_235/0.12)]";
const labelClass = "text-sm font-medium text-text-primary mb-1.5";

export default function FinancePage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const addToast = useToastStore((s) => s.addToast);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const user = useAuthStore((s) => s.user);
  const canEditFinance = hasPermission("canEditFinance");
  const canViewFinance = hasPermission("canViewFinance");
  const activeFilter = useNavbarFilterStore((s) => s.activeFilter);

  const showOverview = activeFilter === "Overview" || activeFilter === "" || !activeFilter;
  const showInvoices = showOverview || activeFilter === "Invoices";
  const showExpenses = showOverview || activeFilter === "Expenses";

  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [formClient, setFormClient] = useState("");
  const [formCase, setFormCase] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDueDate, setFormDueDate] = useState("");

  const gstAmount = formAmount ? (parseFloat(formAmount) * 0.18).toFixed(2) : "0.00";

  const availableCases = formClient ? clientCaseMap[formClient] || [] : [];

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

  const stats = useMemo(() => {
    const totalRevenue = invoices
      .filter((inv) => inv.status === "Paid")
      .reduce((sum, inv) => sum + inv.paidAmount, 0);

    const outstanding = invoices
      .filter((inv) => inv.status !== "Paid" && inv.status !== "Cancelled")
      .reduce((sum, inv) => sum + (inv.amount - inv.paidAmount), 0);

    const thisMonthCollections = invoices
      .filter((inv) => {
        const issued = new Date(inv.issueDate);
        const now = new Date();
        return (
          inv.paidAmount > 0 &&
          issued.getMonth() === now.getMonth() &&
          issued.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, inv) => sum + inv.paidAmount, 0);

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    return { totalRevenue, outstanding, thisMonthCollections, totalExpenses };
  }, []);

  const resetForm = () => {
    setFormClient("");
    setFormCase("");
    setFormAmount("");
    setFormDescription("");
    setFormDueDate("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({
      type: "success",
      title: "Invoice Created",
      description: `Invoice for ${formClient} has been created successfully.`,
    });
    resetForm();
    setModalOpen(false);
  };

  const handleGenerateReport = () => {
    const headers = ["Invoice No", "Client", "Amount", "Paid", "GST", "Status", "Issue Date", "Due Date", "Description"];
    const rows = invoices.map((inv) => [
      inv.invoiceNumber, inv.clientName, inv.amount, inv.paidAmount, inv.gstAmount,
      inv.status, inv.issueDate, inv.dueDate, `"${inv.description}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lexops-financial-report-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast({
      type: "success",
      title: "Report Downloaded",
      description: "Financial report has been downloaded as CSV.",
    });
  };

  // Guard: only users with canViewFinance can access this page
  if (!canViewFinance) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="rounded-full bg-orange-50 p-4">
          <AlertCircle className="h-10 w-10 text-orange-500" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-text-primary">Access Restricted</h2>
        <p className="mt-1 text-sm text-text-secondary">
          You do not have permission to view the Finance module.
        </p>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="space-y-6">
      <PageHeader
        title="Finance"
        description={!canEditFinance ? "Track revenue, invoices, and expenses (View Only)" : "Track revenue, invoices, and expenses"}
        action={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleGenerateReport}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:bg-border-light hover:text-text-primary"
            >
              <FileText className="h-4 w-4" />
              Generate Report
            </button>
            {canEditFinance && (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-light"
              >
                <Plus className="h-4 w-4" />
                Create Invoice
              </button>
            )}
          </div>
        }
      />

      {/* Stats row */}
      {showOverview && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          trend={8.3}
          trendLabel="vs last month"
          icon={DollarSign}
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(stats.outstanding)}
          trend={-12.5}
          trendLabel="vs last month"
          icon={AlertCircle}
        />
        <StatCard
          title="This Month Collections"
          value={formatCurrency(stats.thisMonthCollections)}
          trend={5.2}
          trendLabel="vs last month"
          icon={TrendingUp}
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(stats.totalExpenses)}
          trend={-3.1}
          trendLabel="vs last month"
          icon={Receipt}
        />
      </div>}

      {/* Charts row */}
      {showOverview && <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue vs Outstanding bar chart */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-text-primary">
            Revenue vs Outstanding
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenueVsOutstanding}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={compactCurrency}
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    borderRadius: "0.75rem",
                    border: "1px solid #E5E7EB",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#4F46E5"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="outstanding"
                  name="Outstanding"
                  fill="#F59E0B"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Collections line chart */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-text-primary">
            Monthly Collections
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyCollections}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={compactCurrency}
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    borderRadius: "0.75rem",
                    border: "1px solid #E5E7EB",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="collections"
                  name="Collections"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#10B981", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>}

      {/* Invoices table */}
      {showInvoices && <div className="space-y-3">
        <h3 className="text-lg font-semibold text-text-primary">Invoices</h3>
        <DataTable
          columns={invoiceColumns}
          data={invoices}
          searchKey="clientName"
          searchPlaceholder="Search invoices by client..."
        />
      </div>}

      {/* Expenses table */}
      {showExpenses && <div className="space-y-3">
        <h3 className="text-lg font-semibold text-text-primary">
          Recent Expenses
        </h3>
        <DataTable
          columns={expenseColumns}
          data={expenses}
          searchKey="description"
          searchPlaceholder="Search expenses..."
        />
      </div>}

      {/* Create Invoice Modal */}
      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Create Invoice"
        description="Generate a new invoice for a client case."
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className={labelClass}>Client</label>
              <select
                required
                value={formClient}
                onChange={(e) => {
                  setFormClient(e.target.value);
                  setFormCase("");
                }}
                className="styled-select w-full"
              >
                <option value="" disabled>
                  Select client
                </option>
                {clientNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className={labelClass}>Case</label>
              <select
                required
                value={formCase}
                onChange={(e) => setFormCase(e.target.value)}
                disabled={!formClient}
                className="styled-select w-full"
              >
                <option value="" disabled>
                  {formClient ? "Select case" : "Select a client first"}
                </option>
                {availableCases.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className={labelClass}>Amount</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="Enter amount"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col">
              <label className={labelClass}>GST (18%)</label>
              <input
                type="text"
                readOnly
                value={`${formatCurrency(parseFloat(gstAmount) || 0)}`}
                className={`${inputClass} bg-border-light cursor-not-allowed text-text-secondary`}
              />
            </div>

            <div className="flex flex-col">
              <label className={labelClass}>Due Date</label>
              <input
                type="date"
                required
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col">
              <label className={labelClass}>Total (incl. GST)</label>
              <input
                type="text"
                readOnly
                value={`${formatCurrency((parseFloat(formAmount) || 0) + (parseFloat(gstAmount) || 0))}`}
                className={`${inputClass} bg-border-light cursor-not-allowed font-semibold text-text-primary`}
              />
            </div>

            <div className="md:col-span-2 flex flex-col">
              <label className={labelClass}>Description</label>
              <textarea
                required
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Invoice description..."
                className={`${inputClass} min-h-[80px] resize-none`}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setModalOpen(false);
              }}
              className="rounded-xl border px-5 py-2.5 text-sm font-medium hover:bg-border-light transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary text-white px-5 py-2.5 text-sm font-medium hover:bg-primary-light shadow-sm transition-colors"
            >
              Create Invoice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
