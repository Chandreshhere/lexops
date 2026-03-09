"use client";

import { usePathname } from "next/navigation";
import { AppLayout } from "./app-layout";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return <AppLayout>{children}</AppLayout>;
}
