"use client";

import { usePathname } from "next/navigation";
import { MockAppliancesProvider } from "./_context/AppliancesContext";
import { CurrentAppliancesProvider } from "@/app/(current)/appliances/_context/AppliancesContext";
import { AppliancesScreen } from "./AppliancesScreen";

export default function AppliancesPage() {
  const pathname = usePathname();
  const ProviderWrapper = pathname.startsWith("/mock")
    ? MockAppliancesProvider
    : CurrentAppliancesProvider;

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
      <ProviderWrapper>
        <AppliancesScreen />
      </ProviderWrapper>
    </div>
  );
}
