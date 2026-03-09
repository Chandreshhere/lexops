"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";
import {
  Menu,
  Search,
  Bell,
  Headphones,
  SlidersHorizontal,
  ChevronDown,
  Download,
  LogOut,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebar-store";
import { useAuthStore } from "@/store/auth-store";
import type { UserRole } from "@/store/auth-store";

const roleBadgeColors: Record<UserRole, string> = {
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

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/cases": "Cases",
  "/clients": "Clients",
  "/finance": "Finance",
  "/employees": "Employees",
  "/reports": "Reports",
  "/settings": "Settings",
};

interface PillConfig {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  isDropdown?: boolean;
}

const contextPills: Record<string, PillConfig[]> = {
  "/": [
    { label: "Filter", icon: SlidersHorizontal },
    { label: "Monthly", isDropdown: true },
    { label: "Download Data", icon: Download },
  ],
  "/cases": [
    { label: "All Cases" },
    { label: "Active" },
    { label: "Closed" },
  ],
  "/clients": [
    { label: "All Clients" },
    { label: "Active" },
    { label: "Inactive" },
  ],
  "/finance": [
    { label: "Overview" },
    { label: "Invoices" },
    { label: "Expenses" },
  ],
  "/employees": [
    { label: "All Staff" },
    { label: "Active" },
    { label: "On Leave" },
  ],
  "/reports": [
    { label: "Summary" },
    { label: "Detailed" },
    { label: "Export" },
  ],
  "/settings": [
    { label: "General" },
    { label: "Team" },
    { label: "Billing" },
  ],
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  const base = "/" + pathname.split("/").filter(Boolean)[0];
  return pageTitles[base] ?? "Dashboard";
}

function getContextPills(pathname: string): PillConfig[] {
  if (contextPills[pathname]) return contextPills[pathname];
  const base = "/" + pathname.split("/").filter(Boolean)[0];
  return contextPills[base] ?? contextPills["/"];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, setMobileOpen } = useSidebarStore();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const title = getPageTitle(pathname);
  const pills = getContextPills(pathname);
  const [activePill, setActivePill] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const navbarRef = useRef<HTMLElement>(null);
  const pillsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const prevCollapsed = useRef(isCollapsed);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = useCallback(() => {
    setIsDropdownOpen(false);
    logout();
    router.push("/login");
  }, [logout, router]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [pathname]);

  const setPillRef = (el: HTMLButtonElement | null, index: number) => {
    pillsRef.current[index] = el;
  };

  // Detect desktop
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);

    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Reset active pill when route changes
  useEffect(() => {
    setActivePill(0);
  }, [pathname]);

  // Animate pills on mount / route change
  useEffect(() => {
    const items = pillsRef.current.filter(Boolean);
    if (items.length === 0) return;

    gsap.fromTo(
      items,
      { y: -8, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.35,
        stagger: 0.05,
        ease: "power2.out",
        delay: 0.1,
      }
    );
  }, [pathname]);

  // Animate navbar left offset when sidebar toggles
  useEffect(() => {
    if (!navbarRef.current || !isDesktop) return;

    const target = isCollapsed ? 72 : 260;

    if (prevCollapsed.current !== isCollapsed) {
      prevCollapsed.current = isCollapsed;
      gsap.to(navbarRef.current, {
        left: target,
        duration: 0.4,
        ease: "power2.inOut",
      });
    } else {
      gsap.set(navbarRef.current, { left: target });
    }
  }, [isCollapsed, isDesktop]);

  // Compute initial left for first paint
  const initialLeft = isDesktop ? (isCollapsed ? 72 : 260) : 0;

  return (
    <header
      ref={navbarRef}
      className="fixed top-0 right-0 z-30 flex h-(--topbar-height) items-center bg-card shadow-sm shadow-black/5"
      style={{ left: initialLeft }}
    >
      <div className="flex w-full items-center justify-between px-4 sm:px-6">
        {/* Left section: Hamburger + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-xl p-2 text-text-secondary hover:bg-primary-50 hover:text-text-primary lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
        </div>

        {/* Center: Pill navigation tabs */}
        <div className="hidden items-center gap-2 md:flex">
          {pills.map((pill, index) => {
            const isActive = index === activePill;
            const Icon = pill.icon;
            return (
              <button
                key={pill.label}
                ref={(el) => setPillRef(el, index)}
                onClick={() => setActivePill(index)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium",
                  "transition-all duration-200",
                  isActive
                    ? "border-primary bg-primary text-white shadow-md shadow-primary/20"
                    : "border-border bg-white text-text-secondary hover:border-primary-200 hover:bg-primary-50 hover:text-text-primary"
                )}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {pill.label}
                {pill.isDropdown && <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1.5">
          {/* Search */}
          <button className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-text-secondary shadow-sm transition-all duration-200 hover:border-primary-200 hover:bg-primary-50 hover:text-text-primary">
            <Search className="h-4 w-4" />
          </button>

          {/* Support */}
          <button className="hidden h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-text-secondary shadow-sm transition-all duration-200 hover:border-primary-200 hover:bg-primary-50 hover:text-text-primary sm:flex">
            <Headphones className="h-4 w-4" />
          </button>

          {/* Notifications */}
          <button className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-text-secondary shadow-sm transition-all duration-200 hover:border-primary-200 hover:bg-primary-50 hover:text-text-primary">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white ring-2 ring-card">
              3
            </span>
          </button>

          {/* User avatar with dropdown */}
          <div ref={dropdownRef} className="relative ml-1.5">
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2.5 rounded-full border border-border bg-white py-1 pl-1 pr-3 shadow-sm transition-all duration-200 hover:border-primary-200 hover:bg-primary-50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {user ? getInitials(user.name) : "?"}
              </div>
              <span className="hidden text-sm font-medium text-text-primary sm:inline">
                {user?.name.split(" ")[0] ?? "User"}
              </span>
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
                {/* User info header */}
                <div className="border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold text-text-primary">
                    {user?.name ?? "User"}
                  </p>
                  {user?.role && (
                    <span
                      className={cn(
                        "mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                        roleBadgeColors[user.role]
                      )}
                    >
                      {roleLabels[user.role]}
                    </span>
                  )}
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary transition-colors duration-150 hover:bg-primary-50 hover:text-text-primary"
                  >
                    <UserCircle className="h-4 w-4" />
                    My Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 transition-colors duration-150 hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
