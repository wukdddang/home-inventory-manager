"use client";

/**
 * Appliances 베이스 Provider + API 서비스 주입 래퍼.
 *
 * 구조:
 *   AppliancesProvider        — port 를 주입받아 동작하는 베이스 Provider.
 *   apiAppliancesService      — API 호출 기반 서비스 구현체 (향후 구현).
 *   CurrentAppliancesProvider — apiAppliancesService 를 주입하는 API 전용 래퍼.
 *
 * mock 전용 래퍼(MockAppliancesProvider)는
 * `(mock)/mock/appliances/_context/AppliancesContext` 에 있다.
 */

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getHouseholds } from "@/lib/local-store";
import { MOCK_SEED_HOUSEHOLDS } from "@/app/(mock)/mock/dashboard/_context/dashboard-mock.service";
import { APP_PAGE_MIN_LOADING_MS } from "@/app/_ui/app-loading-state";
import type {
  Appliance,
  ApplianceStatus,
  Household,
  MaintenanceLog,
  MaintenanceLogType,
  MaintenanceSchedule,
} from "@/types/domain";

/* ─────────────────────── Port ─────────────────────── */

export type AppliancesDataPort = {
  getInitialHouseholds(fromStore: Household[]): Household[];
  loadAppliances(households: Household[]): Promise<Appliance[]>;
  loadSchedules(applianceIds: string[]): Promise<MaintenanceSchedule[]>;
  loadLogs(applianceIds: string[]): Promise<MaintenanceLog[]>;

  addAppliance(
    draft: Omit<Appliance, "id" | "createdAt">,
    onSuccess: () => void,
  ): Promise<void>;
  updateAppliance(
    appliance: Appliance,
    onSuccess: () => void,
  ): Promise<void>;
  disposeAppliance(
    applianceId: string,
    disposedOn: string,
    onSuccess: () => void,
  ): Promise<void>;

  addSchedule(
    draft: Omit<MaintenanceSchedule, "id">,
    onSuccess: () => void,
  ): Promise<void>;
  updateSchedule(
    schedule: MaintenanceSchedule,
    onSuccess: () => void,
  ): Promise<void>;

  addLog(
    draft: Omit<MaintenanceLog, "id" | "createdAt">,
    onSuccess: () => void,
  ): Promise<void>;

  subscribeAppliances(set: (list: Appliance[]) => void): () => void;
  subscribeSchedules(set: (list: MaintenanceSchedule[]) => void): () => void;
  subscribeLogs(set: (list: MaintenanceLog[]) => void): () => void;
};

/* ─────────────────────── Context Type ─────────────────────── */

export type AppliancesDataMode = "mock" | "api";

export type ApplianceStatusFilter = "active" | "disposed" | "all";
export type MaintenanceLogTypeFilter = MaintenanceLogType | "all";

export type AppliancesContextType = {
  dataMode: AppliancesDataMode;
  households: Household[];
  appliances: Appliance[];
  schedules: MaintenanceSchedule[];
  logs: MaintenanceLog[];
  loading: boolean;
  error: string | null;

  /** 현재 선택된 가전 */
  selectedAppliance: Appliance | null;
  가전을_선택한다: (appliance: Appliance | null) => void;

  /** 필터 */
  statusFilter: ApplianceStatusFilter;
  상태_필터를_변경한다: (filter: ApplianceStatusFilter) => void;
  logTypeFilter: MaintenanceLogTypeFilter;
  이력_유형_필터를_변경한다: (filter: MaintenanceLogTypeFilter) => void;

  /** CRUD */
  가전을_등록한다: (draft: Omit<Appliance, "id" | "createdAt">) => void;
  가전을_수정한다: (appliance: Appliance) => void;
  가전을_폐기한다: (applianceId: string, disposedOn: string) => void;
  스케줄을_등록한다: (draft: Omit<MaintenanceSchedule, "id">) => void;
  스케줄을_수정한다: (schedule: MaintenanceSchedule) => void;
  이력을_기록한다: (draft: Omit<MaintenanceLog, "id" | "createdAt">) => void;
  데이터를_새로_불러온다: () => void;
};

