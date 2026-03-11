"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Users,
  Briefcase,
  IndianRupee,
  Gavel,
  ClipboardList,
  AlertTriangle,
  Eye,
  X,
  Check,
} from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { useAuthStore } from "@/store/auth-store";
import { useToastStore } from "@/store/toast-store";
import { cn, getInitials, formatCurrency, formatDate } from "@/lib/utils";
import {
  employees,
  clients,
  cases,
  invoices,
  upcomingHearings,
  tasks,
} from "@/services/mock-data";

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

const domainOptions = [
  "Litigation",
  "RERA",
  "TNCP",
  "IMC",
  "IDA",
  "Revenue",
  "Financial Services",
];

const carouselSlides = [
  {
    title: "News From The Firm",
    desc: "Manage cases, consultations and hearings easily with LexOps.",
  },
  {
    title: "Upcoming Hearings",
    desc: `${upcomingHearings.length} hearings scheduled. Keep documents ready.`,
  },
  {
    title: "Payment Alerts",
    desc: `${invoices.filter((i) => i.status === "Overdue").length} overdue invoices. Follow up for timely payments.`,
  },
];

const teamColors = ["bg-primary-light", "bg-success", "bg-warning", "bg-[#60A5FA]"];

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
/* CSV download helper                                                 */
/* ================================================================== */

