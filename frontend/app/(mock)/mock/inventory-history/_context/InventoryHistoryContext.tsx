"use client";

import { useState, type ReactNode } from "react";
import {
  InventoryHistoryProvider,
  type InventoryHistoryDataPort,
  type InventoryHistoryContextType,
  type InventoryHistoryProviderProps,
} from "@/app/(current)/inventory-history/_context/InventoryHistoryContext";
import {
  MOCK_HISTORY_HOUSEHOLDS,
  MOCK_HISTORY_LEDGER,
} from "./inventory-history-mock.service";

export type { InventoryHistoryContextType, InventoryHistoryProviderProps };
export {
  InventoryHistoryContext,
} from "@/app/(current)/inventory-history/_context/InventoryHistoryContext";

/**
 * mock 경로 전용 Provider.
 * 인메모리 시드 데이터를 사용하며 구독은 no-op이다.
 */
export function MockInventoryHistoryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [port] = useState<InventoryHistoryDataPort>(() => ({
    initialHouseholds: () => structuredClone(MOCK_HISTORY_HOUSEHOLDS),
    initialLedger: () => MOCK_HISTORY_LEDGER,
    subscribe: () => () => {},
  }));

  return (
    <InventoryHistoryProvider port={port}>{children}</InventoryHistoryProvider>
  );
}
