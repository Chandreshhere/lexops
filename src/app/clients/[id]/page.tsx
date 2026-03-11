"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ArrowLeft,
  Phone,
  Mail,
  User,
  FileText,
  MessageSquare,
  PhoneCall,
  Video,
  Users,
  IndianRupee,
  Briefcase,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  clients,
  cases,
  invoices,
  communicationLogs,
  whatsappMessages,
} from "@/services/mock-data";
import {
  formatCurrency,
  formatDate,
  getInitials,
} from "@/lib/utils";
import { useToastStore } from "@/store/toast-store";
import type { Case, Invoice, CommunicationLog, WhatsAppMessage } from "@/types";

const TAG_COLORS: Record<string, string> = {
  VIP: "bg-amber-100 text-amber-700",
  Litigation: "bg-red-100 text-red-700",
  "RERA Client": "bg-blue-100 text-blue-700",
  Builder: "bg-emerald-100 text-emerald-700",
  TNCP: "bg-violet-100 text-violet-700",
  Recurring: "bg-teal-100 text-teal-700",
  IMC: "bg-orange-100 text-orange-700",
  IDA: "bg-cyan-100 text-cyan-700",
  Revenue: "bg-lime-100 text-lime-700",
  "Financial Services": "bg-pink-100 text-pink-700",
  Corporate: "bg-indigo-100 text-indigo-700",
};

function getTagColor(tag: string): string {
  return TAG_COLORS[tag] ?? "bg-gray-100 text-gray-600";
}

const COMM_ICONS: Record<string, typeof Phone> = {
  Call: PhoneCall,
  WhatsApp: MessageSquare,
  Email: Mail,
  "In-Person": Users,
  "Video Call": Video,
};

// -- Case columns --
const caseColumns: ColumnDef<Case>[] = [
  {
    accessorKey: "id",
    header: "Case ID",
    cell: ({ getValue }) => (
      <span className="font-mono text-sm text-primary-light">
        {getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: "domain",
    header: "Domain",
    cell: ({ getValue }) => (
      <StatusBadge status={getValue<string>()} />
    ),
  },
  {
    accessorKey: "caseType",
    header: "Type",
  },
  {
    accessorKey: "currentStage",
    header: "Current Stage",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
  },
  {
    accessorKey: "assignedTo",
    header: "Assigned To",
    cell: ({ getValue }) => (
      <span className="text-text-secondary">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "amountOutstanding",
    header: "Outstanding",
    cell: ({ getValue }) => {
      const amount = getValue<number>();
      return (
        <span className={amount > 0 ? "font-medium text-danger" : "text-text-secondary"}>
          {formatCurrency(amount)}
        </span>
      );
    },
  },
];

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
    accessorKey: "description",
    header: "Description",
    cell: ({ getValue }) => (
      <span className="max-w-xs truncate text-sm text-text-secondary">
        {getValue<string>()}
      </span>
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
        <span className={isOverdue ? "text-danger" : "text-text-secondary"}>
          {formatDate(due)}
        </span>
      );
    },
  },
];

