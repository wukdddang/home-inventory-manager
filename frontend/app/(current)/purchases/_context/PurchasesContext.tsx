"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getHouseholds, getPurchases } from "@/lib/local-store";
import { cloneDefaultCatalog } from "@/app/(mock)/mock/dashboard/_context/dashboard-mock.service";
import { APP_PAGE_MIN_LOADING_MS } from "@/app/_ui/app-loading-state";
import type {
  Household,
  ProductCatalog,
  PurchaseBatchLot,
  PurchaseRecord,
} from "@/types/domain";

/* ─────────────────────── Port ─────────────────────── */

/**
 * 구매 데이터 소스 포트.
 * mock(인메모리 세션)과 api(백엔드) 모두 이 인터페이스를 구현한다.
 */
export type PurchasesDataPort = {
  /** 초기 거점 목록을 결정한다. fromStore는 localStorage에서 읽은 거점 목록이다. */
  getInitialHouseholds(fromStore: Household[]): Household[];
  /** 거점 목록 기반으로 구매 목록을 로드한다. */
  loadPurchases(households: Household[]): Promise<PurchaseRecord[]>;
  /** 구매를 추가한다. 완료 후 onSuccess를 호출한다. */
  addPurchase(
    draft: Omit<PurchaseRecord, "id">,
    onSuccess: () => void,
  ): Promise<void>;
  /** 구매를 삭제한다. 완료 후 onSuccess를 호출한다. */
  removePurchase(purchaseId: string, onSuccess: () => void): Promise<void>;
  /**
   * 구매 목록 변경 구독 (mock: 세션 스토어 구독, api: no-op).
   * 반환값은 구독 해제 함수다.
   */
  subscribe(setPurchases: (list: PurchaseRecord[]) => void): () => void;
};

/* ─────────────────────── API helpers ─────────────────────── */

async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const json = (await res.json()) as {
    success: boolean;
    data: T;
    message?: string;
  };
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

/** current 경로용 API 서비스 */
const apiPurchasesService: PurchasesDataPort = {
  getInitialHouseholds: (fromStore) => fromStore,

  loadPurchases: (households) => loadPurchasesFromApi(households),

  async addPurchase(draft, onSuccess) {
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
      onSuccess();
    } catch (e) {
      console.error("구매 등록 오류:", e);
    }
  },

  async removePurchase(_purchaseId, onSuccess) {
    // 백엔드에 구매 삭제 API 미존재 — 목록 새로고침만
    onSuccess();
  },

  subscribe: () => () => {},
};

/* ─────────────────────── Context Type ─────────────────────── */

export type PurchasesDataMode = "mock" | "api";

export type PurchasesContextType = {
  dataMode: PurchasesDataMode;
  households: Household[];
  productCatalog: ProductCatalog;
  purchases: PurchaseRecord[];
  loading: boolean;
  error: string | null;
  거점_목록을_새로_고친다: () => void;
  구매_목록을_불러온다: () => void;
  구매를_추가_한다: (draft: Omit<PurchaseRecord, "id">) => void;
  구매를_삭제_한다: (purchaseId: string) => void;
};

export type PurchasesProviderProps = {
  children: ReactNode;
  port: PurchasesDataPort;
  dataMode: PurchasesDataMode;
};

export const PurchasesContext = createContext<
  PurchasesContextType | undefined
>(undefined);

/* ─────────────────────── Base Provider ─────────────────────── */

export function PurchasesProvider({
  children,
  port,
  dataMode,
}: PurchasesProviderProps) {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [purchases, setPurchasesState] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 초기 데이터 로드
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t0 =
      typeof performance !== "undefined" ? performance.now() : Date.now();

    void (async () => {
      try {
        const fromStoreH = getHouseholds();
        const nextHouseholds = port.getInitialHouseholds(fromStoreH);
        const nextPurchases = await port.loadPurchases(nextHouseholds);

        const elapsed =
          (typeof performance !== "undefined"
            ? performance.now()
            : Date.now()) - t0;
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
  }, [port]);

  // 구독 (mock: 세션 변경 감지, api: no-op)
  useEffect(() => {
    return port.subscribe(setPurchasesState);
  }, [port]);

  const 거점_목록을_새로_고친다 = useCallback(() => {
    const fromStore = getHouseholds();
    setHouseholds(port.getInitialHouseholds(fromStore));
  }, [port]);

  const 구매_목록을_불러온다 = useCallback(() => {
    void port
      .loadPurchases(households)
      .then(setPurchasesState)
      .catch((e) => console.error("구매 목록 로드 오류:", e));
  }, [port, households]);

  const 구매를_추가_한다 = useCallback(
    (draft: Omit<PurchaseRecord, "id">) => {
      void port
        .addPurchase(draft, 구매_목록을_불러온다)
        .catch((e) => console.error("구매 추가 오류:", e));
    },
    [port, 구매_목록을_불러온다],
  );

  const 구매를_삭제_한다 = useCallback(
    (purchaseId: string) => {
      void port
        .removePurchase(purchaseId, 구매_목록을_불러온다)
        .catch((e) => console.error("구매 삭제 오류:", e));
    },
    [port, 구매_목록을_불러온다],
  );

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

/* ─────────────────────── Current Provider ─────────────────────── */

/** current 경로 전용 Provider. 백엔드 API 서비스를 주입한다. */
export function CurrentPurchasesProvider({ children }: { children: ReactNode }) {
  return (
    <PurchasesProvider port={apiPurchasesService} dataMode="api">
      {children}
    </PurchasesProvider>
  );
}

/* ─────────────────────── getPurchases fallback (legacy) ─────────────────────── */
export { getPurchases };
