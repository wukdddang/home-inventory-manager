"use client";

import { SettingsProvider } from "./_context/SettingsContext";
import { SettingsPanel } from "./_ui/SettingsPage.panel";

export default function SettingsPage() {
  return (
    <SettingsProvider>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <SettingsPanel />
      </div>
    </SettingsProvider>
  );
}
