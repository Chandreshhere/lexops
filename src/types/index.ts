// ============ CASES ============
export type Domain =
  | "TNCP"
  | "IMC"
  | "IDA"
  | "Litigation"
  | "Revenue"
  | "Financial Services"
  | "RERA";

export type CaseStatus = "Active" | "On Hold" | "Closed" | "Withdrawn";
export type StageStatus = "Pending" | "In Progress" | "Awaiting Response" | "Completed";
export type Priority = "Normal" | "High" | "Urgent";

export interface Case {
  id: string;
  clientId: string;
  clientName: string;
  domain: Domain;
  caseType: string;
  assignedTo: string;
  coAssigned?: string;
  currentStage: string;
  stageStatus: StageStatus;
  nextActionDate: string;
  nextHearingDate?: string;
  feeAgreed: number;
  amountReceived: number;
  amountOutstanding: number;
  priority: Priority;
  status: CaseStatus;
  createdDate: string;
  lastUpdated: string;
  notes?: string;
}

export interface CaseStage {
  id: string;
  name: string;
  status: StageStatus;
  completedDate?: string;
  assignedTo: string;
  notes?: string;
}

export interface Hearing {
  id: string;
  caseId: string;
  caseTitle: string;
  clientName: string;
  date: string;
  court: string;
  purpose: string;
  outcome?: string;
  nextDate?: string;
  advocate: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: "created" | "document" | "hearing" | "stage" | "payment" | "communication";
  user: string;
}

// ============ CLIENTS ============
export type ClientType = "Individual" | "Company" | "Partnership" | "Trust";
export type LeadStage =
  | "New Enquiry"
  | "Consultation Scheduled"
  | "Consultation Done"
  | "Proposal Sent"
  | "Negotiation"
  | "Converted"
  | "Lost";

export interface Client {
  id: string;
  name: string;
  clientType: ClientType;
  phone: string;
  email?: string;
  address?: string;
  source: string;
  referredBy?: string;
  clientSince: string;
  relationshipManager: string;
  tags: string[];
  activeCases: number;
  totalCases: number;
  outstandingAmount: number;
  totalPaid: number;
}

export interface CommunicationLog {
  id: string;
  clientId: string;
  type: "Call" | "WhatsApp" | "Email" | "In-Person" | "Video Call";
  date: string;
  summary: string;
  followUpRequired: boolean;
  followUpDate?: string;
}

export interface WhatsAppMessage {
  id: string;
  clientId: string;
  direction: "incoming" | "outgoing";
  message: string;
  timestamp: string;
  status?: "sent" | "delivered" | "read";
}

// ============ FINANCE ============
export type InvoiceStatus = "Paid" | "Pending" | "Overdue" | "Partially Paid" | "Cancelled";
export type PaymentMode = "Cash" | "UPI" | "Bank Transfer" | "Cheque";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  caseId: string;
  amount: number;
  paidAmount: number;
  gstAmount: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  description: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  mode: PaymentMode;
  date: string;
  reference?: string;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  paidBy: string;
  caseId?: string;
  receipt?: string;
  type: "Client Disbursement" | "Office Expense";
}

// ============ EMPLOYEES ============
export type Designation = string; // Domain-specific: "Litigation Associate", "RERA Senior Associate", etc.

export type Department =
  | "Litigation"
  | "TNCP"
  | "IDA"
  | "IMC"
  | "Revenue"
  | "RERA"
  | "Financial Services"
  | "Admin";

export type TaskStatus = "To Do" | "In Progress" | "Done";

export interface Employee {
  id: string;
  name: string;
  designation: Designation;
  department: Department;
  dateOfJoining: string;
  phone: string;
  email: string;
  qualification: string;
  barCouncilNumber?: string;
  reportingTo: string;
  activeCases: number;
  pendingTasks: number;
  avatar?: string;
}

export interface Task {
  id: string;
  title: string;
  caseId?: string;
  assignedBy: string;
  assignedTo: string;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
}

export interface LeaveRecord {
  id: string;
  employeeId: string;
  type: "Casual" | "Sick" | "Earned";
  startDate: string;
  endDate: string;
  status: "Approved" | "Pending" | "Rejected";
  reason: string;
}

// ============ MILESTONES ============
export type MilestoneStatus = "Not Started" | "In Progress" | "Completed" | "Blocked" | "Skipped";

export interface MilestoneDefinition {
  id: string;
  name: string;
  description: string;
  order: number;
  estimatedDays?: number;
}

export interface DomainMilestoneTemplate {
  domain: Domain;
  milestones: MilestoneDefinition[];
}

export interface CaseMilestone {
  id: string;
  caseId: string;
  name: string;
  description: string;
  order: number;
  status: MilestoneStatus;
  assignedTo: string;
  startDate?: string;
  dueDate?: string;
  completedDate?: string;
  notes?: string;
  blockedReason?: string;
}

// ============ DOMAIN TRANSFER ============
export type TransferStatus = "Pending" | "Approved" | "Rejected";

export interface DomainTransferRequest {
  id: string;
  caseId: string;
  caseName: string;
  fromDomain: Domain;
  toDomain: Domain;
  requestedBy: string;
  reason: string;
  status: TransferStatus;
  requestDate: string;
  reviewedBy?: string;
  reviewDate?: string;
  reviewNotes?: string;
}

// ============ DASHBOARD ============
export interface DashboardStats {
  activeCases: number;
  revenueThisMonth: number;
  hearingsToday: number;
  pendingTasks: number;
  activeCasesTrend: number;
  revenueTrend: number;
  hearingsTrend: number;
  tasksTrend: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}
