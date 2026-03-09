"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import gsap from "gsap";
import {
  Pencil,
  Mail,
  Phone,
  GraduationCap,
  Scale,
  CalendarDays,
  Building2,
  Briefcase,
  UserCog,
  Shield,
  ShieldCheck,
  ShieldX,
  Clock,
  Lock,
  Smartphone,
  Monitor,
  Eye,
  EyeOff,
  Check,
  X,
  ChevronDown,
  Activity,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import {
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import {
  useAuthStore,
  rolePermissionsMap,
  type UserRole,
  type RolePermissions,
} from "@/store/auth-store";
import { useToastStore } from "@/store/toast-store";
import { cn, formatDate, getInitials } from "@/lib/utils";

/* ---------- constants ---------- */

const roleBadgeStyles: Record<UserRole, string> = {
  admin: "bg-purple-100 text-purple-700",
  partner: "bg-blue-100 text-blue-700",
  associate: "bg-teal-100 text-teal-700",
  paralegal: "bg-gray-100 text-gray-700",
  accountant: "bg-emerald-100 text-emerald-700",
};

const roleLabels: Record<UserRole, string> = {
  admin: "Administrator",
  partner: "Partner",
  associate: "Associate",
  paralegal: "Paralegal",
  accountant: "Accountant",
};

const roleDescriptions: Record<UserRole, string> = {
  admin: "Full system access. Can manage users, settings, and all modules.",
  partner: "Senior access. Can manage users, cases, finance, and reports.",
  associate: "Standard access. Can manage assigned cases and view finance.",
  paralegal: "Limited access. Read-only across most modules.",
  accountant: "Finance-focused access. Can manage invoices, payments, and reports.",
};

const allRoles: UserRole[] = ["admin", "partner", "associate", "paralegal", "accountant"];

interface PermissionMeta {
  key: keyof RolePermissions;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const permissionsMeta: PermissionMeta[] = [
  { key: "canManageUsers", label: "Manage Users", description: "Create, edit, and deactivate user accounts", icon: Users },
  { key: "canAssignRoles", label: "Assign Roles", description: "Change user roles and permissions", icon: UserCog },
  { key: "canViewFinance", label: "View Finance", description: "Access invoices, payments, and financial data", icon: Eye },
  { key: "canEditFinance", label: "Edit Finance", description: "Create and modify invoices and payments", icon: Pencil },
  { key: "canManageCases", label: "Manage Cases", description: "Create and edit cases", icon: Briefcase },
  { key: "canDeleteCases", label: "Delete Cases", description: "Permanently remove cases", icon: X },
  { key: "canViewReports", label: "View Reports", description: "Access analytics and reports dashboard", icon: Eye },
  { key: "canExportReports", label: "Export Reports", description: "Download and export report data", icon: Activity },
  { key: "canManageEmployees", label: "Manage Employees", description: "Add, edit, and manage employee records", icon: Users },
  { key: "canManageSettings", label: "Manage Settings", description: "Modify system-wide settings", icon: Shield },
  { key: "canViewAllCases", label: "View All Cases", description: "Access all cases across the firm", icon: Eye },
];

const activityLog = [
  { title: "Logged in", detail: "from Chrome on macOS", daysAgo: 0 },
  { title: "Updated case LIT-2026-0142", detail: "Changed status to In Progress", daysAgo: 1 },
  { title: "Created invoice INV-2026-0270", detail: "Amount: Rs 45,000", daysAgo: 2 },
  { title: "Assigned task to Meera Sharma", detail: "Document review for RERA case", daysAgo: 3 },
  { title: "Exported financial report", detail: "Q4 2025 revenue summary", daysAgo: 5 },
];

function getRelativeTime(daysAgo: number): string {
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  return `${daysAgo} days ago`;
}

function getActivityDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return formatDate(d);
}

/* ================================================================== */

export default function ProfilePage() {
  const { user, permissions, allUsers, setUser, setRole, hasPermission } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    qualification: user?.qualification ?? "",
    barCouncilNumber: user?.barCouncilNumber || "",
  });

  // Security form state
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    newPassword: "",
    confirm: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    newPassword: false,
    confirm: false,
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Refs for GSAP animations
  const bannerRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const infoCardsRef = useRef<HTMLDivElement>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);

  // Mount animation
  useEffect(() => {
    if (bannerRef.current) {
      gsap.fromTo(
        bannerRef.current,
        { scaleX: 0.95, opacity: 0 },
        { scaleX: 1, opacity: 1, duration: 0.6, ease: "power3.out" }
      );
    }
    if (avatarRef.current) {
      gsap.fromTo(
        avatarRef.current,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, delay: 0.2, ease: "back.out(1.7)" }
      );
    }
  }, []);

  // Tab change animation
  useEffect(() => {
    if (tabContentRef.current) {
      const cards = tabContentRef.current.querySelectorAll("[data-animate-card]");
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: "power2.out" }
        );
      }
    }
  }, [activeTab]);

  // Sync edit form when user changes
  useEffect(() => {
    if (!user) return;
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      qualification: user.qualification,
      barCouncilNumber: user.barCouncilNumber || "",
    });
  }, [user]);

  if (!user || !permissions) return null;

  const handleEditSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setUser({
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        qualification: editForm.qualification,
        barCouncilNumber: editForm.barCouncilNumber || undefined,
      });
      setEditModalOpen(false);
      addToast({ type: "success", title: "Profile updated", description: "Your profile has been updated successfully." });
    },
    [editForm, setUser, addToast]
  );

  const handlePasswordSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (passwordForm.newPassword !== passwordForm.confirm) {
        addToast({ type: "error", title: "Passwords do not match", description: "New password and confirm password must be the same." });
        return;
      }
      if (passwordForm.newPassword.length < 8) {
        addToast({ type: "error", title: "Password too short", description: "Password must be at least 8 characters." });
        return;
      }
      addToast({ type: "success", title: "Password changed", description: "Your password has been updated successfully." });
      setPasswordForm({ current: "", newPassword: "", confirm: "" });
    },
    [passwordForm, addToast]
  );

  const handleRoleChange = useCallback(
    (userId: string, newRole: UserRole) => {
      if (userId === user.id) {
        const roleRank: Record<UserRole, number> = { admin: 5, partner: 4, associate: 3, accountant: 2, paralegal: 1 };
        if (roleRank[newRole] < roleRank[user.role]) {
          addToast({ type: "warning", title: "Cannot downgrade own role", description: "You cannot assign yourself a lower role." });
          return;
        }
      }
      const targetUser = allUsers.find((u) => u.id === userId);
      setRole(userId, newRole);
      addToast({
        type: "success",
        title: "Role updated",
        description: `${targetUser?.name || "User"}'s role changed to ${roleLabels[newRole]}.`,
      });
    },
    [user.id, user.role, allUsers, setRole, addToast]
  );

  const canManageRoles = hasPermission("canManageUsers") || hasPermission("canAssignRoles");

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" />

      {/* ---- Header Card ---- */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* Banner */}
        <div
          ref={bannerRef}
          className="h-32 bg-gradient-to-r from-[#1E3A8A] to-[#2563EB]"
        />

        {/* Profile info */}
        <div className="relative px-6 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            {/* Avatar + Info */}
            <div className="flex items-end gap-4">
              <div
                ref={avatarRef}
                className="-mt-12 flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-white bg-primary-light text-2xl font-bold text-white shadow-lg"
              >
                {getInitials(user.name)}
              </div>
              <div className="pb-1">
                <h2 className="text-2xl font-bold text-text-primary">
                  {user.name}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize",
                      roleBadgeStyles[user.role]
                    )}
                  >
                    {roleLabels[user.role]}
                  </span>
                  <span className="text-sm text-text-secondary">
                    {user.designation} &middot; {user.department}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit button */}
            <button
              onClick={() => setEditModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary"
            >
              <Pencil className="h-4 w-4" />
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* ---- Tabs ---- */}
      <div ref={tabContentRef}>
        <TabsRoot
          defaultValue="personal"
          onValueChange={(value) => setActiveTab(value)}
        >
          <TabsList>
            <TabsTrigger value="personal">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                Personal Info
              </span>
            </TabsTrigger>
            <TabsTrigger value="roles">
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4" />
                Role & Permissions
              </span>
            </TabsTrigger>
            <TabsTrigger value="activity">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Activity Log
              </span>
            </TabsTrigger>
            <TabsTrigger value="security">
              <span className="flex items-center gap-1.5">
                <Lock className="h-4 w-4" />
                Security
              </span>
            </TabsTrigger>
          </TabsList>

          {/* ---- Personal Info Tab ---- */}
          <TabsContent value="personal">
            <div className="space-y-6">
              <div
                data-animate-card
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-text-primary">
                    Personal Information
                  </h3>
                  <button
                    onClick={() => setEditModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                </div>
                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <InfoField
                    icon={Mail}
                    label="Email"
                    value={user.email}
                  />
                  <InfoField
                    icon={Phone}
                    label="Phone"
                    value={user.phone}
                  />
                  <InfoField
                    icon={GraduationCap}
                    label="Qualification"
                    value={user.qualification}
                  />
                  <InfoField
                    icon={Scale}
                    label="Bar Council Number"
                    value={user.barCouncilNumber || "N/A"}
                  />
                  <InfoField
                    icon={CalendarDays}
                    label="Date of Joining"
                    value={formatDate(user.dateOfJoining)}
                  />
                  <InfoField
                    icon={Building2}
                    label="Department"
                    value={user.department}
                  />
                  <InfoField
                    icon={Briefcase}
                    label="Designation"
                    value={user.designation}
                  />
                  <InfoField
                    icon={UserCog}
                    label="Reporting To"
                    value={user.role === "admin" || user.role === "partner" ? "Board" : "Priya Mehta (Managing Partner)"}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ---- Role & Permissions Tab ---- */}
          <TabsContent value="roles">
            <div className="space-y-6">
              {/* Current Role */}
              <div
                data-animate-card
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <h3 className="text-sm font-semibold text-text-primary">
                  Current Role
                </h3>
                <div className="mt-4 flex items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold capitalize",
                      roleBadgeStyles[user.role]
                    )}
                  >
                    {roleLabels[user.role]}
                  </span>
                </div>
                <p className="mt-3 text-sm text-text-secondary">
                  {roleDescriptions[user.role]}
                </p>
              </div>

              {/* Permissions Grid */}
              <div
                data-animate-card
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <h3 className="text-sm font-semibold text-text-primary">
                  Permissions
                </h3>
                <div className="mt-4 space-y-1">
                  {permissionsMeta.map((perm) => {
                    const Icon = perm.icon;
                    const granted = permissions[perm.key];
                    return (
                      <div
                        key={perm.key}
                        className="flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-background"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-lg",
                              granted ? "bg-emerald-50" : "bg-red-50"
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-4 w-4",
                                granted ? "text-emerald-600" : "text-red-400"
                              )}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {perm.label}
                            </p>
                            <p className="text-xs text-text-secondary">
                              {perm.description}
                            </p>
                          </div>
                        </div>
                        <div>
                          {granted ? (
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100">
                              <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            </span>
                          ) : (
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100">
                              <ShieldX className="h-4 w-4 text-red-500" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Manage Team Roles - only for admin/partner */}
              {canManageRoles && (
                <div
                  data-animate-card
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                >
                  <h3 className="text-sm font-semibold text-text-primary">
                    Manage Team Roles
                  </h3>
                  <p className="mt-1 text-xs text-text-secondary">
                    Change roles for team members. Permissions update immediately.
                  </p>
                  <div className="mt-4 space-y-3">
                    {allUsers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-white">
                            {getInitials(member.name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {member.name}
                              {member.id === user.id && (
                                <span className="ml-2 text-xs text-text-muted">(You)</span>
                              )}
                            </p>
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                                roleBadgeStyles[member.role]
                              )}
                            >
                              {roleLabels[member.role]}
                            </span>
                          </div>
                        </div>
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(member.id, e.target.value as UserRole)
                          }
                          className="styled-select"
                        >
                          {allRoles.map((role) => (
                            <option key={role} value={role}>
                              {roleLabels[role]}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ---- Activity Log Tab ---- */}
          <TabsContent value="activity">
            <div
              data-animate-card
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <h3 className="text-sm font-semibold text-text-primary">
                Recent Activity
              </h3>
              <div className="mt-6 space-y-0">
                {activityLog.map((item, index) => (
                  <div key={index} className="relative flex gap-4 pb-8 last:pb-0">
                    {/* Vertical line */}
                    {index < activityLog.length - 1 && (
                      <div className="absolute left-[7px] top-4 h-full w-px bg-border" />
                    )}
                    {/* Dot */}
                    <div className="relative z-10 mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center">
                      <div
                        className={cn(
                          "h-3 w-3 rounded-full",
                          index === 0 ? "bg-primary" : "bg-border"
                        )}
                      />
                    </div>
                    {/* Content */}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-text-secondary">
                        {item.detail}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
                        <span>{getActivityDate(item.daysAgo)}</span>
                        <span>&middot;</span>
                        <span>{getRelativeTime(item.daysAgo)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ---- Security Tab ---- */}
          <TabsContent value="security">
            <div className="space-y-6">
              {/* Change Password */}
              <div
                data-animate-card
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <h3 className="text-sm font-semibold text-text-primary">
                  Change Password
                </h3>
                <form onSubmit={handlePasswordSubmit} className="mt-4 max-w-md space-y-4">
                  <PasswordField
                    label="Current Password"
                    value={passwordForm.current}
                    onChange={(v) => setPasswordForm((p) => ({ ...p, current: v }))}
                    show={showPasswords.current}
                    onToggleShow={() =>
                      setShowPasswords((p) => ({ ...p, current: !p.current }))
                    }
                  />
                  <PasswordField
                    label="New Password"
                    value={passwordForm.newPassword}
                    onChange={(v) => setPasswordForm((p) => ({ ...p, newPassword: v }))}
                    show={showPasswords.newPassword}
                    onToggleShow={() =>
                      setShowPasswords((p) => ({ ...p, newPassword: !p.newPassword }))
                    }
                  />
                  <PasswordField
                    label="Confirm New Password"
                    value={passwordForm.confirm}
                    onChange={(v) => setPasswordForm((p) => ({ ...p, confirm: v }))}
                    show={showPasswords.confirm}
                    onToggleShow={() =>
                      setShowPasswords((p) => ({ ...p, confirm: !p.confirm }))
                    }
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-light"
                  >
                    Update Password
                  </button>
                </form>
              </div>

              {/* Two-Factor Authentication */}
              <div
                data-animate-card
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">
                      Two-Factor Authentication
                    </h3>
                    <p className="mt-1 text-xs text-text-secondary">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTwoFactorEnabled((v) => !v);
                      addToast({
                        type: "success",
                        title: twoFactorEnabled
                          ? "2FA disabled"
                          : "2FA enabled",
                        description: twoFactorEnabled
                          ? "Two-factor authentication has been disabled."
                          : "Two-factor authentication is now active.",
                      });
                    }}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                      twoFactorEnabled ? "bg-primary" : "bg-border"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                        twoFactorEnabled ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>
                {twoFactorEnabled && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <ShieldCheck className="h-4 w-4" />
                    Two-factor authentication is enabled via authenticator app.
                  </div>
                )}
              </div>

              {/* Active Sessions */}
              <div
                data-animate-card
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <h3 className="text-sm font-semibold text-text-primary">
                  Active Sessions
                </h3>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                        <Monitor className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          Chrome on macOS
                          <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            Current
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-text-muted">
                          IP: 192.168.1.105 &middot; Indore, India
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-text-muted">Active now</p>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                        <Smartphone className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          Safari on iPhone
                        </p>
                        <p className="mt-0.5 text-xs text-text-muted">
                          IP: 192.168.1.108 &middot; Indore, India
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-text-muted">2 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </TabsRoot>
      </div>

      {/* ---- Edit Profile Modal ---- */}
      <Modal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        title="Edit Profile"
        description="Update your personal information"
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                Name
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                Email
              </label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                Phone
              </label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                Qualification
              </label>
              <input
                type="text"
                value={editForm.qualification}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, qualification: e.target.value }))
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                Bar Council Number
              </label>
              <input
                type="text"
                value={editForm.barCouncilNumber}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, barCouncilNumber: e.target.value }))
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g., MP/1234/2018"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-background"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-light"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ---------- sub-components ---------- */

function InfoField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-text-muted">
          {label}
        </label>
        <p className="mt-0.5 text-sm font-medium text-text-primary">{value}</p>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggleShow,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggleShow: () => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-text-secondary">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 pr-10 text-sm text-text-primary transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          required
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
