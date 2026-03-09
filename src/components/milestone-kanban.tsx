"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  Circle,
  PlayCircle,
  CheckCircle2,
  Ban,
  User,
  Calendar,
  Clock,
  FileText,
  ChevronRight,
  SkipForward,
  Trash2,
  Plus,
  UserPlus,
} from "lucide-react";
import type { CaseMilestone, MilestoneStatus } from "@/types";
import { formatDate } from "@/lib/utils";

/* ---- Column definitions ---- */
const columns: {
  id: MilestoneStatus;
  label: string;
  color: string;
  dotBg: string;
  headerBg: string;
  dropBg: string;
}[] = [
  {
    id: "Not Started",
    label: "Not Started",
    color: "text-gray-600",
    dotBg: "bg-gray-300",
    headerBg: "bg-gray-100",
    dropBg: "bg-gray-50/80",
  },
  {
    id: "In Progress",
    label: "In Progress",
    color: "text-blue-700",
    dotBg: "bg-primary",
    headerBg: "bg-blue-100",
    dropBg: "bg-blue-50/80",
  },
  {
    id: "Completed",
    label: "Completed",
    color: "text-green-700",
    dotBg: "bg-success",
    headerBg: "bg-green-100",
    dropBg: "bg-green-50/80",
  },
  {
    id: "Blocked",
    label: "Blocked",
    color: "text-red-700",
    dotBg: "bg-danger",
    headerBg: "bg-red-100",
    dropBg: "bg-red-50/80",
  },
];

interface MilestoneKanbanProps {
  milestones: CaseMilestone[];
  canManage: boolean;
  isAdmin: boolean;
  employeeNames: string[];
  onStatusChange: (milestoneId: string, newStatus: MilestoneStatus) => void;
  onAdvance: (milestone: CaseMilestone) => void;
  onBlock: (milestoneId: string) => void;
  onUnblock: (milestoneId: string) => void;
  onSkip: (milestone: CaseMilestone) => void;
  onRemove: (milestone: CaseMilestone) => void;
  onEditNotes: (milestoneId: string, currentNotes: string) => void;
  onAssign: (milestoneId: string, assignee: string) => void;
  onAdd: () => void;
}

