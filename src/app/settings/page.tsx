"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import gsap from "gsap";
import {
  Building2,
  Globe,
  Users,
  Bell,
  CreditCard,
  Puzzle,
  Pencil,
  MessageSquare,
  Calendar,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  Save,
  X,
  ChevronDown,
} from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  useAuthStore,
  type UserRole,
} from "@/store/auth-store";
import { useToastStore } from "@/store/toast-store";
import { useNavbarFilterStore } from "@/store/navbar-filter-store";
import { cn, getInitials } from "@/lib/utils";

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

const allRoles: UserRole[] = ["admin", "partner", "associate", "paralegal", "accountant"];

/* ---------- toggle switch ---------- */

function Toggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
        enabled ? "bg-primary" : "bg-border"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
          enabled ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

/* ---------- editable field ---------- */

function EditableField({
  label,
  value,
  editing,
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-muted">
        {label}
      </label>
      {editing ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-xl border border-primary bg-background px-3 py-2 text-sm text-text-primary transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
        />
      ) : (
        <p className="mt-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-primary">
          {value}
        </p>
      )}
    </div>
  );
}

/* ---------- notification row ---------- */

function NotificationRow({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="mt-0.5 text-xs text-text-secondary">{description}</p>
      </div>
      <Toggle enabled={enabled} onToggle={onToggle} />
    </div>
  );
}

/* ---------- integration card ---------- */

interface IntegrationDef {
  name: string;
  description: string;
  icon: React.ElementType;
  connected: boolean;
  iconBg: string;
  iconColor: string;
}

