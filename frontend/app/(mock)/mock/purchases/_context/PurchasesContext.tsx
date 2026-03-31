"use client";

/**
 * mock 경로 전용 서비스 주입 래퍼.
 *
 * Provider 본체·Port 타입·CurrentPurchasesProvider·API 서비스는
 * `(current)/purchases/_context/PurchasesContext` 에 있다.
 *
 * 이 파일은 인메모리 세션 스토어(purchases-mock.service) 기반 포트를 생성해
 * 베이스 Provider 에 주입하는 MockPurchasesProvider 만 담당한다.
 * API 호출은 일절 없으며, 구독은 subscribeMockPurchasesSession 으로 처리된다.
 */

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
