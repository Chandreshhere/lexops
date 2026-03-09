"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import gsap from "gsap";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { clients } from "@/services/mock-data";
import { formatCurrency, getInitials } from "@/lib/utils";
import { useToastStore } from "@/store/toast-store";
import { useAuthStore } from "@/store/auth-store";
import type { Client } from "@/types";

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

const columns: ColumnDef<Client>[] = [
  {
    accessorKey: "name",
    header: "Client Name",
    cell: ({ row }) => {
      const client = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary">
            {getInitials(client.name)}
          </div>
          <div>
            <p className="font-medium text-text-primary">{client.name}</p>
            <p className="text-xs text-text-muted">{client.clientType}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ getValue }) => (
      <span className="text-text-secondary">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "activeCases",
    header: "Active Cases",
    cell: ({ getValue }) => (
      <div className="text-center">
        <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-primary-50 px-2 text-xs font-semibold text-primary">
          {getValue<number>()}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "outstandingAmount",
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
  {
    accessorKey: "totalPaid",
    header: "Total Paid",
    cell: ({ getValue }) => (
      <span className="font-medium text-success">
        {formatCurrency(getValue<number>())}
      </span>
    ),
  },
  {
    id: "tags",
    header: "Tags",
    cell: ({ row }) => {
      const tags = row.original.tags;
      const visible = tags.slice(0, 2);
      const remaining = tags.length - 2;
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          {visible.map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getTagColor(tag)}`}
            >
              {tag}
            </span>
          ))}
          {remaining > 0 && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-text-muted">
              +{remaining} more
            </span>
          )}
        </div>
      );
    },
  },
];

const clientTypes = ["Individual", "Company", "Partnership", "Trust"];
const sources = ["Walk-in", "Referral", "Online", "Phone Enquiry"];

const inputClass =
  "w-full rounded-xl border-[1.5px] border-border bg-card px-4 py-2.5 text-sm text-text-primary shadow-sm placeholder:text-text-muted outline-none transition-all hover:border-primary-light/40 focus:border-primary-light focus:shadow-[0_0_0_3px_rgb(37_99_235/0.12)]";
const labelClass = "text-sm font-medium text-text-primary mb-1.5";

export default function ClientsPage() {
  const router = useRouter();
  const pageRef = useRef<HTMLDivElement>(null);
  const addToast = useToastStore((s) => s.addToast);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formSource, setFormSource] = useState("");
  const [formReferredBy, setFormReferredBy] = useState("");
  const [formTags, setFormTags] = useState("");

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

  const resetForm = () => {
    setFormName("");
    setFormType("");
    setFormPhone("");
    setFormEmail("");
    setFormAddress("");
    setFormSource("");
    setFormReferredBy("");
    setFormTags("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({
      type: "success",
      title: "Client Added",
      description: `${formName} has been added as a new client.`,
    });
    resetForm();
    setModalOpen(false);
  };

  return (
    <div ref={pageRef} className="space-y-6">
      <PageHeader
        title="Clients"
        description="Manage your client relationships and information"
        action={
          hasPermission("canManageCases") ? (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-light"
            >
              <Plus className="h-4 w-4" />
              Add Client
            </button>
          ) : undefined
        }
      />

      <DataTable
        columns={columns}
        data={clients}
        searchKey="name"
        searchPlaceholder="Search clients..."
        onRowClick={(client) => router.push(`/clients/${client.id}`)}
      />

      {/* Add Client Modal */}
      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Add New Client"
        description="Fill in the client details below."
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter full name"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col">
              <label className={labelClass}>Client Type</label>
              <select
                required
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="styled-select w-full"
              >
                <option value="" disabled>
                  Select type
                </option>
                {clientTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className={labelClass}>Phone</label>
              <input
                type="tel"
                required
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col">
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="client@email.com"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col">
              <label className={labelClass}>Source</label>
              <select
                required
                value={formSource}
                onChange={(e) => setFormSource(e.target.value)}
                className="styled-select w-full"
              >
                <option value="" disabled>
                  Select source
                </option>
                {sources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className={labelClass}>
                Referred By <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={formReferredBy}
                onChange={(e) => setFormReferredBy(e.target.value)}
                placeholder="Referrer name"
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2 flex flex-col">
              <label className={labelClass}>Address</label>
              <textarea
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder="Full address"
                className={`${inputClass} min-h-[80px] resize-none`}
              />
            </div>

            <div className="md:col-span-2 flex flex-col">
              <label className={labelClass}>
                Tags <span className="text-text-muted font-normal">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                placeholder="e.g. VIP, Litigation, Recurring"
                className={inputClass}
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
              className="rounded-xl border px-5 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary text-white px-5 py-2.5 text-sm font-medium hover:bg-primary-light shadow-sm transition-colors"
            >
              Add Client
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
