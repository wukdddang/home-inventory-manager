"use client";

import { DashboardPanel } from "./_ui/DashboardPage.panel";

/** 거점·재고 컨텍스트는 상위 `AppShell`의 `DashboardProvider`에서 제공합니다. */
export function DashboardScreen() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <DashboardPanel />
    </div>
  );
}
