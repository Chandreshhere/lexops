import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Domain, DomainTransferRequest, TransferStatus } from "@/types";

interface DomainTransferState {
  requests: DomainTransferRequest[];

  // Queries
  getRequestsForCase: (caseId: string) => DomainTransferRequest[];
  getPendingRequests: () => DomainTransferRequest[];
  getRequestsByUser: (userName: string) => DomainTransferRequest[];

  // Actions
  createRequest: (data: {
    caseId: string;
    caseName: string;
    fromDomain: Domain;
    toDomain: Domain;
    requestedBy: string;
    reason: string;
  }) => void;
  reviewRequest: (
    requestId: string,
    decision: "Approved" | "Rejected",
    reviewedBy: string,
    reviewNotes?: string
  ) => void;
}

export const useDomainTransferStore = create<DomainTransferState>()(
  persist(
    (set, get) => ({
      requests: [],

      getRequestsForCase: (caseId) =>
        get().requests.filter((r) => r.caseId === caseId),

      getPendingRequests: () =>
        get().requests.filter((r) => r.status === "Pending"),

      getRequestsByUser: (userName) =>
        get().requests.filter((r) => r.requestedBy === userName),

      createRequest: (data) => {
        const id = `DTR-${Date.now()}`;
        const request: DomainTransferRequest = {
          id,
          ...data,
          status: "Pending",
          requestDate: new Date().toISOString().split("T")[0],
        };
        set((state) => ({ requests: [request, ...state.requests] }));
      },

      reviewRequest: (requestId, decision, reviewedBy, reviewNotes) => {
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: decision as TransferStatus,
                  reviewedBy,
                  reviewDate: new Date().toISOString().split("T")[0],
                  reviewNotes,
                }
              : r
          ),
        }));
      },
    }),
    { name: "lexops-domain-transfers" }
  )
);