// -- Communication columns --
const commColumns: ColumnDef<CommunicationLog>[] = [
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ getValue }) => {
      const type = getValue<string>();
      const Icon = COMM_ICONS[type] ?? MessageSquare;
      return (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-medium">{type}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ getValue }) => (
      <span className="text-text-secondary">{formatDate(getValue<string>())}</span>
    ),
  },
  {
    accessorKey: "summary",
    header: "Summary",
    cell: ({ getValue }) => (
      <span className="text-sm text-text-secondary">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "followUpRequired",
    header: "Follow-up",
    cell: ({ row }) => {
      const log = row.original;
      if (!log.followUpRequired) {
        return <span className="text-text-muted">--</span>;
      }
      return (
        <span className="text-sm font-medium text-warning">
          {log.followUpDate ? formatDate(log.followUpDate) : "Required"}
        </span>
      );
    },
  },
];

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const client = clients.find((c) => c.id === id);

  if (!client) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => router.push("/clients")}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </button>
        <EmptyState
          icon={User}
          title="Client not found"
          description="The client you are looking for does not exist or has been removed."
          action={
            <button
              type="button"
              onClick={() => router.push("/clients")}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
            >
              View All Clients
            </button>
          }
        />
      </div>
    );
  }

  const clientCases = cases.filter((m) => m.clientId === client.id);
  const clientInvoices = invoices.filter((inv) => inv.clientId === client.id);
  const clientComms = communicationLogs.filter((c) => c.clientId === client.id);
  const clientChats = whatsappMessages
    .filter((m) => m.clientId === client.id)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Summary calculations
  const activeCasesList = clientCases.filter((c) => c.status === "Active");
  const onHoldCases = clientCases.filter((c) => c.status === "On Hold");
  const closedCases = clientCases.filter((c) => c.status === "Closed");
  const totalInvoiced = clientInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaidInvoices = clientInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const pendingInvoices = clientInvoices.filter((inv) => inv.status === "Pending" || inv.status === "Overdue" || inv.status === "Partially Paid");
  const overdueInvoices = clientInvoices.filter((inv) => inv.status === "Overdue");
  const pendingFollowUps = clientComms.filter((c) => c.followUpRequired);
  const lastComm = clientComms.length > 0 ? clientComms.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] : null;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.push("/clients")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Clients
      </button>

      {/* Header card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xl font-bold text-primary">
            {getInitials(client.name)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-text-primary">
              {client.name}
            </h1>
            <p className="mt-0.5 text-sm text-text-secondary">
              {client.clientType}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {client.tags.map((tag) => (
                <span
                  key={tag}
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTagColor(tag)}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-3 sm:shrink-0">
            <div className="rounded-xl border border-border bg-background px-5 py-3 text-center">
              <p className="text-xl font-bold text-text-primary">
                {client.activeCases}
              </p>
              <p className="text-xs text-text-muted">Active</p>
            </div>
            <div className="rounded-xl border border-border bg-background px-5 py-3 text-center">
              <p className="text-xl font-bold text-text-primary">
                {client.totalCases}
              </p>
              <p className="text-xs text-text-muted">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <TabsRoot defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="cases">Cases</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        {/* Summary tab */}
        <TabsContent value="summary">
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text-primary">{activeCasesList.length}</p>
                    <p className="text-xs text-text-muted">Active Cases</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text-primary">{onHoldCases.length}</p>
                    <p className="text-xs text-text-muted">On Hold</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-danger">{formatCurrency(client.outstandingAmount)}</p>
                    <p className="text-xs text-text-muted">Outstanding</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-success">{formatCurrency(client.totalPaid)}</p>
                    <p className="text-xs text-text-muted">Total Paid</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Case Summary */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
                  <Briefcase className="h-4 w-4" />
                  Case Summary
                </h3>
                {clientCases.length > 0 ? (
                  <div className="space-y-3">
                    {clientCases.map((c) => (
                      <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-primary-light">{c.id}</span>
                            <StatusBadge status={c.status} />
                          </div>
                          <p className="mt-1 text-sm text-text-secondary">{c.caseType} — {c.domain}</p>
                          <p className="text-xs text-text-muted">Stage: {c.currentStage}</p>
                        </div>
                        {c.amountOutstanding > 0 && (
                          <span className="shrink-0 text-sm font-medium text-danger">
                            {formatCurrency(c.amountOutstanding)}
                          </span>
                        )}
                      </div>
                    ))}
                    <div className="mt-2 flex items-center justify-between border-t border-border pt-3 text-sm">
                      <span className="text-text-muted">
                        {activeCasesList.length} active · {closedCases.length} closed · {onHoldCases.length} on hold
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-text-muted">No cases found for this client.</p>
                )}
              </div>

              {/* Payment Summary */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
                  <IndianRupee className="h-4 w-4" />
                  Payment Summary
                </h3>
                {clientInvoices.length > 0 ? (
                  <div className="space-y-3">
                    {clientInvoices.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-primary-light">{inv.invoiceNumber}</span>
                            <StatusBadge status={inv.status} />
                          </div>
                          <p className="mt-1 truncate text-sm text-text-secondary">{inv.description}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold">{formatCurrency(inv.amount)}</p>
                          {inv.paidAmount > 0 && inv.paidAmount < inv.amount && (
                            <p className="text-xs text-success">Paid: {formatCurrency(inv.paidAmount)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="mt-2 space-y-1 border-t border-border pt-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Total Invoiced</span>
                        <span className="font-medium">{formatCurrency(totalInvoiced)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Total Received</span>
                        <span className="font-medium text-success">{formatCurrency(totalPaidInvoices)}</span>
                      </div>
                      {overdueInvoices.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-text-muted">Overdue Invoices</span>
                          <span className="font-medium text-danger">{overdueInvoices.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-text-muted">No invoices found for this client.</p>
                )}
              </div>
            </div>

            {/* Communication & Last Activity */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Recent Communication */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
                  <Phone className="h-4 w-4" />
                  Recent Communication
                </h3>
                {clientComms.length > 0 ? (
                  <div className="space-y-3">
                    {clientComms
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 5)
                      .map((comm) => {
                        const Icon = COMM_ICONS[comm.type] ?? MessageSquare;
                        return (
                          <div key={comm.id} className="flex gap-3 rounded-lg border border-border bg-background p-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{comm.type}</span>
                                <span className="text-xs text-text-muted">{formatDate(comm.date)}</span>
                              </div>
                              <p className="mt-0.5 text-sm text-text-secondary">{comm.summary}</p>
                              {comm.followUpRequired && (
                                <p className="mt-1 text-xs font-medium text-warning">
                                  Follow-up: {comm.followUpDate ? formatDate(comm.followUpDate) : "Required"}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    {pendingFollowUps.length > 0 && (
                      <div className="mt-2 flex items-center gap-2 border-t border-border pt-3">
                        <AlertCircle className="h-4 w-4 text-warning" />
                        <span className="text-sm text-warning">{pendingFollowUps.length} pending follow-up(s)</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted">No communication logs found.</p>
                )}
              </div>

              {/* WhatsApp Chat History */}
              <div className="rounded-xl border border-border bg-card shadow-sm">
                <div className="border-b border-border bg-emerald-600 px-6 py-3 rounded-t-xl">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp Chat
                  </h3>
                </div>
                <div className="max-h-[400px] overflow-y-auto p-4">
                  {clientChats.length > 0 ? (
                    <div className="space-y-3">
                      {clientChats.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.direction === "outgoing" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-xl px-3 py-2 ${
                              msg.direction === "outgoing"
                                ? "rounded-tr-sm bg-emerald-100 text-emerald-900"
                                : "rounded-tl-sm bg-gray-100 text-text-primary"
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <div className={`mt-1 flex items-center gap-1 ${msg.direction === "outgoing" ? "justify-end" : ""}`}>
                              <span className="text-[10px] text-text-muted">
                                {new Date(msg.timestamp).toLocaleString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {msg.direction === "outgoing" && msg.status && (
                                <CheckCircle className={`h-3 w-3 ${msg.status === "read" ? "text-blue-500" : "text-text-muted"}`} />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <MessageSquare className="h-8 w-8 text-text-muted" />
                      <p className="mt-2 text-sm text-text-muted">No WhatsApp messages recorded.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Profile tab */}
        <TabsContent value="profile">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Personal Details */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-muted">
                Personal Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-sm text-text-secondary">Full Name</span>
                  <span className="text-sm font-medium text-text-primary">
                    {client.name}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-sm text-text-secondary">Type</span>
                  <span className="text-sm font-medium text-text-primary">
                    {client.clientType}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-sm text-text-secondary">Phone</span>
                  <span className="text-sm font-medium text-text-primary">
                    {client.phone}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-sm text-text-secondary">Email</span>
                  <span className="text-sm font-medium text-text-primary">
                    {client.email || "--"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Address</span>
                  <span className="text-sm font-medium text-text-primary">
                    {client.address || "--"}
                  </span>
                </div>
              </div>
            </div>

            {/* Firm Details */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-muted">
                Firm Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-sm text-text-secondary">Client Since</span>
                  <span className="text-sm font-medium text-text-primary">
                    {formatDate(client.clientSince)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-sm text-text-secondary">
                    Relationship Manager
                  </span>
                  <span className="text-sm font-medium text-text-primary">
                    {client.relationshipManager}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-sm text-text-secondary">Source</span>
                  <span className="text-sm font-medium text-text-primary">
                    {client.source}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-sm text-text-secondary">Referred By</span>
                  <span className="text-sm font-medium text-text-primary">
                    {client.referredBy || "--"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-sm text-text-secondary">Outstanding</span>
                  <span
                    className={`text-sm font-medium ${
                      client.outstandingAmount > 0
                        ? "text-danger"
                        : "text-text-primary"
                    }`}
                  >
                    {formatCurrency(client.outstandingAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Total Paid</span>
                  <span className="text-sm font-medium text-success">
                    {formatCurrency(client.totalPaid)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Cases tab */}
        <TabsContent value="cases">
          {clientCases.length > 0 ? (
            <DataTable
              columns={caseColumns}
              data={clientCases}
              searchKey="caseType"
              searchPlaceholder="Search cases..."
            />
          ) : (
            <EmptyState
              icon={FileText}
              title="No cases found"
              description="This client does not have any cases yet."
            />
          )}
        </TabsContent>

        {/* Documents tab */}
        <TabsContent value="documents">
          <EmptyState
            icon={FileText}
            title="No documents yet"
            description="Documents uploaded for this client will appear here."
            action={
              <button
                type="button"
                onClick={() => addToast({ type: "info", title: "Upload", description: "Document upload will be available soon." })}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-light"
              >
                Upload Document
              </button>
            }
          />
        </TabsContent>

        {/* Payments tab */}
        <TabsContent value="payments">
          {clientInvoices.length > 0 ? (
            <DataTable
              columns={invoiceColumns}
              data={clientInvoices}
              searchKey="invoiceNumber"
              searchPlaceholder="Search invoices..."
            />
          ) : (
            <EmptyState
              icon={FileText}
              title="No invoices found"
              description="Invoices for this client will appear here."
            />
          )}
        </TabsContent>

        {/* Communication tab */}
        <TabsContent value="communication">
          {clientComms.length > 0 ? (
            <DataTable
              columns={commColumns}
              data={clientComms}
              pageSize={10}
            />
          ) : (
            <EmptyState
              icon={MessageSquare}
              title="No communication logs"
              description="Communication history with this client will appear here."
            />
          )}
        </TabsContent>
      </TabsRoot>
    </div>
  );
}
