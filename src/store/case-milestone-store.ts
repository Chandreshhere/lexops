import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CaseMilestone, Domain, MilestoneStatus } from "@/types";
import { caseMilestones as initialMilestones, getMilestoneTemplate } from "@/services/mock-data";

interface CaseMilestoneState {
  milestones: CaseMilestone[];

  // Queries
  getCaseMilestones: (caseId: string) => CaseMilestone[];
  getMilestoneProgress: (caseId: string) => { completed: number; total: number; percentage: number; currentMilestone: string };

  // Actions — admin
  initializeCaseMilestones: (caseId: string, domain: Domain, assignedTo: string) => void;
  addMilestone: (milestone: CaseMilestone) => void;
  removeMilestone: (milestoneId: string) => void;
  reorderMilestones: (caseId: string, orderedIds: string[]) => void;

  // Actions — employee & admin
  updateMilestone: (milestoneId: string, data: Partial<CaseMilestone>) => void;
  advanceMilestone: (milestoneId: string) => void;
  blockMilestone: (milestoneId: string, reason: string) => void;
  skipMilestone: (milestoneId: string) => void;
}

function nextStatus(current: MilestoneStatus): MilestoneStatus {
  switch (current) {
    case "Not Started":
      return "In Progress";
    case "In Progress":
      return "Completed";
    default:
      return current;
  }
}

const today = () => new Date().toISOString().split("T")[0];

export const useCaseMilestoneStore = create<CaseMilestoneState>()(
  persist(
    (set, get) => ({
      milestones: initialMilestones,

      getCaseMilestones: (caseId) =>
        get()
          .milestones.filter((m) => m.caseId === caseId)
          .sort((a, b) => a.order - b.order),

      getMilestoneProgress: (caseId) => {
        const ms = get().getCaseMilestones(caseId);
        const total = ms.length;
        const completed = ms.filter((m) => m.status === "Completed" || m.status === "Skipped").length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        const current = ms.find((m) => m.status === "In Progress") ?? ms.find((m) => m.status === "Not Started");
        return { completed, total, percentage, currentMilestone: current?.name ?? "All Complete" };
      },

      initializeCaseMilestones: (caseId, domain, assignedTo) => {
        const template = getMilestoneTemplate(domain);
        if (template.length === 0) return;
        const existing = get().milestones.filter((m) => m.caseId === caseId);
        if (existing.length > 0) return; // already initialized
        const newMilestones: CaseMilestone[] = template.map((t, i) => ({
          id: `CM-${caseId}-${String(i + 1).padStart(2, "0")}`,
          caseId,
          name: t.name,
          description: t.description,
          order: t.order,
          status: i === 0 ? "In Progress" : "Not Started",
          assignedTo,
          startDate: i === 0 ? today() : undefined,
        }));
        set((state) => ({ milestones: [...state.milestones, ...newMilestones] }));
      },

      addMilestone: (milestone) =>
        set((state) => ({ milestones: [...state.milestones, milestone] })),

      removeMilestone: (milestoneId) =>
        set((state) => ({
          milestones: state.milestones.filter((m) => m.id !== milestoneId),
        })),

      reorderMilestones: (caseId, orderedIds) =>
        set((state) => ({
          milestones: state.milestones.map((m) => {
            if (m.caseId !== caseId) return m;
            const newOrder = orderedIds.indexOf(m.id);
            return newOrder >= 0 ? { ...m, order: newOrder + 1 } : m;
          }),
        })),

      updateMilestone: (milestoneId, data) =>
        set((state) => ({
          milestones: state.milestones.map((m) =>
            m.id === milestoneId ? { ...m, ...data } : m
          ),
        })),

      advanceMilestone: (milestoneId) =>
        set((state) => ({
          milestones: state.milestones.map((m) => {
            if (m.id !== milestoneId) return m;
            const newSt = nextStatus(m.status);
            return {
              ...m,
              status: newSt,
              startDate: newSt === "In Progress" ? m.startDate ?? today() : m.startDate,
              completedDate: newSt === "Completed" ? today() : m.completedDate,
            };
          }),
        })),

      blockMilestone: (milestoneId, reason) =>
        set((state) => ({
          milestones: state.milestones.map((m) =>
            m.id === milestoneId ? { ...m, status: "Blocked" as MilestoneStatus, blockedReason: reason } : m
          ),
        })),

      skipMilestone: (milestoneId) =>
        set((state) => ({
          milestones: state.milestones.map((m) =>
            m.id === milestoneId ? { ...m, status: "Skipped" as MilestoneStatus, completedDate: today() } : m
          ),
        })),
    }),
    { name: "lexops-case-milestones" }
  )
);
