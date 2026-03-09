"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import gsap from "gsap";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  SlidersHorizontal,
  Calendar,
  Download,
  Search,
  Headset,
  LayoutGrid,
  Plus,
  MoreHorizontal,
  Scale,
  ChevronDown,
} from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { useAuthStore } from "@/store/auth-store";
import { useToastStore } from "@/store/toast-store";
import { getInitials } from "@/lib/utils";
import { employees } from "@/services/mock-data";

/* ================================================================== */
/* Mock chart data                                                     */
/* ================================================================== */

const caseReportData = [
  { name: "Jan", pending: 12, resolved: 8 },
  { name: "Feb", pending: 18, resolved: 14 },
  { name: "Mar", pending: 24, resolved: 20 },
  { name: "Apr", pending: 15, resolved: 22 },
];

const caseSuccessData = [
  { name: "Mon", value: 72 },
  { name: "Tue", value: 78 },
  { name: "Wed", value: 74 },
  { name: "Thu", value: 85 },
];

const caseHealthData = [
  { name: "Jan", progress: 30, recovery: 18 },
  { name: "Feb", progress: 45, recovery: 28 },
  { name: "Mar", progress: 38, recovery: 35 },
  { name: "Apr", progress: 55, recovery: 42 },
  { name: "May", progress: 48, recovery: 50 },
  { name: "Jun", progress: 60, recovery: 45 },
];

const teamMembers = [
  { name: "Priya Mehta", dept: "Managing Partner", color: "bg-primary-light" },
  { name: "Rohan Gupta", dept: "RERA Senior Associate", color: "bg-success" },
  { name: "Anil Verma", dept: "Litigation Associate", color: "bg-warning" },
];

const domainOptions = [
  "Litigation",
  "RERA",
  "TNCP",
  "IMC",
  "IDA",
  "Revenue",
  "Financial Services",
];

/* ================================================================== */
/* Custom Tooltips                                                     */
/* ================================================================== */

function CaseHealthTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-lg">
      <p className="mb-1 text-xs font-semibold text-text-primary">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs text-text-secondary">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span className="capitalize">{p.dataKey}:</span>
          <span className="font-medium text-text-primary">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
/* Animated counter hook                                               */
/* ================================================================== */

function useAnimatedCounter(target: number, duration = 1.2) {
  const [count, setCount] = useState(0);
  const ref = useRef({ val: 0 });

  useEffect(() => {
    const obj = ref.current;
    obj.val = 0;
    gsap.to(obj, {
      val: target,
      duration,
      ease: "power2.out",
      onUpdate: () => setCount(Math.round(obj.val)),
    });
  }, [target, duration]);

  return count;
}

