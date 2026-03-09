"use client";

import { useEffect, useState } from "react";

/**
 * Delays rendering children until Zustand persisted stores have rehydrated.
 * This prevents hydration mismatches between server and client when stores
 * like auth-store use zustand/persist with localStorage.
 */
export function HydrationGuard({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