export function MilestoneKanban({
  milestones,
  canManage,
  isAdmin,
  employeeNames,
  onStatusChange,
  onAdvance,
  onBlock,
  onUnblock,
  onSkip,
  onRemove,
  onEditNotes,
  onAssign,
  onAdd,
}: MilestoneKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Assign modal state (local to kanban)
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTargetId, setAssignTargetId] = useState("");
  const [assignSearch, setAssignSearch] = useState("");

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverId(event.over?.id as string | null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      setOverId(null);
      const { active, over } = event;
      if (!over || !canManage) return;

      const milestoneId = active.id as string;
      const targetId = over.id as string;

      // Determine which column the item was dropped on
      const targetColumn = columns.find((c) => c.id === targetId);
      if (!targetColumn) return;

      const milestone = milestones.find((m) => m.id === milestoneId);
      if (!milestone || milestone.status === targetColumn.id) return;

      onStatusChange(milestoneId, targetColumn.id);
    },
    [canManage, milestones, onStatusChange]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setOverId(null);
  }, []);

  // Persist scroll position across renders
  const scrollRef = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleOpenAssign = useCallback((milestoneId: string) => {
    scrollRef.current = window.scrollY;
    setAssignTargetId(milestoneId);
    setAssignSearch("");
    setAssignModalOpen(true);
  }, []);

  // Focus search input without scrolling after modal opens
  useEffect(() => {
    if (assignModalOpen && searchInputRef.current) {
      searchInputRef.current.focus({ preventScroll: true });
    }
  }, [assignModalOpen]);

  const handleAssignSelect = useCallback(
    (name: string) => {
      const y = scrollRef.current;
      onAssign(assignTargetId, name);
      setAssignModalOpen(false);
      setAssignTargetId("");
      // Restore scroll on next frames to beat React re-render scroll reset
      requestAnimationFrame(() => {
        window.scrollTo({ top: y, behavior: "instant" });
        requestAnimationFrame(() => {
          window.scrollTo({ top: y, behavior: "instant" });
        });
      });
    },
    [assignTargetId, onAssign]
  );

  const handleAssignClose = useCallback(() => {
    const y = scrollRef.current;
    setAssignModalOpen(false);
    requestAnimationFrame(() => {
      window.scrollTo({ top: y, behavior: "instant" });
    });
  }, []);

  const filteredEmployees = employeeNames.filter((n) =>
    n.toLowerCase().includes(assignSearch.toLowerCase())
  );

  const assignTarget = milestones.find((m) => m.id === assignTargetId);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {/* Responsive: horizontal scroll on mobile, grid on large screens */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 overflow-visible">
          {columns.map((col) => {
            const colMilestones = milestones
              .filter((m) => m.status === col.id)
              .sort((a, b) => a.order - b.order);
            const hasActiveCard = !!activeId && colMilestones.some((m) => m.id === activeId);

            return (
              <KanbanColumn
                key={col.id}
                column={col}
                milestones={colMilestones}
                canManage={canManage}
                isAdmin={isAdmin}
                isOver={overId === col.id}
                isDragging={!!activeId}
                hasActiveCard={hasActiveCard}
                onAdvance={onAdvance}
                onBlock={onBlock}
                onUnblock={onUnblock}
                onSkip={onSkip}
                onRemove={onRemove}
                onEditNotes={onEditNotes}
                onOpenAssign={handleOpenAssign}
                onAdd={onAdd}
              />
            );
          })}
        </div>

      </DndContext>

      {/* Assign Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleAssignClose}
            onMouseDown={(e) => e.preventDefault()}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-white p-6 shadow-xl mx-4">
            <h3 className="text-base font-semibold text-text-primary">
              Assign Milestone
            </h3>
            {assignTarget && (
              <p className="mt-1 text-sm text-text-secondary">
                {assignTarget.name}
              </p>
            )}

            {/* Search */}
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search team members..."
              value={assignSearch}
              onChange={(e) => setAssignSearch(e.target.value)}
              className="mt-4 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm focus:border-primary-light focus:ring-2 focus:ring-primary-50 outline-none transition-all"
            />

            {/* Employee list */}
            <div className="mt-3 max-h-52 overflow-y-auto space-y-1">
              {filteredEmployees.length === 0 ? (
                <p className="py-4 text-center text-sm text-text-muted">
                  No matching team members
                </p>
              ) : (
                filteredEmployees.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleAssignSelect(name)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-left transition-colors ${
                      assignTarget?.assignedTo === name
                        ? "bg-primary-50 text-primary font-medium"
                        : "text-text-primary hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary">
                      {name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <span>{name}</span>
                    {assignTarget?.assignedTo === name && (
                      <CheckCircle2 className="ml-auto h-4 w-4 text-primary" />
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="mt-4 flex justify-end border-t border-border pt-4">
              <button
                type="button"
                onClick={handleAssignClose}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---- Droppable Column ---- */
function KanbanColumn({
  column,
  milestones,
  canManage,
  isAdmin,
  isOver,
  isDragging,
  hasActiveCard,
  onAdvance,
  onBlock,
  onUnblock,
  onSkip,
  onRemove,
  onEditNotes,
  onOpenAssign,
  onAdd,
}: {
  column: (typeof columns)[number];
  milestones: CaseMilestone[];
  canManage: boolean;
  isAdmin: boolean;
  isOver: boolean;
  isDragging: boolean;
  hasActiveCard: boolean;
  onAdvance: (m: CaseMilestone) => void;
  onBlock: (id: string) => void;
  onUnblock: (id: string) => void;
  onSkip: (m: CaseMilestone) => void;
  onRemove: (m: CaseMilestone) => void;
  onEditNotes: (id: string, notes: string) => void;
  onOpenAssign: (id: string) => void;
  onAdd?: () => void;
}) {
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      style={hasActiveCard ? { zIndex: 1000, position: "relative" } : undefined}
      className={`flex flex-col rounded-xl border-2 transition-colors duration-200 ${
        isOver
          ? "border-primary shadow-md " + column.dropBg
          : isDragging
          ? "border-dashed border-border/80 bg-background"
          : "border-border bg-background"
      }`}
    >
      {/* Column header */}
      <div
        className={`flex items-center justify-between rounded-t-[10px] px-4 py-3 ${column.headerBg}`}
      >
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${column.dotBg}`} />
          <span className={`text-sm font-semibold ${column.color}`}>
            {column.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/80 px-1.5 text-xs font-medium text-text-secondary">
            {milestones.length}
          </span>
          {onAdd && isAdmin && (
            <button
              type="button"
              onClick={onAdd}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-white/80 text-text-muted hover:bg-white hover:text-primary transition-colors"
              title="Add milestone"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Cards area */}
      <div className="flex flex-1 flex-col gap-2.5 p-2.5 min-h-[140px] overflow-visible">
        {milestones.map((m) => (
          <DraggableCard
            key={m.id}
            milestone={m}
            canManage={canManage}
            isAdmin={isAdmin}
            onAdvance={onAdvance}
            onBlock={onBlock}
            onUnblock={onUnblock}
            onSkip={onSkip}
            onRemove={onRemove}
            onEditNotes={onEditNotes}
            onOpenAssign={onOpenAssign}
          />
        ))}
        {milestones.length === 0 && (
          <div
            className={`flex flex-1 items-center justify-center rounded-xl border-2 border-dashed py-10 text-xs transition-colors ${
              isOver
                ? "border-primary/40 text-primary bg-primary-50/30"
                : "border-border/50 text-text-muted"
            }`}
          >
            {isDragging ? "Drop here" : "No milestones"}
          </div>
        )}
        {/* Add task button at bottom of every column */}
        {canManage && onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/60 py-2 text-xs font-medium text-text-muted hover:border-primary/40 hover:text-primary hover:bg-primary-50/30 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Task
          </button>
        )}
      </div>
    </div>
  );
}

/* ---- Draggable Card Wrapper ---- */
function DraggableCard({
  milestone,
  canManage,
  isAdmin,
  onAdvance,
  onBlock,
  onUnblock,
  onSkip,
  onRemove,
  onEditNotes,
  onOpenAssign,
}: {
  milestone: CaseMilestone;
  canManage: boolean;
  isAdmin: boolean;
  onAdvance: (m: CaseMilestone) => void;
  onBlock: (id: string) => void;
  onUnblock: (id: string) => void;
  onSkip: (m: CaseMilestone) => void;
  onRemove: (m: CaseMilestone) => void;
  onEditNotes: (id: string, notes: string) => void;
  onOpenAssign: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: milestone.id, disabled: !canManage });

  const style: React.CSSProperties = {
    ...(transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          zIndex: 999,
        }
      : {}),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${canManage ? "cursor-grab active:cursor-grabbing" : ""} ${
        isDragging
          ? "relative z-50 [&>div]:shadow-2xl [&>div]:ring-2 [&>div]:ring-primary/20 [&>div]:scale-[1.03] [&>div]:-rotate-1"
          : ""
      }`}
      {...(canManage ? { ...attributes, ...listeners } : {})}
    >
      <MilestoneCard
        milestone={milestone}
        canManage={canManage}
        isAdmin={isAdmin}
        onAdvance={onAdvance}
        onBlock={onBlock}
        onUnblock={onUnblock}
        onSkip={onSkip}
        onRemove={onRemove}
        onEditNotes={onEditNotes}
        onOpenAssign={onOpenAssign}
      />
    </div>
  );
}

/* ---- Card ---- */
function MilestoneCard({
  milestone: m,
  canManage,
  isAdmin,
  onAdvance,
  onBlock,
  onUnblock,
  onSkip,
  onRemove,
  onEditNotes,
  onOpenAssign,
}: {
  milestone: CaseMilestone;
  canManage: boolean;
  isAdmin: boolean;
  onAdvance?: (m: CaseMilestone) => void;
  onBlock?: (id: string) => void;
  onUnblock?: (id: string) => void;
  onSkip?: (m: CaseMilestone) => void;
  onRemove?: (m: CaseMilestone) => void;
  onEditNotes?: (id: string, notes: string) => void;
  onOpenAssign?: (id: string) => void;
}) {
  const statusIcon: Record<MilestoneStatus, typeof Circle> = {
    "Not Started": Circle,
    "In Progress": PlayCircle,
    Completed: CheckCircle2,
    Blocked: Ban,
    Skipped: SkipForward,
  };
  const StatusIcon = statusIcon[m.status];

  return (
    <div className="rounded-xl border border-border bg-white p-3.5 shadow-sm transition-all select-none hover:shadow-md">
      {/* Card header — step + status */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-medium text-text-muted tabular-nums">
          Step {m.order}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
              m.status === "Completed"
                ? "bg-success-bg text-success"
                : m.status === "In Progress"
                ? "bg-primary-50 text-primary"
                : m.status === "Blocked"
                ? "bg-danger-bg text-danger"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            <StatusIcon className="h-3 w-3" />
            {m.status}
          </span>
        </div>
      </div>

      {/* Title & description */}
      <h4 className="mt-2 text-sm font-semibold text-text-primary leading-snug">
        {m.name}
      </h4>
      {m.description && (
        <p className="mt-1 text-xs text-text-secondary line-clamp-2 leading-relaxed">
          {m.description}
        </p>
      )}

      {/* Assignee chip */}
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-50 text-[10px] font-semibold text-primary">
            {m.assignedTo
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)}
          </div>
          <span className="text-xs text-text-secondary">{m.assignedTo}</span>
        </div>
        {canManage && onOpenAssign && (
          <button
            type="button"
            onClick={() => onOpenAssign(m.id)}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-text-muted hover:bg-primary-50 hover:text-primary hover:border-primary/30 transition-colors"
            title="Reassign"
          >
            <UserPlus className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Dates */}
      {(m.startDate || m.dueDate || m.completedDate) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-muted">
          {m.startDate && m.status !== "Completed" && (
            <span className="flex items-center gap-0.5">
              <Calendar className="h-3 w-3" />
              {formatDate(m.startDate)}
            </span>
          )}
          {m.dueDate && m.status !== "Completed" && (
            <span className="flex items-center gap-0.5 text-warning">
              <Clock className="h-3 w-3" />
              Due {formatDate(m.dueDate)}
            </span>
          )}
          {m.completedDate && (
            <span className="flex items-center gap-0.5 text-success">
              <CheckCircle2 className="h-3 w-3" />
              {formatDate(m.completedDate)}
            </span>
          )}
        </div>
      )}

      {/* Blocked reason */}
      {m.blockedReason && (
        <div className="mt-2 rounded-lg bg-danger-bg px-2.5 py-1.5 text-[11px] text-danger leading-relaxed">
          {m.blockedReason}
        </div>
      )}

      {/* Notes */}
      {m.notes && (
        <div className="mt-2 rounded-lg bg-[#F1F5F9] px-2.5 py-1.5 text-[11px] text-text-secondary line-clamp-2 leading-relaxed">
          {m.notes}
        </div>
      )}

      {/* Actions */}
      {canManage && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-2.5">
          {(m.status === "Not Started" || m.status === "In Progress") &&
            onAdvance && (
              <button
                type="button"
                onClick={() => onAdvance(m)}
                className="inline-flex items-center gap-0.5 rounded-lg bg-primary-50 px-2.5 py-1.5 text-[11px] font-medium text-primary hover:bg-primary hover:text-white transition-colors"
              >
                <ChevronRight className="h-3 w-3" />
                {m.status === "Not Started" ? "Start" : "Complete"}
              </button>
            )}
          {m.status === "Blocked" && onUnblock && (
            <button
              type="button"
              onClick={() => onUnblock(m.id)}
              className="inline-flex items-center gap-0.5 rounded-lg bg-success-bg px-2.5 py-1.5 text-[11px] font-medium text-success hover:bg-success hover:text-white transition-colors"
            >
              <PlayCircle className="h-3 w-3" />
              Unblock
            </button>
          )}
          {m.status === "In Progress" && onBlock && (
            <button
              type="button"
              onClick={() => onBlock(m.id)}
              className="rounded-lg border border-danger-bg p-1.5 text-danger hover:bg-danger-bg transition-colors"
              title="Block"
            >
              <Ban className="h-3 w-3" />
            </button>
          )}
          {m.status === "Not Started" && onSkip && (
            <button
              type="button"
              onClick={() => onSkip(m)}
              className="rounded-lg border border-border p-1.5 text-text-muted hover:bg-gray-50 transition-colors"
              title="Skip"
            >
              <SkipForward className="h-3 w-3" />
            </button>
          )}
          {onEditNotes && (
            <button
              type="button"
              onClick={() => onEditNotes(m.id, m.notes ?? "")}
              className="rounded-lg border border-border p-1.5 text-text-muted hover:bg-gray-50 transition-colors"
              title="Notes"
            >
              <FileText className="h-3 w-3" />
            </button>
          )}
          {isAdmin && m.status === "Not Started" && onRemove && (
            <button
              type="button"
              onClick={() => onRemove(m)}
              className="ml-auto rounded-lg border border-danger-bg p-1.5 text-danger hover:bg-danger-bg transition-colors"
              title="Remove"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
