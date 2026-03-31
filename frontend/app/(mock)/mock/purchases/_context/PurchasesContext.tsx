"use client";

import {
  getHouseholds,
  getPurchases,
  setPurchases,
} from "@/lib/local-store";
import { cloneDefaultCatalog } from "../../dashboard/_context/dashboard-mock.service";
import { MOCK_SEED_HOUSEHOLDS } from "../../dashboard/_context/dashboard-mock.service";
import {
  getMockPurchasesSession,
  subscribeMockPurchasesSession,
  updateMockPurchasesSession,
} from "./purchases-mock.service";
import { APP_PAGE_MIN_LOADING_MS } from "@/app/_ui/app-loading-state";
import type {
  Household,
  ProductCatalog,
  PurchaseBatchLot,
  PurchaseRecord,
} from "@/types/domain";

/* ─────────────────────── API helpers ─────────────────────── */

async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const json = (await res.json()) as { success: boolean; data: T; message?: string };
  if (!json.success) throw new Error(json.message ?? "API 오류");
  return json.data;
}

interface ApiPurchase {
  id: string;
  householdId: string;
  inventoryItemId: string | null;
  unitPrice: number;
  purchasedAt: string;
  supplierName: string | null;
  itemName: string | null;
  variantCaption: string | null;
  unitSymbol: string | null;
}

interface ApiPurchaseBatch {
  id: string;
  purchaseId: string;
  quantity: number;
  expirationDate: string | null;
}

function mapApiToPurchaseRecord(
  p: ApiPurchase,
  batches: ApiPurchaseBatch[],
): PurchaseRecord {
  const myBatches = batches.filter((b) => b.purchaseId === p.id);
  const totalQty = myBatches.reduce((s, b) => s + b.quantity, 0);
  return {
    id: p.id,
    householdId: p.householdId,
    inventoryItemId: p.inventoryItemId ?? undefined,
    itemName: p.itemName ?? "",
    variantCaption: p.variantCaption ?? undefined,
    unitSymbol: p.unitSymbol ?? "",
    purchasedOn: p.purchasedAt.slice(0, 10),
    unitPrice: p.unitPrice,
    totalPrice: p.unitPrice * (totalQty || 1),
    supplierName: p.supplierName ?? undefined,
    batches: myBatches.map(
      (b): PurchaseBatchLot => ({
        id: b.id,
        quantity: b.quantity,
        expiresOn: b.expirationDate?.slice(0, 10) ?? "",
      }),
    ),
  };
}

async function loadPurchasesFromApi(
  households: Household[],
): Promise<PurchaseRecord[]> {
  if (households.length === 0) return [];
  const results = await Promise.all(
    households.map(async (h) => {
      try {
        const [purchases, batches] = await Promise.all([
          apiFetch<ApiPurchase[]>(`/api/households/${h.id}/purchases`),
          apiFetch<ApiPurchaseBatch[]>(`/api/households/${h.id}/batches`),
        ]);
        return purchases.map((p) => mapApiToPurchaseRecord(p, batches));
      } catch {
        return [];
      }
    }),
  );
  return results.flat();
}
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PurchasesDataMode = "mock" | "api";

export type PurchasesContextType = {
  dataMode: PurchasesDataMode;
  households: Household[];
  productCatalog: ProductCatalog;
  purchases: PurchaseRecord[];
  loading: boolean;
  error: string | null;
  /** 대시보드 등에서 거점을 바꾼 뒤 이 화면으로 올 때 최신 `him-households` 반영 */
  거점_목록을_새로_고친다: () => void;
  /** `him-purchases`를 다시 읽는다 */
  구매_목록을_불러온다: () => void;
  구매를_추가_한다: (draft: Omit<PurchaseRecord, "id">) => void;
  구매를_삭제_한다: (purchaseId: string) => void;
};

export type PurchasesProviderProps = {
  children: ReactNode;
  dataMode: PurchasesDataMode;
};

export const PurchasesContext = createContext<
  PurchasesContextType | undefined
>(undefined);

function mock거점_스냅샷을_구한다(loaded: Household[]): Household[] {
  if (loaded.length > 0) return loaded;
  return structuredClone(MOCK_SEED_HOUSEHOLDS);
}

