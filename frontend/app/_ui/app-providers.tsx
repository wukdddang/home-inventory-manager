"use client";

import { Toaster } from "@/app/_ui/feedback/sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
      <Toaster />
    </>
  );
}
