"use client";

import { BottomNav } from "./BottomNav.component";
import { MobileHeader } from "./MobileHeader.component";

type MobileShellProps = {
  children: React.ReactNode;
  onNotificationOpen: () => void;
  onHouseholdSelect: (id: string) => void;
};

export function MobileShell({
  children,
  onNotificationOpen,
  onHouseholdSelect,
}: MobileShellProps) {
  return (
    <div className="flex h-[100dvh] w-full flex-col bg-zinc-950 text-zinc-100">
      <MobileHeader
        onNotificationOpen={onNotificationOpen}
        onHouseholdSelect={onHouseholdSelect}
      />
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
