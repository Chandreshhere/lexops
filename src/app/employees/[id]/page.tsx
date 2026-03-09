"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Mail,
  CalendarDays,
  GraduationCap,
  Scale,
  UserCheck,
  Briefcase,
  ClipboardList,
  CalendarRange,
  Clock,
} from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { employees, cases, tasks, leaveRecords } from "@/services/mock-data";
import { formatDate, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import type { Department } from "@/types";

/* ---------- department badge colours ---------- */

const deptColors: Record<Department, string> = {
  Litigation: "bg-blue-100 text-blue-700",
  TNCP: "bg-violet-100 text-violet-700",
  IDA: "bg-emerald-100 text-emerald-700",
  IMC: "bg-amber-100 text-amber-700",
  Revenue: "bg-cyan-100 text-cyan-700",
  RERA: "bg-rose-100 text-rose-700",
  "Financial Services": "bg-teal-100 text-teal-700",
  Admin: "bg-slate-100 text-slate-600",
};

const priorityColors: Record<string, string> = {
  Normal: "bg-slate-100 text-slate-600",
  High: "bg-amber-100 text-amber-700",
  Urgent: "bg-danger-bg text-danger",
};

/* ---------- info card ---------- */

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
      <div className="rounded-lg bg-primary-50 p-2">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-text-muted">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-text-primary break-all">
          {value}
        </p>
      </div>
    </div>
  );
}

/* ---------- attendance placeholder ---------- */

function AttendanceGrid() {
  const daysInMonth = 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  // Mock: weekends off, rest present
  const weekendDays = new Set([1, 2, 8, 9, 15, 16, 22, 23, 29, 30]);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          March 2026
        </h3>
        <div className="flex items-center gap-4 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-success" />
            Present
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-border" />
            Weekend / Off
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-danger" />
            Absent
          </span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="py-1 text-center text-[11px] font-medium uppercase text-text-muted"
          >
            {d}
          </div>
        ))}
        {/* March 2026 starts on Sunday (offset 0) */}
        {days.map((day) => {
          const isWeekend = weekendDays.has(day);
          // future days after 9th
          const isFuture = day > 9;
          return (
            <div
              key={day}
              className={`flex h-9 items-center justify-center rounded-md text-xs font-medium ${
                isFuture
                  ? "bg-border-light text-text-muted"
                  : isWeekend
                    ? "bg-border text-text-muted"
                    : "bg-success-bg text-success"
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const employeeId = params.id as string;

  const employee = employees.find((e) => e.id === employeeId);

  if (!employee) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/employees")}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Employees
        </button>
        <EmptyState
          icon={UserCheck}
          title="Employee not found"
          description="The employee you are looking for does not exist or has been removed."
          action={
            <button
              onClick={() => router.push("/employees")}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light"
            >
              View All Employees
            </button>
          }
        />
      </div>
    );
  }

  const employeeCases = cases.filter(
    (m) => m.assignedTo === employee.name || m.coAssigned === employee.name
  );
  const employeeTasks = tasks.filter(
    (t) => t.assignedTo === employee.name
  );
  const employeeLeaves = leaveRecords.filter(
    (l) => l.employeeId === employee.id
  );

  // Domain-based access: admin/partner see all; others see same-domain employees
  const canViewThisEmployee = (() => {
    if (!user) return false;
    if (user.role === "admin" || user.role === "partner" || hasPermission("canManageEmployees")) return true;
    if (employee.email === user.email) return true;
    const userDept = user.department;
    if (userDept && userDept !== "Admin") {
      return employee.department === userDept || employee.department === "Admin";
    }
    return true;
  })();

  if (!canViewThisEmployee) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/employees")}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Employees
        </button>
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-xl border border-border bg-card p-6">
          <div className="rounded-full bg-orange-50 p-4">
            <UserCheck className="h-10 w-10 text-orange-500" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-text-primary">Access Restricted</h2>
          <p className="mt-1 text-sm text-text-secondary">
            You do not have permission to view this employee&apos;s details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <button
        onClick={() => router.push("/employees")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Employees
      </button>

      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-50 text-lg font-bold text-primary">
            {getInitials(employee.name)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-text-primary">
              {employee.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={employee.designation} variant="primary" />
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${deptColors[employee.department]}`}
              >
                {employee.department}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoCard icon={Phone} label="Phone" value={employee.phone} />
        <InfoCard icon={Mail} label="Email" value={employee.email} />
        <InfoCard
          icon={CalendarDays}
          label="Date of Joining"
          value={formatDate(employee.dateOfJoining)}
        />
        <InfoCard
          icon={GraduationCap}
          label="Qualification"
          value={employee.qualification}
        />
        <InfoCard
          icon={Scale}
          label="Bar Council No."
          value={employee.barCouncilNumber ?? "N/A"}
        />
        <InfoCard
          icon={UserCheck}
          label="Reporting To"
          value={employee.reportingTo}
        />
      </div>

      {/* Tabs */}
      <TabsRoot defaultValue="cases">
        <TabsList>
          <TabsTrigger value="cases">
            <span className="flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" />
              Cases
              {employeeCases.length > 0 && (
                <span className="ml-1 rounded-full bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {employeeCases.length}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <span className="flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4" />
              Tasks
              {employeeTasks.length > 0 && (
                <span className="ml-1 rounded-full bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {employeeTasks.length}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger value="attendance">
            <span className="flex items-center gap-1.5">
              <CalendarRange className="h-4 w-4" />
              Attendance
            </span>
          </TabsTrigger>
          <TabsTrigger value="leave">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Leave History
            </span>
          </TabsTrigger>
        </TabsList>

        {/* ---- Cases tab ---- */}
        <TabsContent value="cases">
          {employeeCases.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No cases assigned"
              description="This employee does not have any cases assigned currently."
            />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-background">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                      Case ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                      Domain
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                      Stage
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                      Next Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {employeeCases.map((m) => (
                    <tr
                      key={m.id}
                      className="transition-colors hover:bg-primary-50/50"
                    >
                      <td className="px-4 py-3 font-medium text-primary">
                        {m.id}
                      </td>
                      <td className="px-4 py-3 text-text-primary">
                        {m.clientName}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {m.domain}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {m.currentStage}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={m.status} />
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {formatDate(m.nextActionDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ---- Tasks tab ---- */}
        <TabsContent value="tasks">
          {employeeTasks.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No tasks assigned"
              description="This employee does not have any tasks currently."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {employeeTasks.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-sm font-semibold text-text-primary">
                      {t.title}
                    </h4>
                    <StatusBadge status={t.status} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${priorityColors[t.priority]}`}
                    >
                      {t.priority}
                    </span>
                    {t.caseId && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary">
                        <Briefcase className="h-3 w-3" />
                        {t.caseId}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-text-muted">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Due {formatDate(t.dueDate)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ---- Attendance tab ---- */}
        <TabsContent value="attendance">
          <AttendanceGrid />
        </TabsContent>

        {/* ---- Leave History tab ---- */}
        <TabsContent value="leave">
          {employeeLeaves.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No leave records"
              description="No leave records found for this employee."
            />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-background">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                      From
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                      To
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                      Reason
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {employeeLeaves.map((l) => (
                    <tr
                      key={l.id}
                      className="transition-colors hover:bg-primary-50/50"
                    >
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {l.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-primary">
                        {formatDate(l.startDate)}
                      </td>
                      <td className="px-4 py-3 text-text-primary">
                        {formatDate(l.endDate)}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {l.reason}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={l.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </TabsRoot>
    </div>
  );
}
