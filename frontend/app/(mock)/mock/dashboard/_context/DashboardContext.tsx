"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ensureHouseholdShape } from "@/lib/household-location";
import {
  cloneDefaultHouseholdKindDefinitions,
  sortHouseholdKindDefinitions,
} from "@/lib/household-kind-defaults";
import {
  getSharedHouseholdKindDefinitions,
  getSharedProductCatalog,
  setSharedHouseholdKindDefinitions,
  setSharedProductCatalog,
} from "@/lib/local-store";
import { cloneDefaultCatalog } from "@/lib/product-catalog-defaults";
import type {
  Household,
  HouseholdKindDefinition,
  ProductCatalog,
} from "@/types/domain";
import { newEntityId } from "../_lib/dashboard-helpers";
import { dashboardApiHouseholdsClient } from "./dashboard-api.service";
import type { DashboardHouseholdsPort } from "./dashboard-households.port";
import { createDashboardMockHouseholdsService } from "./dashboard-mock.service";

function normalizeHouseholdKinds(
  list: Household[],
  defs: HouseholdKindDefinition[],
): Household[] {
  const valid = new Set(defs.map((d) => d.id));
  const fallback = defs[0]?.id ?? "home";
  return list.map((h) => ({
    ...ensureHouseholdShape(h),
    kind: valid.has(h.kind) ? h.kind : fallback,
  }));
}

/** URL이 `/mock/...` 이면 mock, 그 외는 api (현재 localStorage, 이후 Route Handler) */
export type DashboardHouseholdsDataMode = "mock" | "api";

export type DashboardContextType = {
  /** mock / api(백엔드·Route Handler) — UI 분기용 */
  dataMode: DashboardHouseholdsDataMode;
  /** 데이터 소스에서 읽은 거점 목록 */
  households: Household[];
  /** 전역 공통 상품 카탈로그 (거점과 무관) */
  productCatalog: ProductCatalog;
  /** 공통 카탈로그가 로컬에서 하이드레이션됐는지 */
  catalogHydrated: boolean;
  /** 거점 유형 정의 (라벨 CRUD, 로컬 공유) */
  householdKindDefinitions: HouseholdKindDefinition[];
  /** 거점 유형 목록이 로컬에서 읽혔는지 (저장 effect 게이트) */
  householdKindsHydrated: boolean;
  /** 최초 하이드레이션·재조회 중 */
  loading: boolean;
  error: string | null;
  /** 현재 `dataMode`에 맞는 소스에서 거점 목록을 다시 읽는다 */
  거점_목록을_불러온다: () => void;
  /** 거점을 추가하고 새 id를 반환한다 */
  거점을_추가_한다: (name: string, kind: string) => string;
  /**
   * 거점 유형 목록을 통째로 교체한다. 삭제된 유형을 쓰는 거점은 남은 첫 유형으로 옮긴다.
   */
  거점_유형_정의를_교체_한다: (next: HouseholdKindDefinition[]) => void;
  /** 거점 id로 삭제한다 */
  거점을_삭제_한다: (householdId: string) => void;
  /** 특정 거점에 대해 불변 갱신 함수를 적용한다 */
  거점을_갱신_한다: (
    householdId: string,
    updater: (h: Household) => Household,
  ) => void;
  /** 공통 카탈로그 갱신 (저장소 동기화는 effect에서 처리) */
  카탈로그를_갱신_한다: (
    updater: (c: ProductCatalog) => ProductCatalog,
  ) => void;
};

export type DashboardProviderProps = {
  children: ReactNode;
  dataMode: DashboardHouseholdsDataMode;
};

export const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined,
);

