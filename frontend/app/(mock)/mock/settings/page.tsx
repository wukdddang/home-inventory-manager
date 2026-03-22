"use client";

import { usePathname } from "next/navigation";
import { DashboardProvider } from "../dashboard/_context/DashboardContext";
import { SettingsProvider } from "./_context/SettingsContext";
import { SettingsPanel } from "./_ui/SettingsPage.panel";

export default function SettingsPage() {
  const pathname = usePathname();
  const dataMode = pathname.startsWith("/mock") ? "mock" : "api";

  return (
    <DashboardProvider dataMode={dataMode}>
      <SettingsProvider>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <SettingsPanel />
        </div>
      </SettingsProvider>
    </DashboardProvider>
  );
}
