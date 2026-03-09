"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Globe,
  FileText,
  MessageSquare,
  PhoneCall,
  Video,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
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
} from "@/services/mock-data";
import {
  formatCurrency,
  formatDate,
  getInitials,
} from "@/lib/utils";
import type { Case, Invoice, CommunicationLog } from "@/types";

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

// -- Info item component --
function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string | undefined;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
          {label}
        </p>
        <p className="mt-0.5 text-sm text-text-primary">
          {value || "--"}
        </p>
      </div>
    </div>
  );
}

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

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

      {/* Key info row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <InfoItem icon={Phone} label="Phone" value={client.phone} />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <InfoItem icon={Mail} label="Email" value={client.email} />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <InfoItem icon={MapPin} label="Address" value={client.address} />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <InfoItem
            icon={Calendar}
            label="Client Since"
            value={formatDate(client.clientSince)}
          />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <InfoItem
            icon={User}
            label="Relationship Manager"
            value={client.relationshipManager}
          />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <InfoItem icon={Globe} label="Source" value={client.source} />
        </div>
      </div>

      {/* Tabs */}
      <TabsRoot defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="cases">Cases</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

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
          {communicationLogs.length > 0 ? (
            <DataTable
              columns={commColumns}
              data={communicationLogs}
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
