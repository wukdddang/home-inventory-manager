"use client";

import { InventoryHistoryProvider } from "./_context/InventoryHistoryContext";
import { InventoryHistoryScreen } from "./InventoryHistoryScreen";

export default function InventoryHistoryPage() {
  return (
    <InventoryHistoryProvider>
      <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
        <InventoryHistoryScreen />
      </div>
    </InventoryHistoryProvider>
  );
}
