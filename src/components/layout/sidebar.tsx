"use client";

import { useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  IndianRupee,
  UserCog,
  BarChart3,
  Settings,
  Scale,
  ChevronLeft,
  X,
  UserCircle,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebar-store";
import { useAuthStore } from "@/store/auth-store";
import type { RolePermissions } from "@/store/auth-store";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permissionCheck?: (permissions: RolePermissions) => boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  {
    label: "Cases",
    href: "/cases",
    icon: Briefcase,
    permissionCheck: (p) => p.canManageCases || p.canViewAllCases,
  },
  {
    label: "Clients",
    href: "/clients",
    icon: Users,
    permissionCheck: (p) => p.canViewClients,
  },
  {
    label: "Finance",
    href: "/finance",
    icon: IndianRupee,
    permissionCheck: (p) => p.canViewFinance,
  },
  {
    label: "Employees",
    href: "/employees",
    icon: UserCog,
    permissionCheck: (p) => p.canManageEmployees,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    permissionCheck: (p) => p.canViewReports,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    permissionCheck: (p) => p.canManageSettings,
  },
  { label: "Profile", href: "/profile", icon: UserCircle },
];

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED_WIDTH = 72;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, isMobileOpen, toggle, setMobileOpen } =
    useSidebarStore();
  const user = useAuthStore((s) => s.user);
  const permissions = useAuthStore((s) => s.permissions);
  const logout = useAuthStore((s) => s.logout);

  const filteredNavItems = useMemo(() => {
    if (!permissions) return [];
    return navItems.filter(
      (item) => !item.permissionCheck || item.permissionCheck(permissions)
    );
  }, [permissions]);

  const handleLogout = useCallback(() => {
    logout();
    router.push("/login");
  }, [logout, router]);

  // Refs for GSAP targets
  const sidebarRef = useRef<HTMLElement>(null);
  const logoTextRef = useRef<HTMLSpanElement>(null);
  const navItemsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const navLabelsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const logoutLabelRef = useRef<HTMLSpanElement>(null);
  const userSectionRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<HTMLButtonElement>(null);
  const mobileSidebarRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);
  const initializedRef = useRef(false);

  const isActive = useCallback(
    (href: string) => {
      if (href === "/") return pathname === "/";
      return pathname.startsWith(href);
    },
    [pathname]
  );

  const setNavItemRef = useCallback(
    (el: HTMLAnchorElement | null, index: number) => {
      navItemsRef.current[index] = el;
    },
    []
  );

  const setNavLabelRef = useCallback(
    (el: HTMLSpanElement | null, index: number) => {
      navLabelsRef.current[index] = el;
    },
    []
  );

  // Mount animation: stagger nav items sliding in
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const items = navItemsRef.current.filter(Boolean);
    if (items.length === 0) return;

    gsap.fromTo(
      items,
      { x: -30, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 0.4,
        stagger: 0.06,
        ease: "power3.out",
        delay: 0.15,
      }
    );
  }, []);

  // Sidebar width animation on collapse/expand
  useEffect(() => {
    if (!sidebarRef.current) return;

    const targetWidth = isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

    // On first render, set immediately without animation
    if (!initializedRef.current) {
      initializedRef.current = true;
      gsap.set(sidebarRef.current, { width: targetWidth });
      // Set initial state for collapsible elements
      const labels = navLabelsRef.current.filter(Boolean);
      if (isCollapsed) {
        gsap.set(labels, { opacity: 0, width: 0 });
        if (logoTextRef.current) gsap.set(logoTextRef.current, { opacity: 0, width: 0 });
        if (logoutLabelRef.current) gsap.set(logoutLabelRef.current, { opacity: 0, width: 0 });
        if (userSectionRef.current) gsap.set(userSectionRef.current, { opacity: 0, width: 0 });
      }
      // Set chevron rotation immediately (right-facing when collapsed)
      if (chevronRef.current) {
        gsap.set(chevronRef.current.querySelector("svg"), {
          rotation: isCollapsed ? 180 : 0,
        });
      }
      return;
    }

    // Animate sidebar width
    gsap.to(sidebarRef.current, {
      width: targetWidth,
      duration: 0.4,
      ease: "power2.inOut",
    });

    // Animate nav labels
    const labels = navLabelsRef.current.filter(Boolean);
    gsap.to(labels, {
      opacity: isCollapsed ? 0 : 1,
      width: isCollapsed ? 0 : "auto",
      duration: 0.3,
      ease: "power2.inOut",
    });

    // Animate logo text
    if (logoTextRef.current) {
      gsap.to(logoTextRef.current, {
        opacity: isCollapsed ? 0 : 1,
        width: isCollapsed ? 0 : "auto",
        duration: 0.3,
        ease: "power2.inOut",
      });
    }

    // Animate logout label (same as nav labels)
    if (logoutLabelRef.current) {
      gsap.to(logoutLabelRef.current, {
        opacity: isCollapsed ? 0 : 1,
        width: isCollapsed ? 0 : "auto",
        duration: 0.3,
        ease: "power2.inOut",
      });
    }

    // Animate user info section
    if (userSectionRef.current) {
      gsap.to(userSectionRef.current, {
        opacity: isCollapsed ? 0 : 1,
        width: isCollapsed ? 0 : "auto",
        duration: 0.3,
        ease: "power2.inOut",
      });
    }

    // Animate chevron rotation
    if (chevronRef.current) {
      gsap.to(chevronRef.current.querySelector("svg"), {
        rotation: isCollapsed ? 180 : 0,
        duration: 0.4,
        ease: "power2.inOut",
      });
    }
  }, [isCollapsed]);

  // Mobile sidebar slide-in/out animation
  useEffect(() => {
    if (!mobileSidebarRef.current || !backdropRef.current) return;

    const sidebar = mobileSidebarRef.current;
    const backdrop = backdropRef.current;

    if (isMobileOpen) {
      // Make backdrop interactive immediately
      backdrop.style.pointerEvents = "auto";

      // Slide in sidebar
      gsap.fromTo(
        sidebar,
        { x: -SIDEBAR_WIDTH },
        { x: 0, duration: 0.4, ease: "power3.out" }
      );
      // Fade in backdrop
      gsap.fromTo(
        backdrop,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: "power2.out" }
      );
    } else {
      // Slide out sidebar smoothly
      gsap.to(sidebar, {
        x: -SIDEBAR_WIDTH,
        duration: 0.35,
        ease: "power2.inOut",
      });
      // Fade out backdrop, then disable pointer events after animation
      gsap.to(backdrop, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.inOut",
        onComplete: () => {
          backdrop.style.pointerEvents = "none";
        },
      });
    }
  }, [isMobileOpen]);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-light shadow-lg shadow-primary-light/25">
          <Scale className="h-5 w-5 text-white" />
        </div>
        <span
          ref={logoTextRef}
          className="overflow-hidden whitespace-nowrap text-lg font-bold tracking-tight text-white"
        >
          LexOps
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {filteredNavItems.map((item, index) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              ref={(el) => setNavItemRef(el, index)}
              title={isCollapsed ? item.label : undefined}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                "transition-colors duration-150",
                active
                  ? "bg-sidebar-active text-white shadow-lg shadow-sidebar-active/25"
                  : "text-white/70 hover:bg-sidebar-hover hover:text-white"
              )}
              style={active ? { transform: "scale(1.02)" } : undefined}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors duration-150",
                  active
                    ? "text-white"
                    : "text-white/50 group-hover:text-white/80"
                )}
              />
              <span
                ref={(el) => setNavLabelRef(el, index)}
                className="overflow-hidden whitespace-nowrap"
              >
                {item.label}
              </span>
              {/* Active indicator bar */}
              {active && (
                <div className="absolute right-0 top-1/2 h-6 w-0.75 -translate-y-1/2 rounded-l-full bg-white/80" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle - desktop only */}
      <div className="hidden border-t border-white/10 px-3 py-2 lg:block">
        <button
          ref={chevronRef}
          onClick={toggle}
          className={cn(
            "flex w-full items-center justify-center rounded-xl p-2.5",
            "text-white/50 transition-colors duration-150",
            "hover:bg-sidebar-hover hover:text-white"
          )}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Logout button */}
      <div className="border-t border-white/10 px-3 py-2">
        <button
          onClick={handleLogout}
          title={isCollapsed ? "Logout" : undefined}
          className={cn(
            "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
            "text-white/70 transition-all duration-200",
            "hover:bg-red-500/10 hover:text-red-400"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0 transition-colors duration-200 group-hover:text-red-400" />
          <span
            ref={logoutLabelRef}
            className="overflow-hidden whitespace-nowrap"
          >
            Logout
          </span>
        </button>
      </div>

      {/* User section */}
      <Link
        href="/profile"
        onClick={() => setMobileOpen(false)}
        className="block border-t border-white/10 px-3 py-4 transition-colors hover:bg-sidebar-hover"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-white shadow-md shadow-primary-light/20">
            {user ? getInitials(user.name) : "?"}
          </div>
          <div
            ref={userSectionRef}
            className="min-w-0 overflow-hidden whitespace-nowrap"
          >
            <p className="truncate text-sm font-medium text-white">
              {user?.name ?? "User"}
            </p>
            <p className="truncate text-xs text-white/50">{user?.email ?? ""}</p>
          </div>
        </div>
      </Link>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — width controlled entirely by GSAP, no reactive inline style */}
      <aside
        ref={sidebarRef}
        className="fixed inset-y-0 left-0 z-40 hidden overflow-hidden border-r border-white/5 lg:block"
        style={{ width: SIDEBAR_WIDTH }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile backdrop — pointer-events managed by GSAP onComplete */}
      <div
        ref={backdropRef}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        style={{ opacity: 0, pointerEvents: "none" }}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile sidebar */}
      <aside
        ref={mobileSidebarRef}
        className="fixed inset-y-0 left-0 z-50 lg:hidden"
        style={{
          width: SIDEBAR_WIDTH,
          transform: `translateX(-${SIDEBAR_WIDTH}px)`,
        }}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-4 z-10 rounded-xl p-1.5 text-white/50 transition-colors hover:bg-sidebar-hover hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}
