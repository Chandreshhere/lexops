"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import {
  Scale,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Briefcase,
  FileText,
  Calculator,
  Users,
  IndianRupee,
  ChevronRight,
  ChevronDown,
  Loader2,
} from "lucide-react";

import {
  useAuthStore,
  roleLabels,
  type UserRole,
} from "@/store/auth-store";
import { useToastStore } from "@/store/toast-store";
import { cn } from "@/lib/utils";

/* ================================================================== */
/* Role config                                                         */
/* ================================================================== */

interface RoleConfig {
  icon: React.ComponentType<{ className?: string }>;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

const roleConfig: Record<UserRole, RoleConfig> = {
  admin: {
    icon: Shield,
    bgClass: "bg-purple-100",
    textClass: "text-purple-600",
    borderClass: "border-purple-300",
  },
  partner: {
    icon: Briefcase,
    bgClass: "bg-blue-100",
    textClass: "text-blue-600",
    borderClass: "border-blue-300",
  },
  associate: {
    icon: Scale,
    bgClass: "bg-teal-100",
    textClass: "text-teal-600",
    borderClass: "border-teal-300",
  },
  paralegal: {
    icon: FileText,
    bgClass: "bg-amber-100",
    textClass: "text-amber-600",
    borderClass: "border-amber-300",
  },
  accountant: {
    icon: Calculator,
    bgClass: "bg-emerald-100",
    textClass: "text-emerald-600",
    borderClass: "border-emerald-300",
  },
};

const demoCredentials: { role: string; authRole: UserRole; name: string; email: string; password: string }[] = [
  { role: "Managing Partner", authRole: "admin", name: "Priya Mehta", email: "priya@lexops.in", password: "admin123" },
  { role: "RERA Senior Associate", authRole: "partner", name: "Rohan Gupta", email: "rohan@lexops.in", password: "partner123" },
  { role: "TNCP Associate", authRole: "associate", name: "Sneha Patel", email: "sneha@lexops.in", password: "associate123" },
  { role: "Litigation Associate", authRole: "associate", name: "Anil Verma", email: "anil@lexops.in", password: "associate123" },
  { role: "Financial Services Associate", authRole: "associate", name: "Rahul Tiwari", email: "rahul@lexops.in", password: "associate123" },
  { role: "IDA Associate", authRole: "associate", name: "Meera Sharma", email: "meera@lexops.in", password: "associate123" },
  { role: "IMC Associate", authRole: "associate", name: "Vikash Singh", email: "vikash@lexops.in", password: "associate123" },
  { role: "Revenue Associate", authRole: "associate", name: "Deepak Rawat", email: "deepak@lexops.in", password: "associate123" },
  { role: "Accountant", authRole: "accountant", name: "Sanjay Kushwaha", email: "sanjay@lexops.in", password: "accountant123" },
];

/* ================================================================== */
/* Feature cards for left panel                                        */
/* ================================================================== */

const features = [
  {
    icon: Briefcase,
    title: "Case Management",
    description: "Track cases, hearings, and deadlines with ease.",
  },
  {
    icon: Users,
    title: "Client CRM",
    description: "Manage client relationships and communication.",
  },
  {
    icon: IndianRupee,
    title: "Finance Tracking",
    description: "Invoices, payments, and financial reporting.",
  },
];

/* ================================================================== */
/* Login Page                                                          */
/* ================================================================== */

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const addToast = useToastStore((s) => s.addToast);

  // Tab state
  const [activeTab, setActiveTab] = useState<"email" | "quick">("email");

  // Email form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Quick login state
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  // Demo credentials collapse
  const [showCredentials, setShowCredentials] = useState(false);

  // Refs for GSAP
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const featureCardsRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const formCardRef = useRef<HTMLDivElement>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const blob3Ref = useRef<HTMLDivElement>(null);

