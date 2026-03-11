"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Plus,
  LayoutGrid,
  List,
  Columns3,
  Calendar,
  User,
  IndianRupee,
  ChevronRight,
} from "lucide-react";
import gsap from "gsap";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { cases } from "@/services/mock-data";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useToastStore } from "@/store/toast-store";
import { useAuthStore } from "@/store/auth-store";
import { useCaseMilestoneStore } from "@/store/case-milestone-store";
import { useNavbarFilterStore } from "@/store/navbar-filter-store";
import type { Case, Domain, CaseStatus, Priority, MilestoneStatus } from "@/types";

const domains: Domain[] = [
  "TNCP",
  "IMC",
  "IDA",
  "Litigation",
  "Revenue",
  "Financial Services",
  "RERA",
];

const statuses: CaseStatus[] = ["Active", "On Hold", "Closed", "Withdrawn"];
const priorities: Priority[] = ["Normal", "High", "Urgent"];

const employeeNames = [
  "Priya Mehta",
  "Rohan Gupta",
  "Sneha Patel",
  "Anil Verma",
  "Rahul Tiwari",
  "Meera Sharma",
  "Vikash Singh",
  "Deepak Rawat",
];

const priorityStyles: Record<Priority, string> = {
  Normal: "bg-blue-50 text-blue-700",
  High: "bg-orange-50 text-orange-700",
  Urgent: "bg-red-50 text-red-700",
};

const domainColors: Record<Domain, string> = {
  Litigation: "bg-blue-100 text-blue-700",
  TNCP: "bg-violet-100 text-violet-700",
  IDA: "bg-emerald-100 text-emerald-700",
  IMC: "bg-amber-100 text-amber-700",
  Revenue: "bg-cyan-100 text-cyan-700",
  RERA: "bg-rose-100 text-rose-700",
  "Financial Services": "bg-teal-100 text-teal-700",
};

type ViewMode = "table" | "grid" | "kanban";

