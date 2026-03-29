"use client";

import { useDeviceLayout } from "@/hooks/useDeviceLayout";
import { DashboardScreen } from "./DashboardScreen";
import { DashboardMobilePanel } from "./_ui/DashboardMobile.panel";

export default function DashboardPage() {
  const { isMobileLayout } = useDeviceLayout();

  if (isMobileLayout) {
    return <DashboardMobilePanel />;
  }

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
      <DashboardScreen />
    </div>
  );
}