function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ================================================================== */
/* Main Dashboard                                                      */
/* ================================================================== */

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const addToast = useToastStore((s) => s.addToast);

  /* ---------- Refs ---------- */
  const cardsRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);
  const successMenuRef = useRef<HTMLDivElement>(null);
  const hearingMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  /* ---------- State ---------- */
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

  // Dropdowns
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("Monthly");
  const [successMenuOpen, setSuccessMenuOpen] = useState(false);
  const [hearingMenuOpen, setHearingMenuOpen] = useState(false);

  // Search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Carousel
  const [carouselIndex, setCarouselIndex] = useState(0);

  /* ---------- Animated counter ---------- */
  const successRate = useAnimatedCounter(85);

  /* ---------- Computed values ---------- */
  const filteredCases = useMemo(() => {
    if (selectedDomains.length === 0) return cases;
    return cases.filter((c) => selectedDomains.includes(c.domain));
  }, [selectedDomains]);

  const filteredClients = useMemo(() => {
    if (selectedDomains.length === 0) return clients;
    const clientIds = new Set(filteredCases.map((c) => c.clientId));
    return clients.filter((c) => clientIds.has(c.id));
  }, [selectedDomains, filteredCases]);

  const activeCasesCount = useMemo(
    () => filteredCases.filter((c) => c.status === "Active").length,
    [filteredCases]
  );
  const totalRevenue = useMemo(
    () => filteredClients.reduce((s, c) => s + c.totalPaid, 0),
    [filteredClients]
  );
  const totalOutstanding = useMemo(
    () => filteredClients.reduce((s, c) => s + c.outstandingAmount, 0),
    [filteredClients]
  );
  const hearingsCount = useMemo(() => {
    if (selectedDomains.length === 0) return upcomingHearings.length;
    return upcomingHearings.filter((h) => {
      const c = cases.find((cs) => cs.id === h.caseId);
      return c && selectedDomains.includes(c.domain);
    }).length;
  }, [selectedDomains]);
  const pendingTasksCount = useMemo(() => {
    if (selectedDomains.length === 0) return tasks.filter((t) => t.status !== "Done").length;
    return tasks.filter((t) => {
      if (t.status === "Done") return false;
      if (!t.caseId) return false;
      const c = cases.find((cs) => cs.id === t.caseId);
      return c && selectedDomains.includes(c.domain);
    }).length;
  }, [selectedDomains]);

  // Featured client (first client)
  const featuredClient = clients[0];
  const featuredClientCases = useMemo(
    () => cases.filter((c) => c.clientId === featuredClient.id),
    [featuredClient.id]
  );

  // Upcoming hearings for progress card
  const nextHearings = useMemo(() => {
    const now = new Date();
    return upcomingHearings.slice(0, 2).map((h) => {
      const d = new Date(h.date);
      const daysUntil = Math.max(0, Math.ceil((d.getTime() - now.getTime()) / 86400000));
      const progress = Math.min(95, Math.max(20, 100 - daysUntil * 2));
      return { ...h, progress, daysUntil };
    });
  }, []);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: { type: string; label: string; sub: string; href: string }[] = [];
    clients
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((c) => {
        results.push({ type: "Client", label: c.name, sub: c.clientType, href: `/clients/${c.id}` });
      });
    cases
      .filter((c) => c.clientName.toLowerCase().includes(q) || c.caseType.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((c) => {
        results.push({ type: "Case", label: `${c.id} – ${c.caseType}`, sub: c.clientName, href: `/cases/${c.id}` });
      });
    employees
      .filter((e) => e.name.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((e) => {
        results.push({ type: "Employee", label: e.name, sub: e.designation, href: `/employees/${e.id}` });
      });
    return results;
  }, [searchQuery]);

  /* ---------- Effects ---------- */

  // Click-outside for dropdowns
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (filterRef.current && !filterRef.current.contains(target)) setFilterOpen(false);
      if (periodRef.current && !periodRef.current.contains(target)) setPeriodOpen(false);
      if (successMenuRef.current && !successMenuRef.current.contains(target)) setSuccessMenuOpen(false);
      if (hearingMenuRef.current && !hearingMenuRef.current.contains(target)) setHearingMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Carousel auto-rotate
  useEffect(() => {
    const timer = setInterval(() => setCarouselIndex((i) => (i + 1) % carouselSlides.length), 5000);
    return () => clearInterval(timer);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // GSAP animations
  useEffect(() => {
    if (!cardsRef.current) return;
    const cards = cardsRef.current.querySelectorAll("[data-card]");
    gsap.fromTo(
      cards,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.08, ease: "power3.out", duration: 0.6 }
    );
    if (featuredRef.current) {
      gsap.fromTo(
        featuredRef.current,
        { scale: 1.0 },
        { scale: 1.02, duration: 0.4, ease: "power2.out", yoyo: true, repeat: 1, delay: 0.5 }
      );
    }
  }, []);

  /* ---------- Early return ---------- */
  if (!user) return null;
  const firstName = user.name.split(" ")[0];
  const isAdminOrPartner = user.role === "admin" || user.role === "partner";

  /* ---------- Handlers ---------- */

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.clientName.trim()) errors.clientName = "Client name is required";
    if (!formData.domain) errors.domain = "Domain is required";
    if (!formData.caseType.trim()) errors.caseType = "Case type is required";
    if (!formData.assignedTo) errors.assignedTo = "Assigned to is required";
    if (!formData.feeAgreed || Number(formData.feeAgreed) <= 0)
      errors.feeAgreed = "Valid fee is required";
    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
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
  };

  const updateField = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const toggleDomain = (domain: string) => {
    setSelectedDomains((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]
    );
  };

  const handleDownload = () => {
    const headers = [
      "Case ID", "Client", "Domain", "Case Type", "Status", "Stage",
      "Priority", "Assigned To", "Fee Agreed", "Received", "Outstanding",
      "Next Hearing", "Created Date",
    ];
    const rows = cases.map((c) => [
      c.id, c.clientName, c.domain, c.caseType, c.status, c.currentStage,
      c.priority, c.assignedTo, c.feeAgreed, c.amountReceived, c.amountOutstanding,
      c.nextHearingDate ?? "N/A", c.createdDate,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    downloadCSV(`lexops-cases-${new Date().toISOString().split("T")[0]}.csv`, csv);
    addToast({ type: "success", title: "Dashboard data downloaded" });
  };

  const handleExportChart = (chartName: string) => {
    let csv = "";
    if (chartName === "case-success") {
      csv = "Day,Success Rate\n" + caseSuccessData.map((d) => `${d.name},${d.value}`).join("\n");
    } else if (chartName === "hearing-progress") {
      csv = "Case,Date,Court,Purpose,Advocate\n" + upcomingHearings.map((h) => `"${h.caseTitle}","${h.date}","${h.court}","${h.purpose}","${h.advocate}"`).join("\n");
    } else if (chartName === "case-health") {
      csv = "Month,Progress,Recovery\n" + caseHealthData.map((d) => `${d.name},${d.progress},${d.recovery}`).join("\n");
    }
    downloadCSV(`lexops-${chartName}-${new Date().toISOString().split("T")[0]}.csv`, csv);
    addToast({ type: "success", title: `${chartName.replace(/-/g, " ")} data exported` });
  };

  const navigateAndClose = (href: string) => {
    router.push(href);
    setSearchOpen(false);
    setSearchQuery("");
  };

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
      {/* QUICK STATS ROW (admin & partner only)                               */}
      {/* ================================================================== */}
      {isAdminOrPartner && <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div data-card className="overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-text-primary">{filteredClients.length}</p>
          <p className="text-xs text-text-muted">Total Clients</p>
        </div>
        <div data-card className="overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
            <Briefcase className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-text-primary">{activeCasesCount}</p>
          <p className="text-xs text-text-muted">Active Cases</p>
        </div>
        <div data-card className="overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
            <IndianRupee className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-3 truncate text-lg font-bold text-success">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-text-muted">Revenue</p>
        </div>
        <div data-card className="overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <p className="mt-3 truncate text-lg font-bold text-danger">{formatCurrency(totalOutstanding)}</p>
          <p className="text-xs text-text-muted">Outstanding</p>
        </div>
        <div data-card className="overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
            <Gavel className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-text-primary">{hearingsCount}</p>
          <p className="text-xs text-text-muted">Hearings</p>
        </div>
        <div data-card className="overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
            <ClipboardList className="h-4 w-4 text-violet-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-text-primary">{pendingTasksCount}</p>
          <p className="text-xs text-text-muted">Pending Tasks</p>
        </div>
      </div>}

      {/* ================================================================== */}
      {/* FILTER BAR ROW (admin & partner only)                               */}
      {/* ================================================================== */}
      {isAdminOrPartner && <div data-card className="relative z-20 flex items-center justify-between gap-4">
        {searchOpen ? (
          /* ---- Search mode ---- */
          <div className="relative flex-1">
            <div className="flex items-center gap-2 rounded-full border-2 border-primary/30 bg-card px-4 py-2 shadow-sm">
              <Search className="h-4 w-4 shrink-0 text-primary" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSearchOpen(false);
                    setSearchQuery("");
                  }
                  if (e.key === "Enter" && searchResults.length > 0) {
                    navigateAndClose(searchResults[0].href);
                  }
                }}
                placeholder="Search cases, clients, employees..."
                className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="shrink-0 rounded-full p-1 transition-colors hover:bg-background"
              >
                <X className="h-4 w-4 text-text-muted" />
              </button>
            </div>
            {searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-xl">
                {searchResults.length > 0 ? (
                  searchResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => navigateAndClose(r.href)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-primary-50"
                    >
                      <span className="shrink-0 rounded-md bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        {r.type}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text-primary">{r.label}</p>
                        <p className="truncate text-xs text-text-muted">{r.sub}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-text-muted">
                    No results found for &quot;{searchQuery}&quot;
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ---- Normal filter bar ---- */
          <>
            <div className="flex items-center gap-3">
              {/* Filter dropdown */}
              <div ref={filterRef} className="relative">
                <button
                  onClick={() => {
                    setFilterOpen(!filterOpen);
                    setPeriodOpen(false);
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm shadow-sm transition-colors",
                    selectedDomains.length > 0
                      ? "border-primary bg-primary-50 text-primary"
                      : "border-border bg-card text-text-secondary hover:bg-primary-50 hover:text-primary"
                  )}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filter
                  {selectedDomains.length > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                      {selectedDomains.length}
                    </span>
                  )}
                </button>
                {filterOpen && (
                  <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-card py-2 shadow-xl">
                    <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Filter by Domain
                    </p>
                    {domainOptions.map((domain) => (
                      <button
                        key={domain}
                        onClick={() => toggleDomain(domain)}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-primary-50 hover:text-primary"
                      >
                        <div
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                            selectedDomains.includes(domain)
                              ? "border-primary bg-primary"
                              : "border-border"
                          )}
                        >
                          {selectedDomains.includes(domain) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        {domain}
                      </button>
                    ))}
                    {selectedDomains.length > 0 && (
                      <div className="mt-1 border-t border-border px-4 pt-2">
                        <button
                          onClick={() => {
                            setSelectedDomains([]);
                            setFilterOpen(false);
                          }}
                          className="w-full rounded-lg py-1.5 text-xs font-medium text-danger transition-colors hover:bg-red-50"
                        >
                          Clear All Filters
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Monthly dropdown */}
              <div ref={periodRef} className="relative">
                <button
                  onClick={() => {
                    setPeriodOpen(!periodOpen);
                    setFilterOpen(false);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-text-secondary shadow-sm transition-colors hover:bg-primary-50 hover:text-primary"
                >
                  <Calendar className="h-4 w-4" />
                  {selectedPeriod}
                  <ChevronDown
                    className={cn("h-3 w-3 transition-transform", periodOpen && "rotate-180")}
                  />
                </button>
                {periodOpen && (
                  <div className="absolute left-0 top-full z-50 mt-2 w-40 rounded-xl border border-border bg-card py-1 shadow-xl">
                    {["Weekly", "Monthly", "Quarterly", "Yearly"].map((period) => (
                      <button
                        key={period}
                        onClick={() => {
                          setSelectedPeriod(period);
                          setPeriodOpen(false);
                          addToast({ type: "info", title: `Viewing ${period.toLowerCase()} data` });
                        }}
                        className={cn(
                          "flex w-full items-center px-4 py-2 text-sm transition-colors hover:bg-primary-50 hover:text-primary",
                          period === selectedPeriod
                            ? "font-semibold text-primary"
                            : "text-text-secondary"
                        )}
                      >
                        {period}
                        {period === selectedPeriod && (
                          <Check className="ml-auto h-4 w-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Download Data */}
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-text-secondary shadow-sm transition-colors hover:bg-primary-50 hover:text-primary"
              >
                <Download className="h-4 w-4" />
                Download Data
              </button>
            </div>

            {/* Right: icon buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                title="Search"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-colors hover:bg-primary-50 hover:text-primary"
              >
                <Search className="h-4 w-4 text-text-secondary" />
              </button>
              <button
                onClick={() => router.push("/ai")}
                title="AI Assistant"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-colors hover:bg-primary-50 hover:text-primary"
              >
                <Headset className="h-4 w-4 text-text-secondary" />
              </button>
              <button
                onClick={() => router.push("/cases")}
                title="View All Cases"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-colors hover:bg-primary-50 hover:text-primary"
              >
                <LayoutGrid className="h-4 w-4 text-text-secondary" />
              </button>
            </div>
          </>
        )}
      </div>}

      {/* ================================================================== */}
      {/* FIRST ROW — 4 CARDS (admin & partner only)                          */}
      {/* ================================================================== */}
      {isAdminOrPartner && <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
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
              <span className="text-xs text-text-secondary">
                {cases.filter((c) => c.status === "Active").length} Report
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-primary-light" />
              <span className="text-xs text-text-secondary">
                {cases.filter((c) => c.status !== "Active").length} No Report
              </span>
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

        {/* ---- Card 2: Featured Info Card (Carousel) ---- */}
        <div
          data-card
          ref={featuredRef}
          className="relative flex flex-col overflow-hidden rounded-2xl bg-linear-to-br from-[#1E3A8A] to-[#2563EB] p-5 text-white shadow-sm"
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

          {/* Content — fixed height so card doesn't resize on slide change */}
          <div className="relative mt-5 h-[72px] overflow-hidden">
            <h3 className="text-lg font-bold">{carouselSlides[carouselIndex].title}</h3>
            <p className="mt-1 line-clamp-2 text-sm leading-snug text-white/80">
              {carouselSlides[carouselIndex].desc}
            </p>
          </div>

          {/* Carousel dots — clickable */}
          <div className="relative mt-auto flex items-center gap-1.5 pt-4">
            {carouselSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCarouselIndex(i)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === carouselIndex ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                )}
              />
            ))}
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
            {/* 3-dots menu */}
            <div ref={successMenuRef} className="relative">
              <button
                onClick={() => {
                  setSuccessMenuOpen(!successMenuOpen);
                  setHearingMenuOpen(false);
                }}
                className="rounded-lg p-1 text-text-muted transition-colors hover:bg-background hover:text-text-secondary"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
              {successMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-border bg-card py-1 shadow-xl">
                  <button
                    onClick={() => {
                      router.push("/cases");
                      setSuccessMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-primary-50 hover:text-primary"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                  <button
                    onClick={() => {
                      handleExportChart("case-success");
                      setSuccessMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-primary-50 hover:text-primary"
                  >
                    <Download className="h-4 w-4" />
                    Export Data
                  </button>
                </div>
              )}
            </div>
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
          className="overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">
              Hearing Progress
            </h3>
            {/* 3-dots menu */}
            <div ref={hearingMenuRef} className="relative">
              <button
                onClick={() => {
                  setHearingMenuOpen(!hearingMenuOpen);
                  setSuccessMenuOpen(false);
                }}
                className="rounded-lg p-1 text-text-muted transition-colors hover:bg-background hover:text-text-secondary"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
              {hearingMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-border bg-card py-1 shadow-xl">
                  <button
                    onClick={() => {
                      router.push("/cases");
                      setHearingMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-primary-50 hover:text-primary"
                  >
                    <Eye className="h-4 w-4" />
                    View All Hearings
                  </button>
                  <button
                    onClick={() => {
                      handleExportChart("hearing-progress");
                      setHearingMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-primary-50 hover:text-primary"
                  >
                    <Download className="h-4 w-4" />
                    Export Data
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Progress items — real data, FIXED overflow */}
          <div className="mt-4 space-y-5">
            {nextHearings.map((hearing) => (
              <div key={hearing.id} className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50">
                    <Calendar className="h-4 w-4 text-primary-light" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-text-primary">
                      {formatDate(hearing.date)}
                    </span>
                    <span className="block truncate text-xs text-text-muted">
                      {hearing.caseTitle}
                    </span>
                  </div>
                </div>
                {/* Progress bar — flex layout prevents overflow */}
                <div className="flex items-center gap-3">
                  <div className="w-9 shrink-0" />
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-primary-50">
                    <div
                      className="h-full rounded-full bg-primary-light transition-all"
                      style={{ width: `${hearing.progress}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-xs font-medium text-text-muted">
                    {hearing.progress}%
                  </span>
                </div>
              </div>
            ))}
            {nextHearings.length === 0 && (
              <p className="py-4 text-center text-sm text-text-muted">No upcoming hearings</p>
            )}
          </div>
        </div>
      </div>}

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
              <Link
                href={`/clients/${featuredClient.id}`}
                className="rounded-full border border-primary-200 px-3 py-0.5 text-xs font-medium text-primary-light transition-colors hover:bg-primary-50"
              >
                See Details
              </Link>
            </div>

            {/* Avatar + Name */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-white">
                {getInitials(featuredClient.name)}
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{featuredClient.name}</p>
                <p className="text-xs text-text-secondary">{featuredClient.clientType}</p>
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

            {/* Details grid — real data */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-background px-3 py-2.5">
                <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
                  Case History
                </p>
                <p className="mt-0.5 text-xs font-semibold text-text-primary">
                  {featuredClientCases.filter((c) => c.status === "Active").length} Active Cases
                </p>
              </div>
              <div className="rounded-xl bg-background px-3 py-2.5">
                <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
                  Current Stage
                </p>
                <p className="mt-0.5 truncate text-xs font-semibold text-text-primary">
                  {featuredClientCases[0]?.currentStage ?? "N/A"}
                </p>
              </div>
              <div className="rounded-xl bg-background px-3 py-2.5">
                <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
                  Domain
                </p>
                <p className="mt-0.5 text-xs font-semibold text-text-primary">
                  {featuredClientCases[0]?.domain ?? "N/A"}
                </p>
              </div>
              <div className="rounded-xl bg-background px-3 py-2.5">
                <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
                  Primary Lawyer
                </p>
                <p className="mt-0.5 truncate text-xs font-semibold text-text-primary">
                  {featuredClientCases[0]?.assignedTo ?? "N/A"}
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
              <Link
                href="/reports"
                className="rounded-full border border-primary-200 px-3 py-0.5 text-xs font-medium text-primary-light transition-colors hover:bg-primary-50"
              >
                See Details
              </Link>
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
            <Link
              href="/employees"
              className="rounded-full border border-primary-200 px-3 py-0.5 text-xs font-medium text-primary-light transition-colors hover:bg-primary-50"
            >
              See Details
            </Link>
          </div>

          {/* Team list — real data */}
          <div className="mt-4 space-y-4">
            {employees.slice(0, 4).map((emp, i) => (
              <Link
                key={emp.id}
                href={`/employees/${emp.id}`}
                className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-background"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${teamColors[i % teamColors.length]}`}
                >
                  {getInitials(emp.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {emp.name}
                  </p>
                  <p className="truncate text-xs text-text-secondary">{emp.designation}</p>
                </div>
              </Link>
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
