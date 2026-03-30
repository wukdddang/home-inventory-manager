"use client";

import { useDeviceLayout } from "@/hooks/useDeviceLayout";
import { InventoryHistoryProvider } from "./_context/InventoryHistoryContext";
import { InventoryHistoryScreen } from "./InventoryHistoryScreen";
import { InventoryHistoryMobilePanel } from "./_ui/InventoryHistoryMobile.panel";

export default function InventoryHistoryPage() {
  const { isMobileLayout } = useDeviceLayout();

  return (
    <InventoryHistoryProvider>
      {isMobileLayout ? (
        <InventoryHistoryMobilePanel />
      ) : (
        <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden max-lg:hidden">
          <InventoryHistoryScreen />
        </div>
      )}
    </InventoryHistoryProvider>
  );
}