  /* ---------- Mount animations ---------- */

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Left panel stagger
    tl.fromTo(
      logoRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6 }
    )
      .fromTo(
        taglineRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        "-=0.3"
      )
      .fromTo(
        descriptionRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        "-=0.3"
      );

    // Feature cards stagger
    if (featureCardsRef.current) {
      const cards = featureCardsRef.current.querySelectorAll("[data-feature]");
      tl.fromTo(
        cards,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1 },
        "-=0.2"
      );
    }

    // Right panel card
    gsap.fromTo(
      formCardRef.current,
      { x: 40, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.7, ease: "power3.out", delay: 0.3 }
    );

    // Floating blob animations
    const blobs = [blob1Ref.current, blob2Ref.current, blob3Ref.current];
    const durations = [4, 5, 3.5];
    const distances = [15, -12, 10];

    blobs.forEach((blob, i) => {
      if (blob) {
        gsap.to(blob, {
          y: distances[i],
          duration: durations[i],
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
    });
  }, []);

  /* ---------- Tab switch animation ---------- */

  useEffect(() => {
    if (tabContentRef.current) {
      gsap.fromTo(
        tabContentRef.current,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
      );
    }
  }, [activeTab]);

  /* ---------- Error shake ---------- */

  const shakeForm = useCallback(() => {
    if (formCardRef.current) {
      gsap.fromTo(
        formCardRef.current,
        { x: 0 },
        {
          keyframes: [
            { x: -10, duration: 0.07 },
            { x: 10, duration: 0.07 },
            { x: -8, duration: 0.07 },
            { x: 8, duration: 0.07 },
            { x: -4, duration: 0.07 },
            { x: 4, duration: 0.07 },
            { x: 0, duration: 0.07 },
          ],
          ease: "power2.out",
        }
      );
    }
  }, []);

  /* ---------- Email login handler ---------- */

  const handleEmailLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setIsLoading(true);

      // Simulate brief network delay for polish
      await new Promise((r) => setTimeout(r, 600));

      const result = login(email, password);

      if (result.success) {
        addToast({
          type: "success",
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
        router.push("/");
      } else {
        setError(result.error || "Invalid email or password");
        shakeForm();
        setIsLoading(false);
      }
    },
    [email, password, login, addToast, router, shakeForm]
  );

  /* ---------- Quick login handler ---------- */

  const handleQuickLogin = useCallback(
    (cred: { name: string; email: string; password: string; role: string }) => {
      setSelectedEmail(cred.email);
      const result = login(cred.email, cred.password);
      if (result.success) {
        addToast({
          type: "success",
          title: "Welcome back!",
          description: `Signed in as ${cred.name} (${cred.role}).`,
        });
        router.push("/");
      }
    },
    [login, addToast, router]
  );

  /* ---------- Render ---------- */

  return (
    <div className="flex min-h-screen">
      {/* ================================================================ */}
      {/* LEFT PANEL — Decorative gradient (hidden on mobile)              */}
      {/* ================================================================ */}
      <div
        ref={leftPanelRef}
        className="relative hidden w-[60%] overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#2563EB] lg:flex lg:flex-col lg:justify-between"
      >
        {/* Decorative blobs */}
        <div
          ref={blob1Ref}
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5 blur-xl"
        />
        <div
          ref={blob2Ref}
          className="pointer-events-none absolute -bottom-12 left-20 h-48 w-48 rounded-full bg-white/10 blur-lg"
        />
        <div
          ref={blob3Ref}
          className="pointer-events-none absolute right-1/3 top-1/2 h-32 w-32 rounded-full bg-white/5 blur-md"
        />

        {/* Extra subtle decorative elements */}
        <div className="pointer-events-none absolute left-10 top-1/4 h-20 w-20 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute bottom-1/3 right-16 h-16 w-16 rounded-full border border-white/5" />

        {/* Content */}
        <div className="relative z-10 flex flex-1 flex-col justify-center px-12 xl:px-16">
          {/* Logo */}
          <div ref={logoRef} className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm">
              <Scale className="h-6 w-6 text-white" />
            </div>
            <span className="text-3xl font-bold tracking-tight text-white">
              LexOps
            </span>
          </div>

          {/* Tagline */}
          <div ref={taglineRef} className="mt-6">
            <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
              Legal Operations
              <br />
              <span className="text-blue-300">Platform</span>
            </h1>
          </div>

          {/* Description */}
          <p
            ref={descriptionRef}
            className="mt-5 max-w-lg text-lg leading-relaxed text-white/70"
          >
            Streamline your firm&apos;s entire operation — cases, clients,
            finance, and team — all in one place.
          </p>
        </div>

        {/* Feature cards at bottom */}
        <div ref={featureCardsRef} className="relative z-10 px-12 pb-12 xl:px-16">
          <div className="grid grid-cols-3 gap-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  data-feature
                  className="rounded-2xl bg-white/5 p-4 backdrop-blur-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                    <Icon className="h-5 w-5 text-white/90" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/50">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* RIGHT PANEL — Login form                                         */}
      {/* ================================================================ */}
      <div
        ref={rightPanelRef}
        className="flex w-full items-center justify-center bg-background px-4 py-8 sm:px-8 lg:w-[40%]"
      >
        <div
          ref={formCardRef}
          className="w-full max-w-md rounded-3xl bg-card p-8 shadow-2xl"
        >
          {/* Mobile logo (hidden on desktop) */}
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
              <Scale className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-text-primary">LexOps</span>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-xl bg-background p-1">
            <button
              onClick={() => setActiveTab("email")}
              className={cn(
                "flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                activeTab === "email"
                  ? "bg-card text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              Email Login
            </button>
            <button
              onClick={() => setActiveTab("quick")}
              className={cn(
                "flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                activeTab === "quick"
                  ? "bg-card text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              Quick Login
            </button>
          </div>

          {/* Tab content */}
          <div ref={tabContentRef} key={activeTab} className="mt-6">
            {activeTab === "email" ? (
              /* ============================================ */
              /* Email Login Tab                              */
              /* ============================================ */
              <div>
                <h2 className="text-2xl font-bold text-text-primary">
                  Welcome Back
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Sign in to your LexOps account
                </p>

                <form onSubmit={handleEmailLogin} className="mt-6 space-y-4">
                  {/* Email */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError("");
                        }}
                        className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light/20"
                        placeholder="Enter your email"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (error) setError("");
                        }}
                        className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-12 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light/20"
                        placeholder="Enter your password"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember me + Forgot password */}
                  <div className="flex items-center justify-between">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary accent-primary"
                      />
                      Remember me
                    </label>
                    <button
                      type="button"
                      className="text-sm font-medium text-primary-light transition-colors hover:text-primary"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="rounded-lg bg-danger-bg px-4 py-3 text-sm font-medium text-danger">
                      {error}
                    </div>
                  )}

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-medium text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-light hover:shadow-xl hover:shadow-primary-light/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>
              </div>
            ) : (
              /* ============================================ */
              /* Quick Login Tab                              */
              /* ============================================ */
              <div>
                <h2 className="text-2xl font-bold text-text-primary">
                  Select Employee
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Choose an employee to login as for demo
                </p>

                <div className="mt-6 grid grid-cols-1 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {demoCredentials.map((cred) => {
                    const config = roleConfig[cred.authRole] ?? roleConfig.associate;
                    const Icon = config.icon;
                    const isSelected = selectedEmail === cred.email;

                    return (
                      <button
                        key={cred.email}
                        onClick={() => handleQuickLogin(cred)}
                        className={cn(
                          "group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all hover:shadow-md",
                          isSelected
                            ? "border-primary bg-primary-50 shadow-sm"
                            : "border-border hover:border-primary-light"
                        )}
                      >
                        {/* Icon circle */}
                        <div
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
                            config.bgClass
                          )}
                        >
                          <Icon className={cn("h-5 w-5", config.textClass)} />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text-primary">
                            {cred.name}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-text-secondary">
                            {cred.role} &middot; {cred.email}
                          </p>
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ============================================ */}
          {/* Demo credentials collapsible                 */}
          {/* ============================================ */}
          <div className="mt-6 border-t border-border pt-4">
            <button
              onClick={() => setShowCredentials((v) => !v)}
              className="flex w-full items-center justify-between text-sm text-text-muted transition-colors hover:text-text-secondary"
            >
              <span className="font-medium">Demo credentials</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  showCredentials && "rotate-180"
                )}
              />
            </button>

            {showCredentials && (
              <div className="mt-3 overflow-hidden rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-background">
                      <th className="px-3 py-2 font-semibold text-text-secondary">
                        Name
                      </th>
                      <th className="px-3 py-2 font-semibold text-text-secondary">
                        Role
                      </th>
                      <th className="px-3 py-2 font-semibold text-text-secondary">
                        Email
                      </th>
                      <th className="px-3 py-2 font-semibold text-text-secondary">
                        Password
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {demoCredentials.map((cred) => (
                      <tr
                        key={cred.email}
                        className="border-b border-border last:border-b-0 transition-colors hover:bg-background cursor-pointer"
                        onClick={() => {
                          setEmail(cred.email);
                          setPassword(cred.password);
                          setActiveTab("email");
                        }}
                      >
                        <td className="px-3 py-2 font-medium text-text-primary">
                          {cred.name}
                        </td>
                        <td className="px-3 py-2 text-text-secondary">
                          {cred.role}
                        </td>
                        <td className="px-3 py-2 font-mono text-text-secondary">
                          {cred.email}
                        </td>
                        <td className="px-3 py-2 font-mono text-text-secondary">
                          {cred.password}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