const columns: ColumnDef<Case>[] = [
  {
    accessorKey: "id",
    header: "Case ID",
    cell: ({ row }) => (
      <span className="font-mono font-medium text-primary-light">
        {row.original.id}
      </span>
    ),
  },
  {
    accessorKey: "clientName",
    header: "Client",
    cell: ({ row }) => (
      <span className="font-medium text-text-primary">
        {row.original.clientName}
      </span>
    ),
  },
  {
    accessorKey: "domain",
    header: "Domain",
    cell: ({ row }) => (
      <span className="inline-flex items-center rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-xs font-medium text-text-secondary">
        {row.original.domain}
      </span>
    ),
  },
  {
    accessorKey: "currentStage",
    header: "Stage",
    cell: ({ row }) => (
      <span className="text-sm text-text-secondary">
        {row.original.currentStage}
      </span>
    ),
  },
  {
    accessorKey: "assignedTo",
    header: "Assigned To",
    cell: ({ row }) => (
      <span className="text-text-secondary">{row.original.assignedTo}</span>
    ),
  },
  {
    accessorKey: "nextHearingDate",
    header: "Next Hearing",
    cell: ({ row }) => (
      <span className="text-text-secondary">
        {row.original.nextHearingDate
          ? formatDate(row.original.nextHearingDate)
          : "\u2014"}
      </span>
    ),
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityStyles[row.original.priority]}`}
      >
        {row.original.priority}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];

const inputClass =
  "w-full rounded-xl border-[1.5px] border-border bg-card px-4 py-2.5 text-sm text-text-primary shadow-sm placeholder:text-text-muted outline-none transition-all hover:border-primary-light/40 focus:border-primary-light focus:shadow-[0_0_0_3px_rgb(37_99_235/0.12)]";
const labelClass = "text-sm font-medium text-text-primary mb-1.5";

/* ---- Kanban column config ---- */

const kanbanColumns: { status: MilestoneStatus; label: string; color: string; headerBg: string }[] = [
  { status: "Not Started", label: "Not Started", color: "bg-gray-400", headerBg: "bg-gray-50" },
  { status: "In Progress", label: "In Progress", color: "bg-primary", headerBg: "bg-primary-50" },
  { status: "Blocked", label: "Blocked", color: "bg-danger", headerBg: "bg-danger-bg" },
  { status: "Completed", label: "Completed", color: "bg-success", headerBg: "bg-success-bg" },
];

export default function CasesPage() {
  const router = useRouter();
  const pageRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const addToast = useToastStore((s) => s.addToast);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const user = useAuthStore((s) => s.user);
  const getMilestoneProgress = useCaseMilestoneStore((s) => s.getMilestoneProgress);
  const getCaseMilestones = useCaseMilestoneStore((s) => s.getCaseMilestones);
  const activeFilter = useNavbarFilterStore((s) => s.activeFilter);

  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Sync navbar pills with status filter
  useEffect(() => {
    if (activeFilter === "Active") setStatusFilter("Active");
    else if (activeFilter === "Closed") setStatusFilter("Closed");
    else if (activeFilter === "All Cases") setStatusFilter("all");
  }, [activeFilter]);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [formClientName, setFormClientName] = useState("");
  const [formDomain, setFormDomain] = useState<string>("");
  const [formCaseType, setFormCaseType] = useState("");
  const [formAssignedTo, setFormAssignedTo] = useState("");
  const [formPriority, setFormPriority] = useState<string>("");
  const [formFeeAgreed, setFormFeeAgreed] = useState("");
  const [formNotes, setFormNotes] = useState("");

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

  // GSAP stagger on grid cards
  useEffect(() => {
    if (viewMode === "grid" && gridRef.current) {
      const cards = gridRef.current.querySelectorAll("[data-case-card]");
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { y: 15, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, stagger: 0.05, ease: "power2.out" }
        );
      }
    }
    if (viewMode === "table") {
      const rows = pageRef.current?.querySelectorAll("tbody tr");
      if (rows && rows.length > 0) {
        gsap.fromTo(
          rows,
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.3, stagger: 0.04, ease: "power2.out" }
        );
      }
    }
  }, [viewMode, domainFilter, statusFilter, priorityFilter]);

  const filteredCases = useMemo(() => {
    const canViewAll = hasPermission("canViewAllCases");
    return cases.filter((c) => {
      // Domain-based access: associates only see their domain's cases
      if (!canViewAll && user) {
        const userDept = user.department;
        if (userDept && userDept !== "Admin") {
          if (c.domain !== userDept) return false;
        }
      }
      if (domainFilter !== "all" && c.domain !== domainFilter) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (priorityFilter !== "all" && c.priority !== priorityFilter) return false;
      return true;
    });
  }, [domainFilter, statusFilter, priorityFilter, hasPermission, user]);

  // Kanban: group cases by their current milestone's status
  const kanbanData = useMemo(() => {
    const grouped: Record<MilestoneStatus, Case[]> = {
      "Not Started": [],
      "In Progress": [],
      Blocked: [],
      Completed: [],
      Skipped: [],
    };

    for (const c of filteredCases) {
      const milestones = getCaseMilestones(c.id);
      if (milestones.length === 0) {
        // No milestones: treat as "Not Started"
        grouped["Not Started"].push(c);
        continue;
      }
      // Find the current active milestone
      const blocked = milestones.find((m) => m.status === "Blocked");
      const inProgress = milestones.find((m) => m.status === "In Progress");
      const allDone = milestones.every((m) => m.status === "Completed" || m.status === "Skipped");

      if (blocked) {
        grouped["Blocked"].push(c);
      } else if (allDone) {
        grouped["Completed"].push(c);
      } else if (inProgress) {
        grouped["In Progress"].push(c);
      } else {
        grouped["Not Started"].push(c);
      }
    }

    return grouped;
  }, [filteredCases, getCaseMilestones]);

  const resetForm = () => {
    setFormClientName("");
    setFormDomain("");
    setFormCaseType("");
    setFormAssignedTo("");
    setFormPriority("");
    setFormFeeAgreed("");
    setFormNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({
      type: "success",
      title: "Case Created",
      description: "New case has been created successfully.",
    });
    resetForm();
    setModalOpen(false);
  };

  return (
    <div ref={pageRef} className="space-y-6">
      <PageHeader
        title="Cases"
        description="Manage all active and closed cases"
        action={
          hasPermission("canManageCases") ? (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-light shadow-sm"
            >
              <Plus className="h-4 w-4" />
              New Case
            </button>
          ) : undefined
        }
      />

      {/* Filters + View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="styled-select-sm"
          >
            <option value="all">All Domains</option>
            {domains.map((domain) => (
              <option key={domain} value={domain}>{domain}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="styled-select-sm"
          >
            <option value="all">All Status</option>
            {statuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="styled-select-sm"
          >
            <option value="all">All Priority</option>
            {priorities.map((priority) => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </div>

        {/* View toggle */}
        <div className="flex items-center rounded-xl border border-border bg-card p-1">
          {([
            { mode: "table" as ViewMode, icon: List, label: "Table" },
            { mode: "grid" as ViewMode, icon: LayoutGrid, label: "Grid" },
            { mode: "kanban" as ViewMode, icon: Columns3, label: "Kanban" },
          ]).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                viewMode === mode
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== TABLE VIEW ===== */}
      {viewMode === "table" && (
        <DataTable
          columns={columns}
          data={filteredCases}
          searchKey="clientName"
          searchPlaceholder="Search by client name..."
          onRowClick={(c) => router.push(`/cases/${c.id}`)}
        />
      )}

      {/* ===== GRID VIEW ===== */}
      {viewMode === "grid" && (
        <div ref={gridRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCases.map((c) => {
            const progress = getMilestoneProgress(c.id);
            return (
              <div
                key={c.id}
                data-case-card
                onClick={() => router.push(`/cases/${c.id}`)}
                className="group cursor-pointer rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-lg hover:border-primary-light"
              >
                {/* Top row: ID + Priority */}
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-primary-50 px-2 py-0.5 font-mono text-xs font-medium text-primary">
                    {c.id}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${priorityStyles[c.priority]}`}
                  >
                    {c.priority}
                  </span>
                </div>

                {/* Client name */}
                <h3 className="mt-3 text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                  {c.clientName}
                </h3>

                {/* Domain + Status */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${domainColors[c.domain]}`}>
                    {c.domain}
                  </span>
                  <StatusBadge status={c.status} />
                </div>

                {/* Stage */}
                <p className="mt-3 text-xs text-text-secondary">
                  {c.currentStage}
                </p>

                {/* Milestone progress bar */}
                {progress.total > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-text-muted">
                      <span>Progress</span>
                      <span className="tabular-nums">{progress.completed}/{progress.total}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
                      <div
                        className="h-full rounded-full bg-success transition-all"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Meta row */}
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <div className="flex items-center gap-1 text-[11px] text-text-muted">
                    <User className="h-3 w-3" />
                    <span className="truncate max-w-[120px]">{c.assignedTo}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-text-muted">
                    {c.nextHearingDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(c.nextHearingDate)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" />
                      {formatCurrency(c.amountOutstanding)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredCases.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-text-muted">No cases match your filters.</p>
            </div>
          )}
        </div>
      )}

      {/* ===== KANBAN VIEW ===== */}
      {viewMode === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map((col) => {
            const colCases = kanbanData[col.status] ?? [];
            return (
              <div
                key={col.status}
                className="flex w-[300px] shrink-0 flex-col rounded-2xl border border-border bg-background"
              >
                {/* Column header */}
                <div className={`flex items-center justify-between rounded-t-2xl px-4 py-3 ${col.headerBg}`}>
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                    <span className="text-sm font-semibold text-text-primary">
                      {col.label}
                    </span>
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-text-secondary shadow-sm">
                    {colCases.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-1 flex-col gap-3 p-3 min-h-[200px]">
                  {colCases.length === 0 && (
                    <div className="flex flex-1 items-center justify-center">
                      <p className="text-xs text-text-muted">No cases</p>
                    </div>
                  )}
                  {colCases.map((c) => {
                    const progress = getMilestoneProgress(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => router.push(`/cases/${c.id}`)}
                        className="group cursor-pointer rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary-light"
                      >
                        {/* ID + Priority */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-medium text-primary">
                            {c.id}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${priorityStyles[c.priority]}`}
                          >
                            {c.priority}
                          </span>
                        </div>

                        {/* Client name */}
                        <h4 className="mt-2 text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                          {c.clientName}
                        </h4>

                        {/* Domain */}
                        <span className={`mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${domainColors[c.domain]}`}>
                          {c.domain}
                        </span>

                        {/* Current milestone */}
                        {progress.total > 0 && (
                          <div className="mt-2.5">
                            <p className="text-[11px] text-text-muted truncate">
                              {progress.currentMilestone}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F1F5F9]">
                                <div
                                  className="h-full rounded-full bg-success transition-all"
                                  style={{ width: `${progress.percentage}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-medium text-text-muted tabular-nums">
                                {progress.percentage}%
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Assignee */}
                        <div className="mt-2.5 flex items-center justify-between">
                          <span className="flex items-center gap-1 text-[11px] text-text-muted">
                            <User className="h-3 w-3" />
                            {c.assignedTo}
                          </span>
                          <ChevronRight className="h-3 w-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Case Modal */}
      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Create New Case"
        description="Fill in the details to create a new case."
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className={labelClass}>Client Name</label>
              <input
                type="text"
                required
                value={formClientName}
                onChange={(e) => setFormClientName(e.target.value)}
                placeholder="Enter client name"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col">
              <label className={labelClass}>Domain</label>
              <select
                required
                value={formDomain}
                onChange={(e) => setFormDomain(e.target.value)}
                className="styled-select w-full"
              >
                <option value="" disabled>
                  Select domain
                </option>
                {domains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className={labelClass}>Case Type</label>
              <input
                type="text"
                required
                value={formCaseType}
                onChange={(e) => setFormCaseType(e.target.value)}
                placeholder="e.g. Civil Suit, Buyer Complaint"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col">
              <label className={labelClass}>Assigned To</label>
              <select
                required
                value={formAssignedTo}
                onChange={(e) => setFormAssignedTo(e.target.value)}
                className="styled-select w-full"
              >
                <option value="" disabled>
                  Select assignee
                </option>
                {employeeNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className={labelClass}>Priority</label>
              <select
                required
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value)}
                className="styled-select w-full"
              >
                <option value="" disabled>
                  Select priority
                </option>
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className={labelClass}>Fee Agreed</label>
              <input
                type="number"
                required
                min="0"
                value={formFeeAgreed}
                onChange={(e) => setFormFeeAgreed(e.target.value)}
                placeholder="e.g. 250000"
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2 flex flex-col">
              <label className={labelClass}>Notes</label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Any additional notes..."
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
              className="rounded-xl border px-5 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary text-white px-5 py-2.5 text-sm font-medium hover:bg-primary-light shadow-sm transition-colors"
            >
              Create Case
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
