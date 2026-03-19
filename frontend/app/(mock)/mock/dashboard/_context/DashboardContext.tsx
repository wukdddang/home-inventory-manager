"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Household, HouseholdKind } from "@/types/domain";
import { newEntityId } from "../_lib/dashboard-helpers";
import { dashboardApiHouseholdsClient } from "./dashboard-api.service";
import type { DashboardHouseholdsPort } from "./dashboard-households.port";
import { createDashboardMockHouseholdsService } from "./dashboard-mock.service";

/** URL이 `/mock/...` 이면 mock, 그 외는 api (현재 localStorage, 이후 Route Handler) */
export type DashboardHouseholdsDataMode = "mock" | "api";

export type DashboardContextType = {
  /** mock / api(백엔드·Route Handler) — UI 분기용 */
  dataMode: DashboardHouseholdsDataMode;
  /** 데이터 소스에서 읽은 거점 목록 */
  households: Household[];
  /** 최초 하이드레이션·재조회 중 */
  loading: boolean;
  error: string | null;
  /** 현재 `dataMode`에 맞는 소스에서 거점 목록을 다시 읽는다 */
  거점_목록을_불러온다: () => void;
  /** 거점을 추가하고 새 id를 반환한다 */
  거점을_추가_한다: (name: string, kind: HouseholdKind) => string;
  /** 거점 id로 삭제한다 */
  거점을_삭제_한다: (householdId: string) => void;
  /** 특정 거점에 대해 불변 갱신 함수를 적용한다 */
  거점을_갱신_한다: (
    householdId: string,
    updater: (h: Household) => Household,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const 거점_목록을_불러온다 = useCallback(() => {
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const list = await householdsPort.list();
        setHouseholds(list);
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

  const 거점을_추가_한다 = useCallback((name: string, kind: HouseholdKind) => {
    const id = newEntityId();
    const h: Household = {
      id,
      name: name.trim() || "이름 없는 거점",
      kind,
      rooms: [],
      items: [],
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

  const value = useMemo<DashboardContextType>(
    () => ({
      dataMode,
      households,
      loading,
      error,
      거점_목록을_불러온다,
      거점을_추가_한다,
      거점을_삭제_한다,
      거점을_갱신_한다,
    }),
    [
      dataMode,
      households,
      loading,
      error,
      거점_목록을_불러온다,
      거점을_추가_한다,
      거점을_삭제_한다,
      거점을_갱신_한다,
    ],
  );

  return (
    <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
  );
}