/* ================================================================== */
/* Main Dashboard                                                      */
/* ================================================================== */

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const addToast = useToastStore((s) => s.addToast);

  const cardsRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    domain: "",
    caseType: "",
    assignedTo: "",
    priority: "Normal",
    feeAgreed: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const successRate = useAnimatedCounter(85);

  if (!user) return null;

  const firstName = user.name.split(" ")[0];

  /* ---------- GSAP animations ---------- */

  useEffect(() => {
    if (!cardsRef.current) return;

    const cards = cardsRef.current.querySelectorAll("[data-card]");
    gsap.fromTo(
      cards,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.08,
        ease: "power3.out",
        duration: 0.6,
      }
    );

    if (featuredRef.current) {
      gsap.fromTo(
        featuredRef.current,
        { scale: 1.0 },
        {
          scale: 1.02,
          duration: 0.4,
          ease: "power2.out",
          yoyo: true,
          repeat: 1,
          delay: 0.5,
        }
      );
    }
  }, []);

  /* ---------- Form handlers ---------- */

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    if (!formData.clientName.trim()) errors.clientName = "Client name is required";
    if (!formData.domain) errors.domain = "Domain is required";
    if (!formData.caseType.trim()) errors.caseType = "Case type is required";
    if (!formData.assignedTo) errors.assignedTo = "Assigned to is required";
    if (!formData.feeAgreed || Number(formData.feeAgreed) <= 0)
      errors.feeAgreed = "Valid fee is required";
    return errors;
  }, [formData]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }
      setFormErrors({});
      addToast({ type: "success", title: "Case created successfully" });
      setModalOpen(false);
      setFormData({
        clientName: "",
        domain: "",
        caseType: "",
        assignedTo: "",
        priority: "Normal",
        feeAgreed: "",
      });
    },
    [validateForm, addToast]
  );

  const updateField = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  /* ---------- Render ---------- */

  return (
    <div ref={cardsRef} className="space-y-6">
      {/* ================================================================== */}
      {/* GREETING HEADER ROW                                                 */}
      {/* ================================================================== */}
      <div data-card className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">
          Good Morning, {firstName}!
        </h1>
        {hasPermission("canManageCases") && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-primary-light hover:shadow-xl active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            New Case
          </button>
        )}
      </div>

      {/* ================================================================== */}
      {/* FILTER BAR ROW                                                      */}
      {/* ================================================================== */}
      <div data-card className="flex items-center justify-between">
        {/* Left: filter pills */}
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-text-secondary shadow-sm transition-colors hover:bg-primary-50 hover:text-primary">
            <SlidersHorizontal className="h-4 w-4" />
            Filter
          </button>
          <button className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-text-secondary shadow-sm transition-colors hover:bg-primary-50 hover:text-primary">
            <Calendar className="h-4 w-4" />
            Monthly
            <ChevronDown className="h-3 w-3" />
          </button>
          <button className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-text-secondary shadow-sm transition-colors hover:bg-primary-50 hover:text-primary">
            <Download className="h-4 w-4" />
            Download Data
          </button>
        </div>

        {/* Right: icon buttons */}
        <div className="flex items-center gap-2">
          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-colors hover:bg-primary-50 hover:text-primary">
            <Search className="h-4 w-4 text-text-secondary" />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-colors hover:bg-primary-50 hover:text-primary">
            <Headset className="h-4 w-4 text-text-secondary" />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-colors hover:bg-primary-50 hover:text-primary">
            <LayoutGrid className="h-4 w-4 text-text-secondary" />
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* FIRST ROW — 4 CARDS                                                 */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {/* ---- Card 1: Case Report Pending ---- */}
        <div
          data-card
          className="rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">
              Case Report Pending
            </h3>
            <span className="rounded-full border border-primary-200 px-3 py-0.5 text-xs font-medium text-primary-light">
              Report
            </span>
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-success" />
              <span className="text-xs text-text-secondary">15 Report</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-primary-light" />
              <span className="text-xs text-text-secondary">10 No Report</span>
            </div>
          </div>

          {/* Line Chart */}
          <div className="mt-3 h-30">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={caseReportData}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  ticks={[10, 20, 30]}
                />
                <ReferenceLine
                  x="Mar"
                  stroke="var(--text-muted)"
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                />
                <Line
                  type="monotone"
                  dataKey="pending"
                  stroke="#16A34A"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ---- Card 2: Featured Info Card ---- */}
        <div
          data-card
          ref={featuredRef}
          className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#1E3A8A] to-[#2563EB] p-5 text-white shadow-sm"
        >
          {/* Decorative circle overlay */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />

          {/* Top row */}
          <div className="relative flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/60 bg-white/10">
              <Scale className="h-4 w-4" />
            </div>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              Today&apos;s info
            </span>
          </div>

          {/* Content */}
          <div className="relative mt-5">
            <h3 className="text-lg font-bold">News From The Firm</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/80">
              Our process is designed to make case management, consultations, and
              hearings easy and efficient for you.
            </p>
          </div>

          {/* Carousel dots */}
          <div className="relative mt-6 flex items-center gap-1.5">
            <span className="h-2 w-6 rounded-full bg-white" />
            <span className="h-2 w-2 rounded-full bg-white/40" />
            <span className="h-2 w-2 rounded-full bg-white/40" />
          </div>
        </div>

        {/* ---- Card 3: Case Success Rate ---- */}
        <div
          data-card
          className="rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">
              Case Success Rate
            </h3>
            <button className="text-text-muted transition-colors hover:text-text-secondary">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          {/* Big number + badge */}
          <div className="mt-3 flex items-end gap-2">
            <span className="text-4xl font-bold text-text-primary">
              {successRate}%
            </span>
            <span className="mb-1 rounded-full bg-success-bg px-2.5 py-0.5 text-xs font-medium text-success">
              +0.75%
            </span>
          </div>

          {/* Small Area Chart */}
          <div className="mt-3 h-20">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={caseSuccessData}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fill="url(#successGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ---- Card 4: Hearing Progress ---- */}
        <div
          data-card
          className="rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">
              Hearing Progress
            </h3>
            <button className="text-text-muted transition-colors hover:text-text-secondary">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          {/* Progress items */}
          <div className="mt-4 space-y-5">
            {/* Item 1 */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50">
                  <Calendar className="h-4 w-4 text-primary-light" />
                </div>
                <span className="text-sm font-medium text-text-primary">
                  22 March, 2026
                </span>
              </div>
              <div className="ml-12 h-2 w-full overflow-hidden rounded-full bg-primary-50">
                <div
                  className="h-full rounded-full bg-primary-light transition-all"
                  style={{ width: "70%" }}
                />
              </div>
            </div>

            {/* Item 2 */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50">
                  <Calendar className="h-4 w-4 text-primary-light" />
                </div>
                <span className="text-sm font-medium text-text-primary">
                  16 March, 2026
                </span>
              </div>
              <div className="ml-12 h-2 w-full overflow-hidden rounded-full bg-primary-50">
                <div
                  className="h-full rounded-full bg-primary-light transition-all"
                  style={{ width: "45%" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* SECOND ROW — 3 CARDS                                                */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* ---- Card 1: Client Information ---- */}
        {hasPermission("canViewClients") && (
        <div
          data-card
          className="rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">
              Client Information
            </h3>
            <span className="cursor-pointer rounded-full border border-primary-200 px-3 py-0.5 text-xs font-medium text-primary-light transition-colors hover:bg-primary-50">
              See Details
            </span>
          </div>

          {/* Avatar + Name */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-white">
              {getInitials("Rajesh Sharma")}
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Rajesh Sharma</p>
              <p className="text-xs text-text-secondary">Client</p>
            </div>
          </div>

          {/* QR Code placeholder */}
          <div className="mx-auto my-4 flex h-16 w-16 items-center justify-center rounded-xl border border-border bg-background">
            <div className="grid grid-cols-4 gap-0.5">
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-1.5 rounded-[1px] ${
                    [0, 1, 3, 4, 5, 7, 8, 11, 12, 14, 15].includes(i)
                      ? "bg-text-primary"
                      : "bg-transparent"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-background px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
                Case History
              </p>
              <p className="mt-0.5 text-xs font-semibold text-text-primary">
                3 Active Cases
              </p>
            </div>
            <div className="rounded-xl bg-background px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
                Current Stage
              </p>
              <p className="mt-0.5 text-xs font-semibold text-text-primary">
                Evidence Stage
              </p>
            </div>
            <div className="rounded-xl bg-background px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
                Domain
              </p>
              <p className="mt-0.5 text-xs font-semibold text-text-primary">
                Litigation
              </p>
            </div>
            <div className="rounded-xl bg-background px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
                Primary Lawyer
              </p>
              <p className="mt-0.5 text-xs font-semibold text-text-primary">
                Anil Verma
              </p>
            </div>
          </div>
        </div>
        )}

        {/* ---- Card 2: Case Health Report ---- */}
        {hasPermission("canViewAllCases") && (
        <div
          data-card
          className="rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">
              Case Health Report
            </h3>
            <span className="cursor-pointer rounded-full border border-primary-200 px-3 py-0.5 text-xs font-medium text-primary-light transition-colors hover:bg-primary-50">
              See Details
            </span>
          </div>

          {/* Bar Chart */}
          <div className="mt-4 h-45">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={caseHealthData}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                barGap={4}
              >
                <defs>
                  <linearGradient id="progressGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={1} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="recoveryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60A5FA" stopOpacity={1} />
                    <stop offset="100%" stopColor="#60A5FA" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CaseHealthTooltip />} />
                <ReferenceLine
                  y={50}
                  stroke="var(--text-muted)"
                  strokeDasharray="3 3"
                  strokeOpacity={0.4}
                />
                <Bar
                  dataKey="progress"
                  fill="url(#progressGrad)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={16}
                />
                <Bar
                  dataKey="recovery"
                  fill="url(#recoveryGrad)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center gap-5">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary-light" />
              <span className="text-xs text-text-secondary">Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#60A5FA]" />
              <span className="text-xs text-text-secondary">Recovery</span>
            </div>
          </div>
        </div>
        )}

        {/* ---- Card 3: My Team ---- */}
        <div
          data-card
          className="rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">My Team</h3>
            <span className="cursor-pointer rounded-full border border-primary-200 px-3 py-0.5 text-xs font-medium text-primary-light transition-colors hover:bg-primary-50">
              See Details
            </span>
          </div>

          {/* Team list */}
          <div className="mt-4 space-y-4">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-background"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${member.color}`}
                >
                  {getInitials(member.name)}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {member.name}
                  </p>
                  <p className="text-xs text-text-secondary">{member.dept}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* NEW MATTER MODAL                                                    */}
      {/* ================================================================== */}
      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Create New Case"
        description="Fill in the details to open a new case."
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              Client Name
            </label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) => updateField("clientName", e.target.value)}
              className="w-full rounded-xl border-[1.5px] border-border bg-card px-4 py-2.5 text-sm text-text-primary shadow-sm placeholder:text-text-muted outline-none transition-all hover:border-primary-light/40 focus:border-primary-light focus:shadow-[0_0_0_3px_rgb(37_99_235/0.12)]"
              placeholder="Enter client name"
            />
            {formErrors.clientName && (
              <p className="mt-1 text-xs text-danger">{formErrors.clientName}</p>
            )}
          </div>

          {/* Domain */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              Domain
            </label>
            <select
              value={formData.domain}
              onChange={(e) => updateField("domain", e.target.value)}
              className="styled-select w-full"
            >
              <option value="">Select domain</option>
              {domainOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {formErrors.domain && (
              <p className="mt-1 text-xs text-danger">{formErrors.domain}</p>
            )}
          </div>

          {/* Case Type */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              Case Type
            </label>
            <input
              type="text"
              value={formData.caseType}
              onChange={(e) => updateField("caseType", e.target.value)}
              className="w-full rounded-xl border-[1.5px] border-border bg-card px-4 py-2.5 text-sm text-text-primary shadow-sm placeholder:text-text-muted outline-none transition-all hover:border-primary-light/40 focus:border-primary-light focus:shadow-[0_0_0_3px_rgb(37_99_235/0.12)]"
              placeholder="e.g., Civil Suit, Buyer Complaint"
            />
            {formErrors.caseType && (
              <p className="mt-1 text-xs text-danger">{formErrors.caseType}</p>
            )}
          </div>

          {/* Assigned To */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              Assigned To
            </label>
            <select
              value={formData.assignedTo}
              onChange={(e) => updateField("assignedTo", e.target.value)}
              className="styled-select w-full"
            >
              <option value="">Select employee</option>
              {employees
                .filter((emp) => emp.barCouncilNumber)
                .map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name}
                  </option>
                ))}
            </select>
            {formErrors.assignedTo && (
              <p className="mt-1 text-xs text-danger">{formErrors.assignedTo}</p>
            )}
          </div>

          {/* Priority + Fee row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => updateField("priority", e.target.value)}
                className="styled-select w-full"
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">
                Fee Agreed
              </label>
              <input
                type="number"
                value={formData.feeAgreed}
                onChange={(e) => updateField("feeAgreed", e.target.value)}
                className="w-full rounded-xl border-[1.5px] border-border bg-card px-4 py-2.5 text-sm text-text-primary shadow-sm placeholder:text-text-muted outline-none transition-all hover:border-primary-light/40 focus:border-primary-light focus:shadow-[0_0_0_3px_rgb(37_99_235/0.12)]"
                placeholder="Amount in INR"
                min="0"
              />
              {formErrors.feeAgreed && (
                <p className="mt-1 text-xs text-danger">{formErrors.feeAgreed}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-background"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-light"
            >
              Create Case
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
