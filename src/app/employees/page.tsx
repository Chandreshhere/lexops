"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import gsap from "gsap";

import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { employees } from "@/services/mock-data";
import { formatDate, getInitials } from "@/lib/utils";
import { useToastStore } from "@/store/toast-store";
import { useAuthStore } from "@/store/auth-store";
import type { Employee, Department } from "@/types";

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

/* ---------- columns ---------- */

const columns: ColumnDef<Employee>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const emp = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary">
            {getInitials(emp.name)}
          </div>
          <div>
            <p className="font-medium text-text-primary">{emp.name}</p>
            <p className="text-xs text-text-muted">{emp.designation}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "department",
    header: "Department",
    cell: ({ row }) => {
      const dept = row.original.department;
      return (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${deptColors[dept] ?? "bg-slate-100 text-slate-600"}`}
        >
          {dept}
        </span>
      );
    },
  },
  {
    accessorKey: "activeCases",
    header: "Active Cases",
    cell: ({ row }) => (
      <span className="block text-center tabular-nums">
        {row.original.activeCases}
      </span>
    ),
  },
  {
    accessorKey: "pendingTasks",
    header: "Pending Tasks",
    cell: ({ row }) => {
      const count = row.original.pendingTasks;
      return (
        <span
          className={`tabular-nums ${count > 5 ? "font-semibold text-warning" : ""}`}
        >
          {count}
        </span>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-xs text-text-secondary">
        {row.original.email}
      </span>
    ),
  },
  {
    accessorKey: "dateOfJoining",
    header: "Joined",
    cell: ({ row }) => (
      <span className="text-sm text-text-secondary">
        {formatDate(row.original.dateOfJoining)}
      </span>
    ),
  },
];

/* ---------- form options ---------- */

const designations = [
  "Managing Partner",
  "Litigation Associate",
  "RERA Senior Associate",
  "TNCP Associate",
  "IMC Associate",
  "IDA Associate",
  "Revenue Associate",
  "Financial Services Associate",
  "Accountant",
];

const departments: Department[] = [
  "Litigation",
  "TNCP",
  "IDA",
  "IMC",
  "Revenue",
  "RERA",
  "Financial Services",
  "Admin",
];

const employeeNames = employees.map((e) => e.name);

const inputClass =
  "w-full rounded-xl border-[1.5px] border-border bg-card px-4 py-2.5 text-sm text-text-primary shadow-sm placeholder:text-text-muted outline-none transition-all hover:border-primary-light/40 focus:border-primary-light focus:shadow-[0_0_0_3px_rgb(37_99_235/0.12)]";
const labelClass = "text-sm font-medium text-text-primary mb-1.5";

/* ---------- page ---------- */

export default function EmployeesPage() {
  const router = useRouter();
  const pageRef = useRef<HTMLDivElement>(null);
  const addToast = useToastStore((s) => s.addToast);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const user = useAuthStore((s) => s.user);
  const canManageEmployees = hasPermission("canManageEmployees");
  const canViewAll = hasPermission("canViewAllCases");

  // Domain-based employee filtering: associates only see employees in their domain
  const filteredEmployees = useMemo(() => {
    if (canViewAll || canManageEmployees) return employees;
    if (!user) return [];

    const userDept = user.department;
    if (userDept && userDept !== "Admin") {
      return employees.filter(
        (e) => e.department === userDept || e.department === "Admin"
      );
    }

    return employees;
  }, [canViewAll, canManageEmployees, user]);

  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesignation, setFormDesignation] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formQualification, setFormQualification] = useState("");
  const [formBarCouncil, setFormBarCouncil] = useState("");
  const [formDateOfJoining, setFormDateOfJoining] = useState("");
  const [formReportingTo, setFormReportingTo] = useState("");

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
    setFormDesignation("");
    setFormDepartment("");
    setFormPhone("");
    setFormEmail("");
    setFormQualification("");
    setFormBarCouncil("");
    setFormDateOfJoining("");
    setFormReportingTo("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({
      type: "success",
      title: "Employee Added",
      description: `${formName} has been added to the team.`,
    });
    resetForm();
    setModalOpen(false);
  };

  // Accountants don't have access to the Employees module
  if (user && user.role === "accountant") {
    return (
      <div ref={pageRef} className="space-y-6">
        <PageHeader title="Employees" />
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-xl border border-border bg-card p-6">
          <div className="rounded-full bg-orange-50 p-4">
            <Plus className="h-10 w-10 text-orange-500" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-text-primary">Access Restricted</h2>
          <p className="mt-1 text-sm text-text-secondary">
            You do not have permission to view the Employees module.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="space-y-6">
      <PageHeader
        title="Employees"
        action={
          <div className="relative group">
            <button
              type="button"
              onClick={() => canManageEmployees && setModalOpen(true)}
              disabled={!canManageEmployees}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm transition-colors ${
                canManageEmployees
                  ? "bg-primary text-white hover:bg-primary-light"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </button>
            {!canManageEmployees && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                You don&apos;t have permission to add employees
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800" />
              </div>
            )}
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={filteredEmployees}
        searchKey="name"
        searchPlaceholder="Search employees..."
        onRowClick={(emp) => router.push(`/employees/${emp.id}`)}
      />

      {/* Add Employee Modal */}
      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Add New Employee"
        description="Enter the employee details below."
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
              <label className={labelClass}>Designation</label>
              <select
                required
                value={formDesignation}
                onChange={(e) => setFormDesignation(e.target.value)}
                className="styled-select w-full"
              >
                <option value="" disabled>
                  Select designation
                </option>
                {designations.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className={labelClass}>Department</label>
              <select
                required
                value={formDepartment}
                onChange={(e) => setFormDepartment(e.target.value)}
                className="styled-select w-full"
              >
                <option value="" disabled>
                  Select department
                </option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
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
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="employee@lexops.in"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col">
              <label className={labelClass}>Qualification</label>
              <input
                type="text"
                required
                value={formQualification}
                onChange={(e) => setFormQualification(e.target.value)}
                placeholder="e.g. LLB, LLM"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col">
              <label className={labelClass}>
                Bar Council Number{" "}
                <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={formBarCouncil}
                onChange={(e) => setFormBarCouncil(e.target.value)}
                placeholder="e.g. MP/1234/2024"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col">
              <label className={labelClass}>Date of Joining</label>
              <input
                type="date"
                required
                value={formDateOfJoining}
                onChange={(e) => setFormDateOfJoining(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2 flex flex-col">
              <label className={labelClass}>Reporting To</label>
              <select
                required
                value={formReportingTo}
                onChange={(e) => setFormReportingTo(e.target.value)}
                className="styled-select w-full"
              >
                <option value="" disabled>
                  Select reporting manager
                </option>
                {employeeNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
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
              Add Employee
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
