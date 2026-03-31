"use client";

import { usePathname } from "next/navigation";
import { useDeviceLayout } from "@/hooks/useDeviceLayout";
import { MockInventoryHistoryProvider } from "./_context/InventoryHistoryContext";
import { CurrentInventoryHistoryProvider } from "@/app/(current)/inventory-history/_context/InventoryHistoryContext";
import { InventoryHistoryScreen } from "./InventoryHistoryScreen";
import { InventoryHistoryMobilePanel } from "./_ui/InventoryHistoryMobile.panel";

export default function InventoryHistoryPage() {
  const { isMobileLayout } = useDeviceLayout();
  const pathname = usePathname();
  const ProviderWrapper = pathname.startsWith("/mock")
    ? MockInventoryHistoryProvider
    : CurrentInventoryHistoryProvider;

  return (
    <ProviderWrapper>
      {isMobileLayout ? (
        <InventoryHistoryMobilePanel />
      ) : (
        <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden max-lg:hidden">
          <InventoryHistoryScreen />
        </div>
      )}
    </ProviderWrapper>
  );
}