export type AppliancesProviderProps = {
  children: ReactNode;
  port: AppliancesDataPort;
  dataMode: AppliancesDataMode;
};

export const AppliancesContext = createContext<
  AppliancesContextType | undefined
>(undefined);

/* ─────────────────────── 유지보수 다음 예정일 계산 ─────────────────────── */

function 다음_예정일을_계산한다(
  currentDue: string,
  rule: MaintenanceSchedule["repeatRule"],
): string {
  const d = new Date(currentDue);
  switch (rule) {
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "quarterly":
      d.setMonth(d.getMonth() + 3);
      break;
    case "semiannual":
      d.setMonth(d.getMonth() + 6);
      break;
    case "annual":
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d.toISOString().slice(0, 10);
}

/* ─────────────────────── Base Provider ─────────────────────── */

export function AppliancesProvider({
  children,
  port,
  dataMode,
}: AppliancesProviderProps) {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppliance, setSelectedAppliance] =
    useState<Appliance | null>(null);
  const [statusFilter, setStatusFilter] =
    useState<ApplianceStatusFilter>("active");
  const [logTypeFilter, setLogTypeFilter] =
    useState<MaintenanceLogTypeFilter>("all");

  // 초기 로드
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t0 =
      typeof performance !== "undefined" ? performance.now() : Date.now();

    void (async () => {
      try {
        const fromStoreH = getHouseholds();
        const nextHouseholds = port.getInitialHouseholds(fromStoreH);
        const nextAppliances = await port.loadAppliances(nextHouseholds);
        const appIds = nextAppliances.map((a) => a.id);
        const [nextSchedules, nextLogs] = await Promise.all([
          port.loadSchedules(appIds),
          port.loadLogs(appIds),
        ]);

        const elapsed =
          (typeof performance !== "undefined"
            ? performance.now()
            : Date.now()) - t0;
        const rest = Math.max(0, APP_PAGE_MIN_LOADING_MS - elapsed);
        if (rest > 0) await new Promise((r) => setTimeout(r, rest));
        if (cancelled) return;

        setHouseholds(nextHouseholds);
        setAppliances(nextAppliances);
        setSchedules(nextSchedules);
        setLogs(nextLogs);
        setError(null);
      } catch (e) {
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

  // 구독
  useEffect(() => port.subscribeAppliances(setAppliances), [port]);
  useEffect(() => port.subscribeSchedules(setSchedules), [port]);
  useEffect(() => port.subscribeLogs(setLogs), [port]);

  const 데이터를_새로_불러온다 = useCallback(() => {
    void (async () => {
      const fromStore = getHouseholds();
      const hh = port.getInitialHouseholds(fromStore);
      setHouseholds(hh);
      const apps = await port.loadAppliances(hh);
      setAppliances(apps);
      const ids = apps.map((a) => a.id);
      const [sch, lg] = await Promise.all([
        port.loadSchedules(ids),
        port.loadLogs(ids),
      ]);
      setSchedules(sch);
      setLogs(lg);
    })();
  }, [port]);

  const 가전을_등록한다 = useCallback(
    (draft: Omit<Appliance, "id" | "createdAt">) => {
      void port
        .addAppliance(draft, 데이터를_새로_불러온다)
        .catch((e) => console.error("가전 등록 오류:", e));
    },
    [port, 데이터를_새로_불러온다],
  );

  const 가전을_수정한다 = useCallback(
    (appliance: Appliance) => {
      void port
        .updateAppliance(appliance, () => {
          setSelectedAppliance((prev) =>
            prev?.id === appliance.id ? appliance : prev,
          );
          데이터를_새로_불러온다();
        })
        .catch((e) => console.error("가전 수정 오류:", e));
    },
    [port, 데이터를_새로_불러온다],
  );

  const 가전을_폐기한다 = useCallback(
    (applianceId: string, disposedOn: string) => {
      void port
        .disposeAppliance(applianceId, disposedOn, 데이터를_새로_불러온다)
        .catch((e) => console.error("가전 폐기 오류:", e));
    },
    [port, 데이터를_새로_불러온다],
  );

  const 스케줄을_등록한다 = useCallback(
    (draft: Omit<MaintenanceSchedule, "id">) => {
      void port
        .addSchedule(draft, 데이터를_새로_불러온다)
        .catch((e) => console.error("스케줄 등록 오류:", e));
    },
    [port, 데이터를_새로_불러온다],
  );

  const 스케줄을_수정한다 = useCallback(
    (schedule: MaintenanceSchedule) => {
      void port
        .updateSchedule(schedule, 데이터를_새로_불러온다)
        .catch((e) => console.error("스케줄 수정 오류:", e));
    },
    [port, 데이터를_새로_불러온다],
  );

  const 이력을_기록한다 = useCallback(
    (draft: Omit<MaintenanceLog, "id" | "createdAt">) => {
      void port
        .addLog(draft, () => {
          // 정기 유지보수 완료 시 다음 예정일 자동 갱신
          if (draft.scheduleId) {
            const sch = schedules.find((s) => s.id === draft.scheduleId);
            if (sch) {
              const next = 다음_예정일을_계산한다(sch.nextDueDate, sch.repeatRule);
              void port.updateSchedule(
                { ...sch, nextDueDate: next },
                데이터를_새로_불러온다,
              );
              return;
            }
          }
          데이터를_새로_불러온다();
        })
        .catch((e) => console.error("이력 기록 오류:", e));
    },
    [port, schedules, 데이터를_새로_불러온다],
  );

  const value = useMemo<AppliancesContextType>(
    () => ({
      dataMode,
      households,
      appliances,
      schedules,
      logs,
      loading,
      error,
      selectedAppliance,
      가전을_선택한다: setSelectedAppliance,
      statusFilter,
      상태_필터를_변경한다: setStatusFilter,
      logTypeFilter,
      이력_유형_필터를_변경한다: setLogTypeFilter,
      가전을_등록한다,
      가전을_수정한다,
      가전을_폐기한다,
      스케줄을_등록한다,
      스케줄을_수정한다,
      이력을_기록한다,
      데이터를_새로_불러온다,
    }),
    [
      dataMode,
      households,
      appliances,
      schedules,
      logs,
      loading,
      error,
      selectedAppliance,
      statusFilter,
      logTypeFilter,
      가전을_등록한다,
      가전을_수정한다,
      가전을_폐기한다,
      스케줄을_등록한다,
      스케줄을_수정한다,
      이력을_기록한다,
      데이터를_새로_불러온다,
    ],
  );

  return (
    <AppliancesContext.Provider value={value}>
      {children}
    </AppliancesContext.Provider>
  );
}

/* ─────────────────────── API Service (placeholder) ─────────────────────── */

const apiAppliancesService: AppliancesDataPort = {
  getInitialHouseholds: (fromStore) => fromStore,
  loadAppliances: async () => [],
  loadSchedules: async () => [],
  loadLogs: async () => [],
  addAppliance: async (_, onSuccess) => onSuccess(),
  updateAppliance: async (_, onSuccess) => onSuccess(),
  disposeAppliance: async (_, __, onSuccess) => onSuccess(),
  addSchedule: async (_, onSuccess) => onSuccess(),
  updateSchedule: async (_, onSuccess) => onSuccess(),
  addLog: async (_, onSuccess) => onSuccess(),
  subscribeAppliances: () => () => {},
  subscribeSchedules: () => () => {},
  subscribeLogs: () => () => {},
};

/* ─────────────────────── Current Provider ─────────────────────── */

export function CurrentAppliancesProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AppliancesProvider port={apiAppliancesService} dataMode="api">
      {children}
    </AppliancesProvider>
  );
}