export function PurchasesProvider({
  children,
  dataMode,
}: PurchasesProviderProps) {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [purchases, setPurchasesState] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t0 =
      typeof performance !== "undefined" ? performance.now() : Date.now();

    void (async () => {
      try {
        const fromStoreH = getHouseholds();
        const nextHouseholds =
          dataMode === "mock"
            ? mock거점_스냅샷을_구한다(fromStoreH)
            : fromStoreH;

        let nextPurchases: PurchaseRecord[];
        if (dataMode === "mock") {
          nextPurchases = getMockPurchasesSession();
        } else if (dataMode === "api") {
          nextPurchases = await loadPurchasesFromApi(nextHouseholds);
        } else {
          nextPurchases = getPurchases();
        }

        const elapsed =
          (typeof performance !== "undefined" ? performance.now() : Date.now()) -
          t0;
        const rest = Math.max(0, APP_PAGE_MIN_LOADING_MS - elapsed);
        if (rest > 0) {
          await new Promise((r) => setTimeout(r, rest));
        }
        if (cancelled) return;

        setHouseholds(nextHouseholds);
        setPurchasesState(nextPurchases);
        setError(null);
      } catch (e) {
        console.error("구매 화면 초기 로드 오류:", e);
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : "데이터를 불러오는 중 오류가 발생했습니다.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dataMode]);

  useEffect(() => {
    if (dataMode !== "mock") return;
    return subscribeMockPurchasesSession(() => {
      setPurchasesState(getMockPurchasesSession());
    });
  }, [dataMode]);

  const 거점_목록을_새로_고친다 = useCallback(() => {
    const fromStore = getHouseholds();
    setHouseholds(
      dataMode === "mock"
        ? mock거점_스냅샷을_구한다(fromStore)
        : fromStore,
    );
  }, [dataMode]);

  const 구매_목록을_불러온다 = useCallback(() => {
    if (dataMode === "api") {
      const hs = getHouseholds();
      void loadPurchasesFromApi(hs).then((list) => setPurchasesState(list));
      return;
    }
    setPurchasesState(
      dataMode === "mock" ? getMockPurchasesSession() : getPurchases(),
    );
  }, [dataMode]);

  const 구매를_추가_한다 = useCallback(
    (draft: Omit<PurchaseRecord, "id">) => {
      if (dataMode === "mock") {
        const row: PurchaseRecord = { ...draft, id: crypto.randomUUID() };
        updateMockPurchasesSession((prev) => [...prev, row]);
        setPurchasesState(getMockPurchasesSession());
        return;
      }

      if (dataMode === "api") {
        void (async () => {
          try {
            await apiFetch(`/api/households/${draft.householdId}/purchases`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                inventoryItemId: draft.inventoryItemId,
                unitPrice: draft.unitPrice,
                purchasedAt: draft.purchasedOn,
                supplierName: draft.supplierName,
                itemName: draft.itemName,
                variantCaption: draft.variantCaption,
                unitSymbol: draft.unitSymbol,
                batches: draft.batches.map((b) => ({
                  quantity: b.quantity,
                  expirationDate: b.expiresOn || undefined,
                })),
              }),
            });
            구매_목록을_불러온다();
          } catch (e) {
            console.error("구매 등록 오류:", e);
          }
        })();
        return;
      }

      const row: PurchaseRecord = { ...draft, id: crypto.randomUUID() };
      setPurchasesState((prev) => {
        const next = [...prev, row];
        setPurchases(next);
        return next;
      });
    },
    [dataMode, 구매_목록을_불러온다],
  );

  const 구매를_삭제_한다 = useCallback(
    (purchaseId: string) => {
      if (dataMode === "mock") {
        updateMockPurchasesSession((prev) =>
          prev.filter((p) => p.id !== purchaseId),
        );
        setPurchasesState(getMockPurchasesSession());
        return;
      }
      if (dataMode === "api") {
        // 백엔드에 구매 삭제 API 미존재 — 목록 새로고침만
        구매_목록을_불러온다();
        return;
      }
      setPurchasesState((prev) => {
        const next = prev.filter((p) => p.id !== purchaseId);
        setPurchases(next);
        return next;
      });
    },
    [dataMode, 구매_목록을_불러온다],
  );

  /** 첫 번째 거점의 카탈로그를 대표로 사용 (구매 화면에서 카탈로그 직접 사용 안 함) */
  const productCatalog = useMemo<ProductCatalog>(
    () => households[0]?.catalog ?? cloneDefaultCatalog(),
    [households],
  );

  const value = useMemo<PurchasesContextType>(
    () => ({
      dataMode,
      households,
      productCatalog,
      purchases,
      loading,
      error,
      거점_목록을_새로_고친다,
      구매_목록을_불러온다,
      구매를_추가_한다,
      구매를_삭제_한다,
    }),
    [
      dataMode,
      households,
      productCatalog,
      purchases,
      loading,
      error,
      거점_목록을_새로_고친다,
      구매_목록을_불러온다,
      구매를_추가_한다,
      구매를_삭제_한다,
    ],
  );

  return (
    <PurchasesContext.Provider value={value}>
      {children}
    </PurchasesContext.Provider>
  );
}
