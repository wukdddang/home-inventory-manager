"use client";

import { useState, type ReactNode } from "react";
import {
  PurchasesProvider,
  type PurchasesDataPort,
  type PurchasesContextType,
  type PurchasesDataMode,
  type PurchasesProviderProps,
} from "@/app/(current)/purchases/_context/PurchasesContext";
import { MOCK_SEED_HOUSEHOLDS } from "../../dashboard/_context/dashboard-mock.service";
import {
  getMockPurchasesSession,
  subscribeMockPurchasesSession,
  updateMockPurchasesSession,
} from "./purchases-mock.service";
import type { PurchaseRecord } from "@/types/domain";

export type { PurchasesContextType, PurchasesDataMode, PurchasesProviderProps };
export { PurchasesContext } from "@/app/(current)/purchases/_context/PurchasesContext";

/**
 * mock 경로 전용 Provider.
 * 인메모리 세션 스토어를 사용하며 API 호출을 하지 않는다.
 */
export function MockPurchasesProvider({ children }: { children: ReactNode }) {
  const [port] = useState<PurchasesDataPort>(() => ({
    getInitialHouseholds: (fromStore) =>
      fromStore.length > 0 ? fromStore : structuredClone(MOCK_SEED_HOUSEHOLDS),

    loadPurchases: async () => getMockPurchasesSession(),

    addPurchase: async (draft, onSuccess) => {
      const row: PurchaseRecord = { ...draft, id: crypto.randomUUID() };
      updateMockPurchasesSession((prev) => [...prev, row]);
      onSuccess();
    },

    removePurchase: async (purchaseId, onSuccess) => {
      updateMockPurchasesSession((prev) =>
        prev.filter((p) => p.id !== purchaseId),
      );
      onSuccess();
    },

    subscribe: (setPurchases) =>
      subscribeMockPurchasesSession(() => {
        setPurchases(getMockPurchasesSession());
      }),
  }));

  return (
    <PurchasesProvider port={port} dataMode="mock">
      {children}
    </PurchasesProvider>
  );
}
