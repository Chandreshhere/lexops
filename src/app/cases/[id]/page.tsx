"use client";

import { useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  Phone,
  MessageCircle,
  Mail,
  Clock,
  Gavel,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  Circle,
  PlayCircle,
  Ban,
  SkipForward,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Target,
  ArrowRightLeft,
  Send,
  Check,
  X,
  LayoutList,
  Columns3,
  GitBranch,
  ClipboardList,
  UserCircle,
  FolderOpen,
  FolderOutput,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import {
  cases,
  timelineEvents,
  communicationLogs,
  upcomingHearings,
  employees,
  getMilestoneTemplate,
} from "@/services/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useCaseMilestoneStore } from "@/store/case-milestone-store";
import { useDomainTransferStore } from "@/store/domain-transfer-store";
import { useToastStore } from "@/store/toast-store";
import type { Priority, MilestoneStatus, CaseMilestone, Domain } from "@/types";
import { MilestoneKanban } from "@/components/milestone-kanban";

const priorityStyles: Record<Priority, string> = {
  Normal: "bg-blue-50 text-blue-700",
  High: "bg-orange-50 text-orange-700",
  Urgent: "bg-red-50 text-red-700",
};

const timelineColors: Record<string, string> = {
  created: "bg-blue-500",
  document: "bg-purple-500",
  hearing: "bg-yellow-500",
  stage: "bg-green-500",
  payment: "bg-emerald-500",
  communication: "bg-cyan-500",
};

const timelineRingColors: Record<string, string> = {
  created: "ring-blue-100",
  document: "ring-purple-100",
  hearing: "ring-yellow-100",
  stage: "ring-green-100",
  payment: "ring-emerald-100",
  communication: "ring-cyan-100",
};

/* ---- Milestone status visuals ---- */

const milestoneStatusConfig: Record<MilestoneStatus, { icon: typeof Circle; color: string; bg: string; ring: string; label: string }> = {
  "Not Started": { icon: Circle, color: "text-gray-400", bg: "bg-gray-100", ring: "ring-gray-50", label: "Not Started" },
  "In Progress": { icon: PlayCircle, color: "text-primary", bg: "bg-primary", ring: "ring-primary-50", label: "In Progress" },
  Completed: { icon: CheckCircle2, color: "text-success", bg: "bg-success", ring: "ring-success-bg", label: "Completed" },
  Blocked: { icon: Ban, color: "text-danger", bg: "bg-danger", ring: "ring-danger-bg", label: "Blocked" },
  Skipped: { icon: SkipForward, color: "text-text-muted", bg: "bg-gray-300", ring: "ring-gray-100", label: "Skipped" },
};

function CommunicationIcon({ type }: { type: string }) {
  const className = "h-4 w-4";
  switch (type) {
    case "Call":
      return <Phone className={className} />;
    case "WhatsApp":
      return <MessageCircle className={className} />;
    case "Email":
      return <Mail className={className} />;
    case "In-Person":
      return <User className={className} />;
    default:
      return <MessageCircle className={className} />;
  }
}

const inputClass =
  "w-full rounded-xl border-[1.5px] border-border bg-card px-4 py-2.5 text-sm text-text-primary shadow-sm placeholder:text-text-muted outline-none transition-all hover:border-primary-light/40 focus:border-primary-light focus:shadow-[0_0_0_3px_rgb(37_99_235/0.12)]";
const labelClass = "text-sm font-medium text-text-primary mb-1.5";

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const addToast = useToastStore((s) => s.addToast);
  const caseId = params.id as string;

  // Milestone store — subscribe to raw data so React re-renders on changes
  const allMilestones = useCaseMilestoneStore((s) => s.milestones);
  const advanceMilestone = useCaseMilestoneStore((s) => s.advanceMilestone);
  const blockMilestone = useCaseMilestoneStore((s) => s.blockMilestone);
  const skipMilestone = useCaseMilestoneStore((s) => s.skipMilestone);
  const addMilestone = useCaseMilestoneStore((s) => s.addMilestone);
  const removeMilestone = useCaseMilestoneStore((s) => s.removeMilestone);
  const updateMilestone = useCaseMilestoneStore((s) => s.updateMilestone);

  // Milestones view mode
  const [milestonesView, setMilestonesView] = useState<"timeline" | "kanban" | "taskflow">("kanban");
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);

  // Modal state for add milestone
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newMilestoneName, setNewMilestoneName] = useState("");
  const [newMilestoneDesc, setNewMilestoneDesc] = useState("");
  const [newMilestoneAssignee, setNewMilestoneAssignee] = useState("");

  // Modal state for block reason
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [blockTargetId, setBlockTargetId] = useState("");

  // Modal state for milestone notes
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [notesTargetId, setNotesTargetId] = useState("");

  // Domain transfer state
  const createTransferRequest = useDomainTransferStore((s) => s.createRequest);
  const reviewTransferRequest = useDomainTransferStore((s) => s.reviewRequest);
  const getRequestsForCase = useDomainTransferStore((s) => s.getRequestsForCase);
  const getPendingRequests = useDomainTransferStore((s) => s.getPendingRequests);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferDomain, setTransferDomain] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRequestId, setReviewRequestId] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");

  const currentCase = useMemo(
    () => cases.find((m) => m.id === decodeURIComponent(caseId)),
    [caseId]
  );

  const caseHearings = useMemo(
    () =>
      currentCase
        ? upcomingHearings.filter((h) => h.caseId === currentCase.id)
        : [],
    [currentCase]
  );

  const decodedCaseId = decodeURIComponent(caseId);
  const milestones = useMemo(
    () => allMilestones.filter((m) => m.caseId === decodedCaseId).sort((a, b) => a.order - b.order),
    [allMilestones, decodedCaseId]
  );
  const progress = useMemo(() => {
    const total = milestones.length;
    const completed = milestones.filter((m) => m.status === "Completed" || m.status === "Skipped").length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const current = milestones.find((m) => m.status === "In Progress") ?? milestones.find((m) => m.status === "Not Started");
    return { completed, total, percentage, currentMilestone: current?.name ?? "All Complete" };
  }, [milestones]);

  const isAdmin = hasPermission("canManageCases") && (user?.role === "admin" || user?.role === "partner");
  const isAssigned = currentCase && user && (currentCase.assignedTo === user.name || currentCase.coAssigned === user.name);
  const canManageMilestones = isAdmin || isAssigned;

  const employeeNames = employees.filter((e) => e.designation !== "Accountant").map((e) => e.name);

  // Task flow template — has sub-tasks per milestone for domains that define them
  const milestoneTemplate = useMemo(
    () => currentCase ? getMilestoneTemplate(currentCase.domain as Domain) : [],
    [currentCase]
  );

  if (!currentCase) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="rounded-full bg-danger-bg p-4">
          <AlertCircle className="h-10 w-10 text-danger" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-text-primary">
          Case Not Found
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          The case you are looking for does not exist or has been removed.
        </p>
        <button
          type="button"
          onClick={() => router.push("/cases")}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-light"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cases
        </button>
      </div>
    );
  }

  const feePercent =
    currentCase.feeAgreed > 0
      ? Math.round((currentCase.amountReceived / currentCase.feeAgreed) * 100)
      : 0;

  const handleAdvance = (m: CaseMilestone) => {
    advanceMilestone(m.id);
    const next = m.status === "Not Started" ? "started" : "completed";
    addToast({ type: "success", title: `Milestone ${next}`, description: m.name });
  };

  const handleBlock = () => {
    if (!blockTargetId || !blockReason.trim()) return;
    blockMilestone(blockTargetId, blockReason.trim());
    addToast({ type: "warning", title: "Milestone blocked", description: blockReason });
    setBlockModalOpen(false);
    setBlockReason("");
    setBlockTargetId("");
  };

  const handleSkip = (m: CaseMilestone) => {
    skipMilestone(m.id);
    addToast({ type: "info", title: "Milestone skipped", description: m.name });
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    const maxOrder = milestones.length > 0 ? Math.max(...milestones.map((m) => m.order)) : 0;
    addMilestone({
      id: `CM-${decodedCaseId}-${Date.now()}`,
      caseId: decodedCaseId,
      name: newMilestoneName,
      description: newMilestoneDesc,
      order: maxOrder + 1,
      status: "Not Started",
      assignedTo: newMilestoneAssignee || currentCase.assignedTo,
    });
    addToast({ type: "success", title: "Milestone added", description: newMilestoneName });
    setNewMilestoneName("");
    setNewMilestoneDesc("");
    setNewMilestoneAssignee("");
    setAddModalOpen(false);
  };

  const handleRemoveMilestone = (m: CaseMilestone) => {
    removeMilestone(m.id);
    addToast({ type: "info", title: "Milestone removed", description: m.name });
  };

  const handleSaveNotes = () => {
    if (!notesTargetId) return;
    updateMilestone(notesTargetId, { notes: notesValue });
    addToast({ type: "success", title: "Notes saved" });
    setNotesModalOpen(false);
    setNotesValue("");
    setNotesTargetId("");
  };

  // Kanban drag-and-drop status change
  const handleKanbanStatusChange = useCallback(
    (milestoneId: string, newStatus: MilestoneStatus) => {
      const today = new Date().toISOString().split("T")[0];
      const updates: Partial<CaseMilestone> = { status: newStatus };

      if (newStatus === "In Progress") {
        updates.startDate = updates.startDate ?? today;
        updates.blockedReason = undefined;
      } else if (newStatus === "Completed") {
        updates.completedDate = today;
        updates.blockedReason = undefined;
      } else if (newStatus === "Not Started") {
        updates.startDate = undefined;
        updates.completedDate = undefined;
        updates.blockedReason = undefined;
      }
      // For Blocked status, we still need a reason — open the block modal
      if (newStatus === "Blocked") {
        setBlockTargetId(milestoneId);
        setBlockModalOpen(true);
        return;
      }

      updateMilestone(milestoneId, updates);
      addToast({
        type: "success",
        title: `Milestone moved to ${newStatus}`,
      });
    },
    [updateMilestone, addToast]
  );

  const handleKanbanBlock = useCallback(
    (milestoneId: string) => {
      setBlockTargetId(milestoneId);
      setBlockModalOpen(true);
    },
    []
  );

  const handleKanbanEditNotes = useCallback(
    (milestoneId: string, currentNotes: string) => {
      setNotesTargetId(milestoneId);
      setNotesValue(currentNotes);
      setNotesModalOpen(true);
    },
    []
  );

  const handleKanbanUnblock = useCallback(
    (milestoneId: string) => {
      updateMilestone(milestoneId, { status: "In Progress", blockedReason: undefined });
      addToast({ type: "success", title: "Milestone unblocked" });
    },
    [updateMilestone, addToast]
  );

  const handleKanbanAssign = useCallback(
    (milestoneId: string, assignee: string) => {
      updateMilestone(milestoneId, { assignedTo: assignee });
      addToast({ type: "success", title: "Milestone reassigned", description: `Assigned to ${assignee}` });
    },
    [updateMilestone, addToast]
  );

  // Domain transfer handlers
  const allDomains: Domain[] = ["Litigation", "TNCP", "IMC", "IDA", "Revenue", "RERA", "Financial Services"];
  const caseTransferRequests = currentCase ? getRequestsForCase(currentCase?.id ?? "") : [];
  const allPendingRequests = getPendingRequests();

  const handleTransferRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCase || !transferDomain || !transferReason.trim() || !user) return;
    createTransferRequest({
      caseId: currentCase.id,
      caseName: `${currentCase.clientName} — ${currentCase.caseType}`,
      fromDomain: currentCase.domain,
      toDomain: transferDomain as Domain,
      requestedBy: user.name,
      reason: transferReason.trim(),
    });
    addToast({ type: "success", title: "Transfer requested", description: `Requested shift to ${transferDomain}` });
    setTransferModalOpen(false);
    setTransferDomain("");
    setTransferReason("");
  };

  const handleReviewDecision = (decision: "Approved" | "Rejected") => {
    if (!reviewRequestId || !user) return;
    reviewTransferRequest(reviewRequestId, decision, user.name, reviewNotes.trim() || undefined);
    addToast({
      type: decision === "Approved" ? "success" : "info",
      title: `Transfer ${decision.toLowerCase()}`,
    });
    setReviewModalOpen(false);
    setReviewRequestId("");
    setReviewNotes("");
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.push("/cases")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Cases
      </button>

      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-primary-50 px-2.5 py-1 font-mono text-sm font-medium text-primary">
                {currentCase.id}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityStyles[currentCase.priority]}`}
              >
                {currentCase.priority}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary">
              {currentCase.clientName}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                {currentCase.domain}
              </span>
              <StatusBadge status={currentCase.status} />
              <span className="text-sm text-text-muted">
                {currentCase.caseType}
              </span>
            </div>
          </div>

          {/* Milestone mini-progress in header */}
          {milestones.length > 0 && (
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-xs font-medium text-text-muted">Milestone Progress</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-32 overflow-hidden rounded-full bg-[#F1F5F9]">
                  <div
                    className="h-full rounded-full bg-success transition-all"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-text-primary tabular-nums">
                  {progress.completed}/{progress.total}
                </span>
              </div>
              <span className="text-[11px] text-text-muted">{progress.currentMilestone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Key Info Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <InfoCard
          label="Assigned To"
          value={currentCase.assignedTo}
          icon={<User className="h-4 w-4 text-text-muted" />}
        />
        <InfoCard
          label="Fee Agreed"
          value={formatCurrency(currentCase.feeAgreed)}
          icon={<IndianRupee className="h-4 w-4 text-text-muted" />}
        />
        <InfoCard
          label="Amount Received"
          value={formatCurrency(currentCase.amountReceived)}
          icon={<IndianRupee className="h-4 w-4 text-success" />}
        />
        <InfoCard
          label="Outstanding"
          value={formatCurrency(currentCase.amountOutstanding)}
          icon={<IndianRupee className="h-4 w-4 text-danger" />}
        />
        <InfoCard
          label="Next Action"
          value={formatDate(currentCase.nextActionDate)}
          icon={<Calendar className="h-4 w-4 text-text-muted" />}
        />
        <InfoCard
          label="Next Hearing"
          value={
            currentCase.nextHearingDate
              ? formatDate(currentCase.nextHearingDate)
              : "\u2014"
          }
          icon={<Gavel className="h-4 w-4 text-text-muted" />}
        />
      </div>

      {/* Tabs */}
      <TabsRoot defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="hearings">Hearings</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="transfer">Domain Transfer</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Milestone Progress (replaces old static stage) */}
            {milestones.length > 0 ? (
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-text-primary">
                    Case Progress
                  </h3>
                  <span className="text-sm font-medium text-primary tabular-nums">
                    {progress.percentage}% complete
                  </span>
                </div>
                <div className="mt-4">
                  <div className="h-3 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-text-secondary">
                      Current: <span className="font-medium text-text-primary">{progress.currentMilestone}</span>
                    </span>
                    <span className="text-text-muted">
                      {progress.completed} of {progress.total} milestones done
                    </span>
                  </div>
                </div>

                {/* Mini milestone dots */}
                <div className="mt-4 flex items-center gap-1">
                  {milestones.map((m) => {
                    const cfg = milestoneStatusConfig[m.status];
                    return (
                      <div
                        key={m.id}
                        className={`h-2 flex-1 rounded-full ${
                          m.status === "Completed" ? "bg-success" :
                          m.status === "In Progress" ? "bg-primary" :
                          m.status === "Blocked" ? "bg-danger" :
                          m.status === "Skipped" ? "bg-gray-300" :
                          "bg-gray-200"
                        }`}
                        title={`${m.name} — ${cfg.label}`}
                      />
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-base font-semibold text-text-primary">
                  Current Stage
                </h3>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary">
                        {currentCase.currentStage}
                      </span>
                      <StatusBadge status={currentCase.stageStatus} />
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width:
                            currentCase.stageStatus === "Completed"
                              ? "100%"
                              : currentCase.stageStatus === "In Progress"
                                ? "60%"
                                : currentCase.stageStatus === "Awaiting Response"
                                  ? "40%"
                                  : "20%",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Key Details Grid */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-base font-semibold text-text-primary">
                Key Details
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <DetailRow label="Case ID" value={currentCase.id} />
                <DetailRow label="Client" value={currentCase.clientName} />
                <DetailRow label="Domain" value={currentCase.domain} />
                <DetailRow label="Case Type" value={currentCase.caseType} />
                <DetailRow label="Assigned To" value={currentCase.assignedTo} />
                <DetailRow
                  label="Co-Assigned"
                  value={currentCase.coAssigned || "\u2014"}
                />
                <DetailRow
                  label="Created Date"
                  value={formatDate(currentCase.createdDate)}
                />
                <DetailRow
                  label="Last Updated"
                  value={formatDate(currentCase.lastUpdated)}
                />
                <DetailRow
                  label="Next Action Date"
                  value={formatDate(currentCase.nextActionDate)}
                />
                <DetailRow
                  label="Next Hearing Date"
                  value={
                    currentCase.nextHearingDate
                      ? formatDate(currentCase.nextHearingDate)
                      : "\u2014"
                  }
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ========== MILESTONES TAB ========== */}
        <TabsContent value="milestones">
          {milestones.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <EmptyState
                icon={Target}
                title="No milestones yet"
                description="This case does not have milestones configured. An admin can add milestones to track case progress."
                action={
                  isAdmin ? (
                    <button
                      type="button"
                      onClick={() => setAddModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-light"
                    >
                      <Plus className="h-4 w-4" />
                      Add Milestone
                    </button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Progress summary + view toggle */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-text-primary">
                      Case Workflow
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary">
                      {progress.completed} of {progress.total} milestones completed ({progress.percentage}%)
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* View toggle */}
                    <div className="flex items-center rounded-lg border border-border bg-background p-0.5">
                      <button
                        type="button"
                        onClick={() => setMilestonesView("kanban")}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          milestonesView === "kanban"
                            ? "bg-primary text-white shadow-sm"
                            : "text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        <Columns3 className="h-3.5 w-3.5" />
                        Board
                      </button>
                      <button
                        type="button"
                        onClick={() => setMilestonesView("timeline")}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          milestonesView === "timeline"
                            ? "bg-primary text-white shadow-sm"
                            : "text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        <LayoutList className="h-3.5 w-3.5" />
                        Timeline
                      </button>
                      {milestoneTemplate.some((t) => t.tasks && t.tasks.length > 0) && (
                        <button
                          type="button"
                          onClick={() => setMilestonesView("taskflow")}
                          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                            milestonesView === "taskflow"
                              ? "bg-primary text-white shadow-sm"
                              : "text-text-secondary hover:text-text-primary"
                          }`}
                        >
                          <GitBranch className="h-3.5 w-3.5" />
                          Task Flow
                        </button>
                      )}
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setAddModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-light"
                      >
                        <Plus className="h-4 w-4" />
                        Add Milestone
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
                  <div
                    className="h-full rounded-full bg-success transition-all"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>

              {/* ---- KANBAN VIEW ---- */}
              {milestonesView === "kanban" && (
                <MilestoneKanban
                  milestones={milestones}
                  canManage={canManageMilestones ?? false}
                  isAdmin={isAdmin ?? false}
                  employeeNames={employeeNames}
                  onStatusChange={handleKanbanStatusChange}
                  onAdvance={handleAdvance}
                  onBlock={handleKanbanBlock}
                  onUnblock={handleKanbanUnblock}
                  onSkip={handleSkip}
                  onRemove={handleRemoveMilestone}
                  onEditNotes={handleKanbanEditNotes}
                  onAssign={handleKanbanAssign}
                  onAdd={() => setAddModalOpen(true)}
                />
              )}

              {/* ---- TIMELINE VIEW ---- */}
              {milestonesView === "timeline" && (
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="relative">
                  {milestones.map((m, index) => {
                    const isLast = index === milestones.length - 1;
                    const cfg = milestoneStatusConfig[m.status];
                    const Icon = cfg.icon;

                    return (
                      <div key={m.id} className="relative flex gap-4 pb-8 last:pb-0">
                        {/* Vertical connector line */}
                        {!isLast && (
                          <div
                            className={`absolute left-[15px] top-9 h-[calc(100%-20px)] w-0.5 ${
                              m.status === "Completed" || m.status === "Skipped" ? "bg-success" : "bg-border"
                            }`}
                          />
                        )}

                        {/* Status icon */}
                        <div className="relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full ring-4 ${
                              m.status === "Completed" ? "bg-success ring-success-bg" :
                              m.status === "In Progress" ? "bg-primary ring-primary-50" :
                              m.status === "Blocked" ? "bg-danger ring-danger-bg" :
                              m.status === "Skipped" ? "bg-gray-300 ring-gray-100" :
                              "bg-gray-200 ring-gray-50"
                            }`}
                          >
                            <Icon className={`h-4 w-4 ${
                              m.status === "Not Started" ? "text-gray-400" : "text-white"
                            }`} />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-0.5">
                          <div className="rounded-xl border border-border bg-white p-4 transition-shadow hover:shadow-sm">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-text-muted tabular-nums">
                                    Step {m.order}
                                  </span>
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                    m.status === "Completed" ? "bg-success-bg text-success" :
                                    m.status === "In Progress" ? "bg-primary-50 text-primary" :
                                    m.status === "Blocked" ? "bg-danger-bg text-danger" :
                                    m.status === "Skipped" ? "bg-gray-100 text-gray-500" :
                                    "bg-gray-100 text-gray-500"
                                  }`}>
                                    {cfg.label}
                                  </span>
                                </div>
                                <h4 className="mt-1 text-sm font-semibold text-text-primary">
                                  {m.name}
                                </h4>
                                <p className="mt-0.5 text-xs text-text-secondary">
                                  {m.description}
                                </p>

                                {/* Meta info */}
                                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {m.assignedTo}
                                  </span>
                                  {m.startDate && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      Started {formatDate(m.startDate)}
                                    </span>
                                  )}
                                  {m.dueDate && m.status !== "Completed" && (
                                    <span className="flex items-center gap-1 text-warning">
                                      <Clock className="h-3 w-3" />
                                      Due {formatDate(m.dueDate)}
                                    </span>
                                  )}
                                  {m.completedDate && (
                                    <span className="flex items-center gap-1 text-success">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Completed {formatDate(m.completedDate)}
                                    </span>
                                  )}
                                </div>

                                {m.blockedReason && (
                                  <div className="mt-2 rounded-lg bg-danger-bg px-3 py-1.5 text-xs text-danger">
                                    Blocked: {m.blockedReason}
                                  </div>
                                )}

                                {m.notes && (
                                  <div className="mt-2 rounded-lg bg-[#F1F5F9] px-3 py-1.5 text-xs text-text-secondary">
                                    {m.notes}
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              {canManageMilestones && (
                                <div className="flex shrink-0 items-center gap-1.5">
                                  {(m.status === "Not Started" || m.status === "In Progress") && (
                                    <button
                                      type="button"
                                      onClick={() => handleAdvance(m)}
                                      className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                                      title={m.status === "Not Started" ? "Start" : "Complete"}
                                    >
                                      <ChevronRight className="h-3.5 w-3.5" />
                                      {m.status === "Not Started" ? "Start" : "Complete"}
                                    </button>
                                  )}
                                  {m.status === "In Progress" && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setBlockTargetId(m.id);
                                        setBlockModalOpen(true);
                                      }}
                                      className="rounded-lg border border-danger-bg p-1.5 text-danger transition-colors hover:bg-danger-bg"
                                      title="Block"
                                    >
                                      <Ban className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  {m.status === "Blocked" && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        updateMilestone(m.id, { status: "In Progress", blockedReason: undefined });
                                        addToast({ type: "success", title: "Milestone unblocked", description: m.name });
                                      }}
                                      className="inline-flex items-center gap-1 rounded-lg bg-success-bg px-2.5 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success hover:text-white"
                                    >
                                      <PlayCircle className="h-3.5 w-3.5" />
                                      Unblock
                                    </button>
                                  )}
                                  {m.status === "Not Started" && (
                                    <button
                                      type="button"
                                      onClick={() => handleSkip(m)}
                                      className="rounded-lg border border-border p-1.5 text-text-muted transition-colors hover:bg-gray-50"
                                      title="Skip"
                                    >
                                      <SkipForward className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNotesTargetId(m.id);
                                      setNotesValue(m.notes ?? "");
                                      setNotesModalOpen(true);
                                    }}
                                    className="rounded-lg border border-border p-1.5 text-text-muted transition-colors hover:bg-gray-50"
                                    title="Add notes"
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                  </button>
                                  {isAdmin && m.status === "Not Started" && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveMilestone(m)}
                                      className="rounded-lg border border-danger-bg p-1.5 text-danger transition-colors hover:bg-danger-bg"
                                      title="Remove"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              )}

              {/* ---- TASK FLOW VIEW ---- */}
              {milestonesView === "taskflow" && (
              <div className="space-y-4">
                {milestoneTemplate.map((template, tIdx) => {
                  const caseMilestone = milestones.find((m) => m.name === template.name);
                  const status = caseMilestone?.status ?? "Not Started";
                  const isExpanded = expandedMilestone === template.id;
                  const hasTasks = template.tasks && template.tasks.length > 0;

                  const statusColor =
                    status === "Completed" ? "bg-success" :
                    status === "In Progress" ? "bg-primary" :
                    status === "Blocked" ? "bg-danger" :
                    status === "Skipped" ? "bg-gray-300" :
                    "bg-gray-200";
                  const statusBg =
                    status === "Completed" ? "bg-success-bg text-success" :
                    status === "In Progress" ? "bg-primary-50 text-primary" :
                    status === "Blocked" ? "bg-danger-bg text-danger" :
                    status === "Skipped" ? "bg-gray-100 text-gray-500" :
                    "bg-gray-100 text-gray-500";
                  const borderColor =
                    status === "Completed" ? "border-success/30" :
                    status === "In Progress" ? "border-primary/30" :
                    status === "Blocked" ? "border-danger/30" :
                    "border-border";

                  const responsibleIcon = (role: string) => {
                    switch (role) {
                      case "Lawyer": return <Gavel className="h-3 w-3" />;
                      case "Client": return <UserCircle className="h-3 w-3" />;
                      case "Authority": return <Target className="h-3 w-3" />;
                      case "Architect": return <Columns3 className="h-3 w-3" />;
                      case "Surveyor": return <Target className="h-3 w-3" />;
                      case "Clerk": return <ClipboardList className="h-3 w-3" />;
                      default: return <User className="h-3 w-3" />;
                    }
                  };

                  const responsibleColor = (role: string) => {
                    switch (role) {
                      case "Lawyer": return "bg-blue-50 text-blue-700 border-blue-200";
                      case "Client": return "bg-purple-50 text-purple-700 border-purple-200";
                      case "Authority": return "bg-amber-50 text-amber-700 border-amber-200";
                      case "Architect": return "bg-emerald-50 text-emerald-700 border-emerald-200";
                      case "Surveyor": return "bg-cyan-50 text-cyan-700 border-cyan-200";
                      case "Clerk": return "bg-orange-50 text-orange-700 border-orange-200";
                      default: return "bg-gray-50 text-gray-700 border-gray-200";
                    }
                  };

                  return (
                    <div key={template.id} className="relative">
                      {/* Connector line between milestones */}
                      {tIdx < milestoneTemplate.length - 1 && (
                        <div className={`absolute left-6 top-full z-0 h-4 w-0.5 ${
                          status === "Completed" || status === "Skipped" ? "bg-success" : "bg-border"
                        }`} />
                      )}

                      {/* Milestone header card */}
                      <div className={`rounded-xl border-2 ${borderColor} bg-card shadow-sm transition-all`}>
                        <button
                          type="button"
                          onClick={() => setExpandedMilestone(isExpanded ? null : template.id)}
                          className="flex w-full items-center gap-4 p-4 text-left"
                        >
                          {/* Step number badge */}
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${statusColor} text-sm font-bold text-white shadow-sm`}>
                            {template.order}
                          </div>

                          {/* Title & description */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-semibold text-text-primary">{template.name}</h4>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBg}`}>
                                {status}
                              </span>
                              {template.estimatedDays && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-text-muted">
                                  <Clock className="h-2.5 w-2.5" />
                                  ~{template.estimatedDays} days
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-text-secondary">{template.description}</p>
                          </div>

                          {/* Task count & expand */}
                          {hasTasks && (
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                                {template.tasks!.length} tasks
                              </span>
                              <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </div>
                          )}
                        </button>

                        {/* Expanded tasks */}
                        {isExpanded && hasTasks && (
                          <div className="border-t border-border px-4 pb-4 pt-3">
                            <div className="space-y-3">
                              {template.tasks!.map((task, taskIdx) => (
                                <div
                                  key={task.id}
                                  className="relative flex gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:border-primary/20 hover:bg-primary-50/30"
                                >
                                  {/* Task number */}
                                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-[10px] font-bold text-text-muted shadow-sm ring-1 ring-border">
                                    {template.order}.{taskIdx + 1}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    {/* Task name + responsible */}
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-sm font-medium text-text-primary">{task.name}</span>
                                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${responsibleColor(task.responsible)}`}>
                                        {responsibleIcon(task.responsible)}
                                        {task.responsible}
                                      </span>
                                    </div>

                                    {/* Description */}
                                    <p className="mt-0.5 text-xs text-text-secondary">{task.description}</p>

                                    {/* Documents */}
                                    <div className="mt-2 flex flex-wrap gap-3">
                                      {task.documentsRequired && task.documentsRequired.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-1">
                                          <FolderOpen className="h-3 w-3 text-amber-500" />
                                          <span className="text-[10px] font-semibold text-amber-600">Required:</span>
                                          {task.documentsRequired.map((doc) => (
                                            <span key={doc} className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">{doc}</span>
                                          ))}
                                        </div>
                                      )}
                                      {task.documentsGenerated && task.documentsGenerated.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-1">
                                          <FolderOutput className="h-3 w-3 text-emerald-500" />
                                          <span className="text-[10px] font-semibold text-emerald-600">Generated:</span>
                                          {task.documentsGenerated.map((doc) => (
                                            <span key={doc} className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700">{doc}</span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <EmptyState
              icon={FileText}
              title="No documents uploaded yet"
              description="Upload documents related to this case to keep everything organized in one place."
              action={
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-light"
                >
                  <FileText className="h-4 w-4" />
                  Upload Document
                </button>
              }
            />
          </div>
        </TabsContent>

        {/* Hearings Tab */}
        <TabsContent value="hearings">
          {caseHearings.length > 0 ? (
            <div className="space-y-4">
              {caseHearings.map((hearing) => (
                <div
                  key={hearing.id}
                  className="rounded-xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-text-primary">
                          {formatDate(hearing.date)}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary">
                        <span className="font-medium text-text-primary">
                          Court:{" "}
                        </span>
                        {hearing.court}
                      </p>
                      <p className="text-sm text-text-secondary">
                        <span className="font-medium text-text-primary">
                          Purpose:{" "}
                        </span>
                        {hearing.purpose}
                      </p>
                      <p className="text-sm text-text-secondary">
                        <span className="font-medium text-text-primary">
                          Advocate:{" "}
                        </span>
                        {hearing.advocate}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <EmptyState
                icon={Gavel}
                title="No hearings scheduled"
                description="There are no upcoming hearings for this case at the moment."
              />
            </div>
          )}
        </TabsContent>

        {/* Finance Tab */}
        <TabsContent value="finance">
          {user?.role === "paralegal" ? (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-8 w-8 text-text-muted" />
                <h3 className="mt-3 text-base font-semibold text-text-primary">Access Restricted</h3>
                <p className="mt-1 text-sm text-text-secondary">
                  You do not have permission to view financial details.
                </p>
              </div>
            </div>
          ) : (
          <div className="space-y-6">
            {/* Fee Breakdown */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-base font-semibold text-text-primary">
                Fee Breakdown
              </h3>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Fee Agreed</span>
                  <span className="font-medium text-text-primary">
                    {formatCurrency(currentCase.feeAgreed)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Amount Received</span>
                  <span className="font-medium text-success">
                    {formatCurrency(currentCase.amountReceived)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Outstanding</span>
                  <span className="font-medium text-danger">
                    {formatCurrency(currentCase.amountOutstanding)}
                  </span>
                </div>

                {/* Visual bar */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>Collection Progress</span>
                    <span>{feePercent}%</span>
                  </div>
                  <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
                    <div
                      className="h-full rounded-full bg-success transition-all"
                      style={{ width: `${feePercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment History Placeholder */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-base font-semibold text-text-primary">
                Payment History
              </h3>
              <div className="mt-4 flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-8 w-8 text-text-muted" />
                <p className="mt-3 text-sm text-text-secondary">
                  Detailed payment history will appear here once transactions
                  are recorded.
                </p>
              </div>
            </div>
          </div>
          )}
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-base font-semibold text-text-primary">
              Activity Timeline
            </h3>
            <div className="relative mt-6">
              {timelineEvents.map((event, index) => {
                const isLast = index === timelineEvents.length - 1;
                return (
                  <div key={event.id} className="relative flex gap-4 pb-8 last:pb-0">
                    {/* Vertical line */}
                    {!isLast && (
                      <div className="absolute left-[11px] top-6 h-full w-0.5 bg-border" />
                    )}
                    {/* Dot */}
                    <div
                      className={`relative z-10 mt-0.5 h-6 w-6 shrink-0 rounded-full ring-4 ${timelineColors[event.type]} ${timelineRingColors[event.type]}`}
                    />
                    {/* Content */}
                    <div className="flex-1 pt-0.5">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <h4 className="text-sm font-medium text-text-primary">
                          {event.title}
                        </h4>
                        <span className="text-xs text-text-muted">
                          {formatDate(event.date)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-text-secondary">
                        {event.description}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        by {event.user}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Communication Tab */}
        <TabsContent value="communication">
          {user?.role === "accountant" ? (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-8 w-8 text-text-muted" />
                <h3 className="mt-3 text-base font-semibold text-text-primary">Access Restricted</h3>
                <p className="mt-1 text-sm text-text-secondary">
                  Communication logs are not available for your role.
                </p>
              </div>
            </div>
          ) : (
          <div className="space-y-4">
            {communicationLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50">
                    <CommunicationIcon type={log.type} />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-text-primary">
                          {log.type}
                        </h4>
                        {log.followUpRequired && (
                          <span className="inline-flex items-center rounded-full bg-warning-bg px-2 py-0.5 text-xs font-medium text-warning">
                            Follow-up Required
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-text-muted">
                        {formatDate(log.date)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-text-secondary">
                      {log.summary}
                    </p>
                    {log.followUpDate && (
                      <p className="mt-2 flex items-center gap-1 text-xs text-text-muted">
                        <Clock className="h-3 w-3" />
                        Follow-up by {formatDate(log.followUpDate)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </TabsContent>

        {/* Domain Transfer Tab */}
        <TabsContent value="transfer">
          <div className="space-y-6">
            {/* Request Transfer Section — visible to all */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-text-primary">Request Domain Transfer</h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    Request to shift this case from <span className="font-medium">{currentCase.domain}</span> to another domain.
                  </p>
                </div>
                {currentCase.status === "Active" && (
                  <button
                    type="button"
                    onClick={() => setTransferModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-light shadow-sm"
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                    Request Transfer
                  </button>
                )}
              </div>
            </div>

            {/* Transfer History for this case */}
            {caseTransferRequests.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-base font-semibold text-text-primary mb-4">Transfer Requests for This Case</h3>
                <div className="space-y-3">
                  {caseTransferRequests.map((req) => (
                    <div
                      key={req.id}
                      className="rounded-xl border border-border p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-text-primary">
                              {req.fromDomain}
                            </span>
                            <ArrowRightLeft className="h-3.5 w-3.5 text-text-muted" />
                            <span className="text-sm font-medium text-primary">
                              {req.toDomain}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary">
                            Requested by {req.requestedBy} on {formatDate(req.requestDate)}
                          </p>
                          <p className="text-sm text-text-secondary mt-1">{req.reason}</p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            req.status === "Pending"
                              ? "bg-amber-50 text-amber-700"
                              : req.status === "Approved"
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                      {req.reviewedBy && (
                        <div className="mt-3 border-t border-border pt-3">
                          <p className="text-xs text-text-muted">
                            {req.status} by {req.reviewedBy} on {req.reviewDate ? formatDate(req.reviewDate) : "—"}
                          </p>
                          {req.reviewNotes && (
                            <p className="text-sm text-text-secondary mt-1">{req.reviewNotes}</p>
                          )}
                        </div>
                      )}

                      {/* Manager can approve/reject pending requests */}
                      {req.status === "Pending" && isAdmin && (
                        <div className="mt-3 border-t border-border pt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setReviewRequestId(req.id);
                              setReviewModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-light transition-colors"
                          >
                            Review
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manager View: All Pending Transfers */}
            {isAdmin && allPendingRequests.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm">
                <h3 className="text-base font-semibold text-text-primary mb-1">
                  Pending Transfer Requests
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  Review and approve or reject domain transfer requests from your team.
                </p>
                <div className="space-y-3">
                  {allPendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="rounded-xl border border-border bg-white p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-text-primary">{req.caseName}</p>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-mono text-primary">{req.caseId}</span>
                            <span className="text-text-muted">|</span>
                            <span className="text-text-secondary">{req.fromDomain}</span>
                            <ArrowRightLeft className="h-3 w-3 text-text-muted" />
                            <span className="font-medium text-primary">{req.toDomain}</span>
                          </div>
                          <p className="text-xs text-text-muted">
                            By {req.requestedBy} on {formatDate(req.requestDate)}
                          </p>
                          <p className="text-sm text-text-secondary mt-1">{req.reason}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setReviewRequestId(req.id);
                              setReviewModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-light transition-colors"
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {caseTransferRequests.length === 0 && !(isAdmin && allPendingRequests.length > 0) && (
              <EmptyState
                icon={ArrowRightLeft}
                title="No Transfer Requests"
                description="No domain transfer requests have been made for this case yet."
              />
            )}
          </div>
        </TabsContent>
      </TabsRoot>

      {/* Add Milestone Modal */}
      <Modal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        title="Add Custom Milestone"
        description="Add a new milestone to this case workflow."
      >
        <form onSubmit={handleAddMilestone}>
          <div className="space-y-4">
            <div className="flex flex-col">
              <label className={labelClass}>Milestone Name</label>
              <input
                type="text"
                required
                value={newMilestoneName}
                onChange={(e) => setNewMilestoneName(e.target.value)}
                placeholder="e.g. File Rejoinder"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col">
              <label className={labelClass}>Description</label>
              <textarea
                required
                value={newMilestoneDesc}
                onChange={(e) => setNewMilestoneDesc(e.target.value)}
                placeholder="Brief description of this milestone"
                className={`${inputClass} min-h-[60px] resize-none`}
              />
            </div>
            <div className="flex flex-col">
              <label className={labelClass}>Assign To</label>
              <select
                value={newMilestoneAssignee}
                onChange={(e) => setNewMilestoneAssignee(e.target.value)}
                className="styled-select w-full"
              >
                <option value="">Default (Case Assignee)</option>
                {employeeNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="rounded-xl border px-5 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary text-white px-5 py-2.5 text-sm font-medium hover:bg-primary-light shadow-sm transition-colors"
            >
              Add Milestone
            </button>
          </div>
        </form>
      </Modal>

      {/* Block Reason Modal */}
      <Modal
        open={blockModalOpen}
        onOpenChange={setBlockModalOpen}
        title="Block Milestone"
        description="Provide a reason for blocking this milestone."
      >
        <div className="space-y-4">
          <div className="flex flex-col">
            <label className={labelClass}>Reason</label>
            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="e.g. Waiting for client documents"
              className={`${inputClass} min-h-[60px] resize-none`}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
          <button
            type="button"
            onClick={() => { setBlockModalOpen(false); setBlockReason(""); }}
            className="rounded-xl border px-5 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleBlock}
            disabled={!blockReason.trim()}
            className="rounded-xl bg-danger text-white px-5 py-2.5 text-sm font-medium hover:bg-red-600 shadow-sm transition-colors disabled:opacity-50"
          >
            Block Milestone
          </button>
        </div>
      </Modal>

      {/* Notes Modal */}
      <Modal
        open={notesModalOpen}
        onOpenChange={setNotesModalOpen}
        title="Milestone Notes"
        description="Add or update notes for this milestone."
      >
        <div className="space-y-4">
          <div className="flex flex-col">
            <label className={labelClass}>Notes</label>
            <textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              placeholder="Add notes about progress, decisions, etc."
              className={`${inputClass} min-h-[80px] resize-none`}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
          <button
            type="button"
            onClick={() => { setNotesModalOpen(false); setNotesValue(""); }}
            className="rounded-xl border px-5 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveNotes}
            className="rounded-xl bg-primary text-white px-5 py-2.5 text-sm font-medium hover:bg-primary-light shadow-sm transition-colors"
          >
            Save Notes
          </button>
        </div>
      </Modal>

      {/* Transfer Request Modal */}
      <Modal
        open={transferModalOpen}
        onOpenChange={setTransferModalOpen}
        title="Request Domain Transfer"
        description={`Transfer this case from ${currentCase.domain} to another domain.`}
      >
        <form onSubmit={handleTransferRequest}>
          <div className="space-y-4">
            <div className="flex flex-col">
              <label className={labelClass}>Current Domain</label>
              <div className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text-secondary">
                {currentCase.domain}
              </div>
            </div>
            <div className="flex flex-col">
              <label className={labelClass}>Transfer To</label>
              <select
                required
                value={transferDomain}
                onChange={(e) => setTransferDomain(e.target.value)}
                className="styled-select w-full"
              >
                <option value="" disabled>Select target domain</option>
                {allDomains.filter((d) => d !== currentCase.domain).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className={labelClass}>Reason for Transfer</label>
              <textarea
                required
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="Explain why this case should be transferred..."
                className={`${inputClass} min-h-[80px] resize-none`}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <button
              type="button"
              onClick={() => { setTransferModalOpen(false); setTransferDomain(""); setTransferReason(""); }}
              className="rounded-xl border px-5 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-5 py-2.5 text-sm font-medium hover:bg-primary-light shadow-sm transition-colors"
            >
              <Send className="h-4 w-4" />
              Submit Request
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Transfer Modal */}
      <Modal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        title="Review Transfer Request"
        description="Approve or reject this domain transfer request."
      >
        <div className="space-y-4">
          <div className="flex flex-col">
            <label className={labelClass}>Review Notes <span className="text-text-muted font-normal">(optional)</span></label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add notes about your decision..."
              className={`${inputClass} min-h-[60px] resize-none`}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
          <button
            type="button"
            onClick={() => handleReviewDecision("Rejected")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-danger text-danger px-5 py-2.5 text-sm font-medium hover:bg-red-50 transition-colors"
          >
            <X className="h-4 w-4" />
            Reject
          </button>
          <button
            type="button"
            onClick={() => handleReviewDecision("Approved")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-success text-white px-5 py-2.5 text-sm font-medium hover:bg-green-600 shadow-sm transition-colors"
          >
            <Check className="h-4 w-4" />
            Approve
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ---- Helper sub-components ---- */

function InfoCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-text-muted">{label}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between border-b border-border py-2 last:border-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-sm font-medium text-text-primary">{value}</span>
    </div>
  );
}
