"use client";

import { usePathname } from "next/navigation";
import { useDeviceLayout } from "@/hooks/useDeviceLayout";
import { SettingsProvider } from "./_context/SettingsContext";
import { SettingsPanel } from "./_ui/SettingsPage.panel";
import { SettingsMobilePanel } from "./_ui/SettingsMobile.panel";

export default function SettingsPage() {
  const { isMobileLayout } = useDeviceLayout();
  const pathname = usePathname();
  const dataMode = pathname.startsWith("/mock") ? "mock" : "api";

  return (
    <SettingsProvider dataMode={dataMode}>
      {isMobileLayout ? (
        <SettingsMobilePanel />
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col max-lg:hidden">
          <SettingsPanel />
        </div>
      )}
    </SettingsProvider>
  );
}
