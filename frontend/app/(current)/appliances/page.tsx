"use client";

import { CurrentAppliancesProvider } from "./_context/AppliancesContext";
import { AppliancesScreen } from "@/app/(mock)/mock/appliances/AppliancesScreen";

export default function AppliancesPage() {
  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
      <CurrentAppliancesProvider>
        <AppliancesScreen />
      </CurrentAppliancesProvider>
    </div>
  );
}
