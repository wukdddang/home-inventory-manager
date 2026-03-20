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
        <SettingsPanel />
      </SettingsProvider>
    </DashboardProvider>
  );
}