export function DashboardProvider({
  children,
  dataMode,
}: DashboardProviderProps) {
  const householdsPort = useMemo<DashboardHouseholdsPort>(() => {
    if (dataMode === "mock") {
      return createDashboardMockHouseholdsService();
    }
    return dashboardApiHouseholdsClient;
  }, [dataMode]);

  const [households, setHouseholds] = useState<Household[]>([]);
  const [productCatalog, setProductCatalog] = useState<ProductCatalog>(() =>
    cloneDefaultCatalog(),
  );
  const [catalogHydrated, setCatalogHydrated] = useState(false);
  const [householdKindDefinitions, setHouseholdKindDefinitions] = useState<
    HouseholdKindDefinition[]
  >(() => cloneDefaultHouseholdKindDefinitions());
  const [householdKindsHydrated, setHouseholdKindsHydrated] = useState(false);
  const kindDefsRef = useRef(householdKindDefinitions);

  useLayoutEffect(() => {
    kindDefsRef.current = householdKindDefinitions;
  }, [householdKindDefinitions]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProductCatalog(getSharedProductCatalog());
    setCatalogHydrated(true);
  }, []);

  useEffect(() => {
    setHouseholdKindDefinitions(getSharedHouseholdKindDefinitions());
    setHouseholdKindsHydrated(true);
  }, []);

  useEffect(() => {
    if (!householdKindsHydrated) return;
    setSharedHouseholdKindDefinitions(householdKindDefinitions);
  }, [householdKindDefinitions, householdKindsHydrated]);

  useEffect(() => {
    if (!catalogHydrated) return;
    setSharedProductCatalog(productCatalog);
  }, [productCatalog, catalogHydrated]);

  const 거점_목록을_불러온다 = useCallback(() => {
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const list = await householdsPort.list();
        const defs = kindDefsRef.current;
        setHouseholds(normalizeHouseholdKinds(list, defs));
      } catch (err) {
        console.error("거점 목록 로드 오류:", err);
        setError(
          err instanceof Error
            ? err.message
            : "거점 목록을 불러오는 중 오류가 발생했습니다.",
        );
      } finally {
        setLoading(false);
        setHydrated(true);
      }
    })();
  }, [householdsPort]);

  useEffect(() => {
    거점_목록을_불러온다();
  }, [거점_목록을_불러온다]);

  useEffect(() => {
    if (!hydrated) return;
    void (async () => {
      try {
        await householdsPort.saveAll(households);
      } catch (err) {
        console.error("거점 목록 저장 오류:", err);
      }
    })();
  }, [households, hydrated, householdsPort]);

  const 거점_유형_정의를_교체_한다 = useCallback(
    (next: HouseholdKindDefinition[]) => {
      const cleaned = next
        .map((d, i) => ({
          id: d.id.trim(),
          label: d.label.trim(),
          sortOrder: d.sortOrder ?? i,
        }))
        .filter((d) => d.id && d.label);
      const sorted = sortHouseholdKindDefinitions(cleaned);
      if (sorted.length === 0) return;
      const valid = new Set(sorted.map((d) => d.id));
      const fallback = sorted[0].id;
      setHouseholds((prev) =>
        prev.map((h) => ({
          ...h,
          kind: valid.has(h.kind) ? h.kind : fallback,
        })),
      );
      setHouseholdKindDefinitions(sorted);
    },
    [],
  );

  const 거점을_추가_한다 = useCallback((name: string, kind: string) => {
    const defs = kindDefsRef.current;
    const valid = new Set(defs.map((d) => d.id));
    const resolved = valid.has(kind) ? kind : (defs[0]?.id ?? "home");
    const id = newEntityId();
    const h: Household = {
      id,
      name: name.trim() || "이름 없는 거점",
      kind: resolved,
      rooms: [],
      items: [],
      furniturePlacements: [],
      storageLocations: [],
      createdAt: new Date().toISOString(),
    };
    setHouseholds((prev) => [...prev, h]);
    return id;
  }, []);

  const 거점을_삭제_한다 = useCallback((householdId: string) => {
    setHouseholds((prev) => prev.filter((h) => h.id !== householdId));
  }, []);

  const 거점을_갱신_한다 = useCallback(
    (householdId: string, updater: (h: Household) => Household) => {
      setHouseholds((prev) =>
        prev.map((h) => (h.id === householdId ? updater(h) : h)),
      );
    },
    [],
  );

  const 카탈로그를_갱신_한다 = useCallback(
    (updater: (c: ProductCatalog) => ProductCatalog) => {
      setProductCatalog((c) => updater(structuredClone(c)));
    },
    [],
  );

  const value = useMemo<DashboardContextType>(
    () => ({
      dataMode,
      households,
      productCatalog,
      catalogHydrated,
      householdKindDefinitions,
      householdKindsHydrated,
      loading,
      error,
      거점_목록을_불러온다,
      거점을_추가_한다,
      거점을_삭제_한다,
      거점을_갱신_한다,
      거점_유형_정의를_교체_한다,
      카탈로그를_갱신_한다,
    }),
    [
      dataMode,
      households,
      productCatalog,
      catalogHydrated,
      householdKindDefinitions,
      householdKindsHydrated,
      loading,
      error,
      거점_목록을_불러온다,
      거점을_추가_한다,
      거점을_삭제_한다,
      거점을_갱신_한다,
      거점_유형_정의를_교체_한다,
      카탈로그를_갱신_한다,
    ],
  );

  return (
    <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
  );
}