const defaultIntegrations: IntegrationDef[] = [
  {
    name: "WhatsApp Business API",
    description: "Send automated reminders and updates to clients",
    icon: MessageSquare,
    connected: true,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    name: "Google Calendar",
    description: "Sync hearings and deadlines with Google Calendar",
    icon: Calendar,
    connected: false,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    name: "Tally",
    description: "Sync invoices and payments with Tally accounting",
    icon: BarChart3,
    connected: false,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
  {
    name: "MP RERA Portal",
    description: "Auto-fetch case status from MP RERA portal",
    icon: Building2,
    connected: true,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
];

/* ================================================================== */

export default function SettingsPage() {
  const { user, allUsers, setRole, hasPermission } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);
  const canManageUsers = hasPermission("canManageUsers");
  const activeFilter = useNavbarFilterStore((s) => s.activeFilter);

  const [activeTab, setActiveTab] = useState("general");

  // Sync navbar pills with settings tabs
  useEffect(() => {
    const pillToTab: Record<string, string> = {
      "General": "general",
      "Users & Roles": "users",
      "Notifications": "notifications",
      "Billing": "billing",
      "Integrations": "integrations",
    };
    if (activeFilter && pillToTab[activeFilter]) {
      setActiveTab(pillToTab[activeFilter]);
    }
  }, [activeFilter]);

  // General tab - editable states
  const [editingFirm, setEditingFirm] = useState(false);
  const [firmDetails, setFirmDetails] = useState({
    firmName: "LexOps Legal LLP",
    address: "301, Emerald Heights, Vijay Nagar, Indore 452010",
    phone: "+91 731 400 1234",
    email: "office@lexops.in",
    gstin: "23AADFL1234A1ZP",
  });

  const [editingRegional, setEditingRegional] = useState(false);
  const [regionalSettings, setRegionalSettings] = useState({
    language: "English",
    currency: "INR",
    timezone: "IST (UTC+5:30)",
  });

  // Notifications tab
  const [notifications, setNotifications] = useState({
    email: true,
    whatsapp: true,
    hearing: true,
    payment: false,
    digest: true,
  });

  // Integrations tab
  const [integrations, setIntegrations] = useState(defaultIntegrations);

  // Refs for GSAP
  const tabContentRef = useRef<HTMLDivElement>(null);

  const toggleNotification = useCallback(
    (key: keyof typeof notifications) => {
      setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
      addToast({ type: "success", title: "Preferences updated", description: "Your notification preferences have been saved." });
    },
    [addToast]
  );

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

  if (!user) return null;

  const handleRoleChange = useCallback(
    (userId: string, newRole: UserRole) => {
      const targetUser = allUsers.find((u) => u.id === userId);
      setRole(userId, newRole);
      addToast({
        type: "success",
        title: "Role updated",
        description: `${targetUser?.name || "User"}'s role changed to ${roleLabels[newRole]}.`,
      });
    },
    [allUsers, setRole, addToast]
  );

  const handleSaveFirm = useCallback(() => {
    setEditingFirm(false);
    addToast({ type: "success", title: "Firm details saved", description: "Your firm details have been updated successfully." });
  }, [addToast]);

  const handleSaveRegional = useCallback(() => {
    setEditingRegional(false);
    addToast({ type: "success", title: "Regional settings saved", description: "Your regional settings have been updated successfully." });
  }, [addToast]);

  const handleToggleIntegration = useCallback(
    (index: number) => {
      setIntegrations((prev) => {
        const updated = [...prev];
        const wasConnected = updated[index].connected;
        updated[index] = { ...updated[index], connected: !wasConnected };
        addToast({
          type: wasConnected ? "info" : "success",
          title: wasConnected
            ? `${updated[index].name} disconnected`
            : `${updated[index].name} connected`,
          description: wasConnected
            ? "The integration has been disconnected."
            : "The integration is now active.",
        });
        return updated;
      });
    },
    [addToast]
  );

  const handleUpgradePlan = useCallback(() => {
    addToast({
      type: "info",
      title: "Upgrade requested",
      description: "Our team will contact you shortly about upgrading your plan.",
    });
  }, [addToast]);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />

      <div ref={tabContentRef}>
        <TabsRoot value={activeTab} onValueChange={(value) => setActiveTab(value)}>
          <TabsList>
            <TabsTrigger value="general">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                General
              </span>
            </TabsTrigger>
            {canManageUsers && (
              <TabsTrigger value="users">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  Users & Roles
                </span>
              </TabsTrigger>
            )}
            <TabsTrigger value="notifications">
              <span className="flex items-center gap-1.5">
                <Bell className="h-4 w-4" />
                Notifications
              </span>
            </TabsTrigger>
            <TabsTrigger value="billing">
              <span className="flex items-center gap-1.5">
                <CreditCard className="h-4 w-4" />
                Billing
              </span>
            </TabsTrigger>
            <TabsTrigger value="integrations">
              <span className="flex items-center gap-1.5">
                <Puzzle className="h-4 w-4" />
                Integrations
              </span>
            </TabsTrigger>
          </TabsList>

          {/* ---- General ---- */}
          <TabsContent value="general">
            <div className="space-y-6">
              {/* Firm Details */}
              <div data-animate-card className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-text-primary">
                    Firm Details
                  </h3>
                  {editingFirm ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingFirm(false)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-danger hover:text-danger"
                      >
                        <X className="h-3 w-3" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveFirm}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-light"
                      >
                        <Save className="h-3 w-3" />
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingFirm(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <EditableField
                    label="Firm Name"
                    value={firmDetails.firmName}
                    editing={editingFirm}
                    onChange={(v) => setFirmDetails((f) => ({ ...f, firmName: v }))}
                  />
                  <EditableField
                    label="Address"
                    value={firmDetails.address}
                    editing={editingFirm}
                    onChange={(v) => setFirmDetails((f) => ({ ...f, address: v }))}
                  />
                  <EditableField
                    label="Phone"
                    value={firmDetails.phone}
                    editing={editingFirm}
                    onChange={(v) => setFirmDetails((f) => ({ ...f, phone: v }))}
                  />
                  <EditableField
                    label="Email"
                    value={firmDetails.email}
                    editing={editingFirm}
                    onChange={(v) => setFirmDetails((f) => ({ ...f, email: v }))}
                  />
                  <EditableField
                    label="GSTIN"
                    value={firmDetails.gstin}
                    editing={editingFirm}
                    onChange={(v) => setFirmDetails((f) => ({ ...f, gstin: v }))}
                  />
                </div>
              </div>

              {/* Regional Settings */}
              <div data-animate-card className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-text-primary">
                    Regional Settings
                  </h3>
                  {editingRegional ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingRegional(false)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-danger hover:text-danger"
                      >
                        <X className="h-3 w-3" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveRegional}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-light"
                      >
                        <Save className="h-3 w-3" />
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingRegional(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {editingRegional ? (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-text-muted">Language</label>
                        <select
                          value={regionalSettings.language}
                          onChange={(e) => setRegionalSettings((r) => ({ ...r, language: e.target.value }))}
                          className="styled-select mt-1 w-full"
                        >
                          <option>English</option>
                          <option>Hindi</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-muted">Currency</label>
                        <select
                          value={regionalSettings.currency}
                          onChange={(e) => setRegionalSettings((r) => ({ ...r, currency: e.target.value }))}
                          className="styled-select mt-1 w-full"
                        >
                          <option value="INR">INR (&#8377;)</option>
                          <option value="USD">USD ($)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-muted">Timezone</label>
                        <select
                          value={regionalSettings.timezone}
                          onChange={(e) => setRegionalSettings((r) => ({ ...r, timezone: e.target.value }))}
                          className="styled-select mt-1 w-full"
                        >
                          <option>IST (UTC+5:30)</option>
                          <option>UTC (UTC+0:00)</option>
                          <option>EST (UTC-5:00)</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
                        <Globe className="h-4 w-4 text-text-muted" />
                        <div>
                          <p className="text-xs text-text-muted">Language</p>
                          <p className="text-sm font-medium text-text-primary">
                            {regionalSettings.language}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
                        <span className="text-base text-text-muted">&#8377;</span>
                        <div>
                          <p className="text-xs text-text-muted">Currency</p>
                          <p className="text-sm font-medium text-text-primary">
                            {regionalSettings.currency === "INR" ? "INR (\u20B9)" : regionalSettings.currency}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
                        <span className="text-sm text-text-muted">&#128336;</span>
                        <div>
                          <p className="text-xs text-text-muted">Timezone</p>
                          <p className="text-sm font-medium text-text-primary">
                            {regionalSettings.timezone}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ---- Users & Roles ---- */}
          {canManageUsers && (
            <TabsContent value="users">
              <div className="space-y-4">
                <div data-animate-card className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-background">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                          Current Role
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                          Change Role
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {allUsers.map((member) => (
                        <tr
                          key={member.id}
                          className="transition-colors hover:bg-primary-50/50"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-semibold text-white">
                                {getInitials(member.name)}
                              </div>
                              <div>
                                <p className="font-medium text-text-primary">
                                  {member.name}
                                  {member.id === user.id && (
                                    <span className="ml-1.5 text-xs text-text-muted">(You)</span>
                                  )}
                                </p>
                                <p className="text-xs text-text-secondary">
                                  {member.designation}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-text-secondary">
                            {member.email}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                                roleBadgeStyles[member.role]
                              )}
                            >
                              {roleLabels[member.role]}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="relative inline-block">
                              <select
                                value={member.role}
                                onChange={(e) =>
                                  handleRoleChange(member.id, e.target.value as UserRole)
                                }
                                className="styled-select-sm"
                              >
                                {allRoles.map((role) => (
                                  <option key={role} value={role}>
                                    {roleLabels[role]}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status="Active" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div data-animate-card className="rounded-2xl border border-border bg-primary-50/50 p-4">
                  <p className="text-xs text-text-secondary">
                    <span className="font-medium text-text-primary">
                      Note:
                    </span>{" "}
                    Role changes take effect immediately. Users will see updated
                    permissions on their next page load. Admins and Partners have
                    full role management capabilities.
                  </p>
                </div>
              </div>
            </TabsContent>
          )}

          {/* ---- Notifications ---- */}
          <TabsContent value="notifications">
            <div data-animate-card className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-text-primary">
                Notification Preferences
              </h3>
              <div className="mt-2 divide-y divide-border">
                <NotificationRow
                  label="Email Notifications"
                  description="Receive important updates and alerts via email"
                  enabled={notifications.email}
                  onToggle={() => toggleNotification("email")}
                />
                <NotificationRow
                  label="WhatsApp Reminders"
                  description="Get hearing and task reminders on WhatsApp"
                  enabled={notifications.whatsapp}
                  onToggle={() => toggleNotification("whatsapp")}
                />
                <NotificationRow
                  label="Hearing Reminders"
                  description="Get notified 3 days before scheduled hearings"
                  enabled={notifications.hearing}
                  onToggle={() => toggleNotification("hearing")}
                />
                <NotificationRow
                  label="Payment Reminders"
                  description="Alerts for overdue and upcoming payment deadlines"
                  enabled={notifications.payment}
                  onToggle={() => toggleNotification("payment")}
                />
                <NotificationRow
                  label="Daily Digest"
                  description="Summary of the day's tasks, hearings, and updates"
                  enabled={notifications.digest}
                  onToggle={() => toggleNotification("digest")}
                />
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() =>
                    addToast({
                      type: "success",
                      title: "Preferences saved",
                      description: "Your notification preferences have been saved.",
                    })
                  }
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-light"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </TabsContent>

          {/* ---- Billing ---- */}
          <TabsContent value="billing">
            <div data-animate-card className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    Current Plan
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-2xl font-bold text-text-primary">
                      Professional
                    </span>
                    <StatusBadge status="Active" />
                  </div>
                  <p className="mt-1 text-xs text-text-secondary">
                    Billed monthly &middot; Next billing date: 01 Apr 2026
                  </p>
                </div>
                <button
                  onClick={handleUpgradePlan}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary"
                >
                  Upgrade Plan
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs text-text-muted">Active Users</p>
                  <p className="mt-1 text-xl font-bold text-text-primary">
                    {allUsers.length}{" "}
                    <span className="text-sm font-normal text-text-muted">
                      / 15
                    </span>
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.round((allUsers.length / 15) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs text-text-muted">Active Cases</p>
                  <p className="mt-1 text-xl font-bold text-text-primary">
                    147{" "}
                    <span className="text-sm font-normal text-text-muted">
                      / 500
                    </span>
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: "29%" }}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs text-text-muted">Storage Used</p>
                  <p className="mt-1 text-xl font-bold text-text-primary">
                    2.4 GB{" "}
                    <span className="text-sm font-normal text-text-muted">
                      / 10 GB
                    </span>
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-success"
                      style={{ width: "24%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ---- Integrations ---- */}
          <TabsContent value="integrations">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {integrations.map((integration, index) => {
                const Icon = integration.icon;
                return (
                  <div
                    key={integration.name}
                    data-animate-card
                    className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-xl",
                          integration.iconBg
                        )}
                      >
                        <Icon
                          className={cn("h-5 w-5", integration.iconColor)}
                        />
                      </div>
                      {integration.connected ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2.5 py-0.5 text-xs font-medium text-success">
                          <CheckCircle2 className="h-3 w-3" />
                          Connected
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-border-light px-2.5 py-0.5 text-xs font-medium text-text-muted">
                          Not Connected
                        </span>
                      )}
                    </div>

                    <h4 className="mt-4 text-sm font-semibold text-text-primary">
                      {integration.name}
                    </h4>
                    <p className="mt-1 text-xs text-text-secondary">
                      {integration.description}
                    </p>

                    <button
                      onClick={() => handleToggleIntegration(index)}
                      className={cn(
                        "mt-4 inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                        integration.connected
                          ? "border border-border text-text-secondary hover:border-danger hover:text-danger"
                          : "bg-primary text-white hover:bg-primary-light"
                      )}
                    >
                      {integration.connected ? "Disconnect" : "Connect"}
                    </button>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </TabsRoot>
      </div>
    </div>
  );
}
