"use client";

import { useRef, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { useSidebarStore } from "@/store/sidebar-store";
import { Sidebar } from "./sidebar";
import { TopNavbar } from "./top-navbar";
import { ToastContainer } from "@/components/ui/toast-container";

interface AppLayoutProps {
  children: React.ReactNode;
}

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED_WIDTH = 72;

/** Routes that render full-screen without sidebar / navbar */
const FULL_SCREEN_ROUTES = ["/login"];

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const isFullScreen = FULL_SCREEN_ROUTES.some((r) => pathname.startsWith(r));

  const { isCollapsed } = useSidebarStore();
  const mainRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const prevCollapsed = useRef(isCollapsed);
  const marginInitialized = useRef(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Detect desktop on mount and listen for resize
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);

    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Page content fade-in on mount
  useEffect(() => {
    if (!contentRef.current) return;

    gsap.fromTo(
      contentRef.current,
      { opacity: 0, y: 12 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out",
        delay: 0.2,
      }
    );
  }, []);

  // Smooth margin-left transition via GSAP when sidebar toggles
  useEffect(() => {
    if (!mainRef.current || !isDesktop || isFullScreen) return;

    const target = isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

    // First time: set immediately, no animation
    if (!marginInitialized.current) {
      marginInitialized.current = true;
      prevCollapsed.current = isCollapsed;
      gsap.set(mainRef.current, { marginLeft: target });
      return;
    }

    // Only animate if the value actually changed
    if (prevCollapsed.current !== isCollapsed) {
      prevCollapsed.current = isCollapsed;
      gsap.to(mainRef.current, {
        marginLeft: target,
        duration: 0.4,
        ease: "power2.inOut",
      });
    }
  }, [isCollapsed, isDesktop, isFullScreen]);

  // Full-screen pages bypass the entire shell
  if (isFullScreen) {
    return (
      <div className="min-h-screen bg-background">
        {children}
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopNavbar />

      <main
        ref={mainRef}
        className="min-h-screen pt-(--topbar-height)"
        style={{ marginLeft: 0 }}
      >
        <div
          ref={contentRef}
          className="h-[calc(100vh-var(--topbar-height))] overflow-y-auto p-4 sm:p-6"
        >
          {children}
        </div>
      </main>

      <ToastContainer />
    </div>
  );
}
