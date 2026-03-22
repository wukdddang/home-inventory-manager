"use client";

import {
  getHouseholds,
  getPurchases,
  getSharedProductCatalog,
  setPurchases,
} from "@/lib/local-store";
import { MOCK_SEED_HOUSEHOLDS } from "../../dashboard/_context/dashboard-mock.service";
import {
  getMockPurchasesSession,
  setMockPurchasesSession,
  subscribeMockPurchasesSession,
  updateMockPurchasesSession,
} from "../_lib/mock-purchases-session-store";
import { APP_PAGE_MIN_LOADING_MS } from "@/app/_ui/app-loading-state";
import type {
  Household,
  ProductCatalog,
  PurchaseRecord,
} from "@/types/domain";
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
  const [productCatalog, setProductCatalog] = useState<ProductCatalog>(() =>
    getSharedProductCatalog(),
  );
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
        const nextPurchases =
          dataMode === "mock"
            ? getMockPurchasesSession()
            : getPurchases();
        const catalog = getSharedProductCatalog();

        const elapsed =
          (typeof performance !== "undefined" ? performance.now() : Date.now()) -
          t0;
        const rest = Math.max(0, APP_PAGE_MIN_LOADING_MS - elapsed);
        if (rest > 0) {
          await new Promise((r) => setTimeout(r, rest));
        }
        if (cancelled) return;

        setHouseholds(nextHouseholds);
        setProductCatalog(catalog);
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
    setProductCatalog(getSharedProductCatalog());
  }, [dataMode]);

  const 구매_목록을_불러온다 = useCallback(() => {
    setPurchasesState(
      dataMode === "mock" ? getMockPurchasesSession() : getPurchases(),
    );
  }, [dataMode]);

  const 구매를_추가_한다 = useCallback(
    (draft: Omit<PurchaseRecord, "id">) => {
      const row: PurchaseRecord = {
        ...draft,
        id: crypto.randomUUID(),
      };
      if (dataMode === "mock") {
        updateMockPurchasesSession((prev) => [...prev, row]);
        setPurchasesState(getMockPurchasesSession());
        return;
      }
      setPurchasesState((prev) => {
        const next = [...prev, row];
        setPurchases(next);
        return next;
      });
    },
    [dataMode],
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
      setPurchasesState((prev) => {
        const next = prev.filter((p) => p.id !== purchaseId);
        setPurchases(next);
        return next;
      });
    },
    [dataMode],
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
