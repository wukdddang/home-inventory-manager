"use client";

/**
 * InventoryHistory 베이스 Provider + API 서비스 주입 래퍼.
 *
 * 구조:
 *   InventoryHistoryProvider        — port 를 주입받아 동작하는 베이스 Provider.
 *   CurrentInventoryHistoryProvider — local-store(API 대용) 를 주입하는 current 전용 래퍼.
 *
 * mock 전용 래퍼(MockInventoryHistoryProvider)는
 * `(mock)/mock/inventory-history/_context/InventoryHistoryContext` 에 있다.
 */

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  appendInventoryLedgerRow,
  getHouseholds,
  getInventoryLedger,
  subscribeInventoryHistoryBundle,
} from "@/lib/local-store";
import {
  iso를_날짜키로_만든다,
  날짜키가_기간에_포함되는가,
} from "@/lib/table-period-filter";
import type { Household, InventoryLedgerRow } from "@/types/domain";
import {
  DEFAULT_LEDGER_SORT,
  LEDGER_PAGE_SIZE,
  열_첫_정렬_방향을_구한다,
  열_필터_옵션을_추출한다,
  행_메모_문자열을_구한다,
  행_배열을_정렬한다,
  행이_검색어에_일치하는가,
  행이_컬럼_필터에_일치하는가,
  type ColumnFilterKey,
  type ColumnFilterOptions,
  type SortColumn,
  type SortPhase,
} from "@/app/(mock)/mock/inventory-history/_context/inventory-history-helpers.service";

/* ─────────────────────── Port ─────────────────────── */

/**
 * 재고 이력 데이터 소스 포트.
 * mock 과 api 가 이 인터페이스를 구현한다.
 */
export type InventoryHistoryDataPort = {
  /** 초기 거점 목록을 반환한다 */
  initialHouseholds(): Household[];
  /** 초기 재고 이력 원장 행을 반환한다 */
  initialLedger(): InventoryLedgerRow[];
  /**
   * 데이터 변경 구독.
   * 변경이 발생하면 `onH`(거점), `onL`(이력)로 최신 데이터를 전달한다.
   * 반환값은 구독 해제 함수다.
   */
  subscribe(
    onH: (h: Household[]) => void,
    onL: (l: InventoryLedgerRow[]) => void,
  ): () => void;
  /**
   * API 에서 모든 거점의 재고 이력을 비동기로 로드한다 (optional).
   * 반환된 행은 로컬 ledger 와 병합(id 기준 중복 제거)된다.
   */
  loadApiLedger?(): Promise<InventoryLedgerRow[]>;
  /**
   * 재고 수량을 수동 조정한다 (POST /logs/adjustment).
   * api: 실제 API 호출 + 로컬 ledger 행 추가.
   * mock: 로컬 ledger 행만 추가.
   */
  recordAdjustment?(
    householdId: string,
    itemId: string,
    itemLabel: string,
    quantityDelta: number,
    memo?: string,
  ): Promise<InventoryLedgerRow | null>;
};

/* ─────────────────────── Context Type ─────────────────────── */

export type InventoryHistoryContextType = {
  loading: boolean;
  households: Household[];
  paginatedRows: InventoryLedgerRow[];
  totalBase: number;
  totalFiltered: number;
  totalPages: number;
  activePageIndex: number;
  hasFilterContext: boolean;
  hasActiveColumnFilters: boolean;
  hasActivePeriodFilter: boolean;
  periodFilteredRowsCount: number;
  columnFilteredRowsCount: number;
  footerRangeStart: number;
  footerRangeEnd: number;
  columnFilterOptions: ColumnFilterOptions;
  sortPhase: SortPhase;
  memoOverrides: Record<string, string>;
  filterHouseholdId: string;
  searchQuery: string;
  columnFilters: Partial<Record<ColumnFilterKey, string>>;
  periodStart: string;
  periodEnd: string;
  memoModalRow: InventoryLedgerRow | null;
  memoDraft: string;
  거점_필터를_바꾼다: (v: string) => void;
  검색어를_바꾼다: (v: string) => void;
  컬럼_필터를_바꾼다: (key: ColumnFilterKey, v: string) => void;
  컬럼_필터를_초기화한다: () => void;
  기간_시작을_바꾼다: (v: string) => void;
  기간_종료를_바꾼다: (v: string) => void;
  기간을_초기화한다: () => void;
  정렬을_바꾼다: (column: SortColumn) => void;
  페이지를_바꾼다: (page: number) => void;
  이전_페이지로_간다: () => void;
  다음_페이지로_간다: () => void;
  비고_수정_모달을_연다: (row: InventoryLedgerRow) => void;
  비고_모달을_닫는다: () => void;
  비고_모달_드래프트를_바꾼다: (v: string) => void;
  비고_모달에서_저장한다: () => void;
  /** 재고 수량을 수동 조정한다. 성공 시 true, 실패 시 false. */
  수량_수동_조정_한다: (
    householdId: string,
    itemId: string,
    itemLabel: string,
    quantityDelta: number,
    memo?: string,
  ) => Promise<boolean>;
};

export const InventoryHistoryContext = createContext<
  InventoryHistoryContextType | undefined
>(undefined);

/* ─────────────────────── Base Provider ─────────────────────── */

export type InventoryHistoryProviderProps = {
  children: ReactNode;
  port: InventoryHistoryDataPort;
};

export function InventoryHistoryProvider({
  children,
  port,
}: InventoryHistoryProviderProps) {
  const [loading, setLoading] = useState(!!port.loadApiLedger);
  const [households, setHouseholds] = useState<Household[]>(() =>
    port.initialHouseholds(),
  );
  const [ledger, setLedger] = useState<InventoryLedgerRow[]>(() =>
    port.initialLedger(),
  );

  // 포트 구독: api 모드는 local-store 변경 감지, mock 모드는 no-op
  useEffect(() => {
    return port.subscribe(setHouseholds, setLedger);
  }, [port]);

  // API 에서 이력 추가 로드 (optional) — 로컬 ledger 와 병합
  useEffect(() => {
    if (!port.loadApiLedger) return;
    void port.loadApiLedger().then((apiRows) => {
      if (apiRows.length === 0) {
        setLoading(false);
        return;
      }
      setLedger((prev) => {
        const merged = new Map(prev.map((r) => [r.id, r]));
        apiRows.forEach((r) => merged.set(r.id, r));
        return Array.from(merged.values()).sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [port]);

  const [filterHouseholdId, setFilterHouseholdId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [columnFilters, setColumnFilters] = useState<
    Partial<Record<ColumnFilterKey, string>>
  >({});
  const [sortPhase, setSortPhase] = useState<SortPhase>({ scope: "default" });
  const [memoOverrides, setMemoOverrides] = useState<Record<string, string>>(
    {},
  );
  const [memoModalRow, setMemoModalRow] = useState<InventoryLedgerRow | null>(
    null,
  );
  const [memoDraft, setMemoDraft] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  const 거점_필터를_바꾼다 = useCallback((v: string) => {
    setPageIndex(0);
    setColumnFilters({});
    setPeriodStart("");
    setPeriodEnd("");
    setFilterHouseholdId(v);
  }, []);

  const 검색어를_바꾼다 = useCallback((v: string) => {
    setPageIndex(0);
    setSearchQuery(v);
  }, []);

  const 컬럼_필터를_바꾼다 = useCallback((key: ColumnFilterKey, v: string) => {
    setPageIndex(0);
    setColumnFilters((prev) => {
      const next = { ...prev };
      if (!v) {
        delete next[key];
      } else {
        next[key] = v;
      }
      return next;
    });
  }, []);

  const 컬럼_필터를_초기화한다 = useCallback(() => {
    setPageIndex(0);
    setColumnFilters({});
  }, []);

  const 기간_시작을_바꾼다 = useCallback((v: string) => {
    setPageIndex(0);
    setPeriodStart(v);
  }, []);

  const 기간_종료를_바꾼다 = useCallback((v: string) => {
    setPageIndex(0);
    setPeriodEnd(v);
  }, []);

  const 기간을_초기화한다 = useCallback(() => {
    setPageIndex(0);
    setPeriodStart("");
    setPeriodEnd("");
  }, []);

  const 정렬을_바꾼다 = useCallback((column: SortColumn) => {
    setSortPhase((prev) => {
      if (prev.scope === "column" && prev.column === column) {
        const first = 열_첫_정렬_방향을_구한다(column);
        const second = first === "asc" ? "desc" : "asc";
        if (prev.dir === first) {
          return { scope: "column", column, dir: second };
        }
        if (prev.dir === second) {
          return { scope: "default" };
        }
      }
      return {
        scope: "column",
        column,
        dir: 열_첫_정렬_방향을_구한다(column),
      };
    });
  }, []);

  const 비고를_바꾼다 = useCallback((rowId: string, value: string) => {
    setMemoOverrides((prev) => ({ ...prev, [rowId]: value }));
  }, []);

  const 비고_수정_모달을_연다 = useCallback(
    (row: InventoryLedgerRow) => {
      setMemoModalRow(row);
      setMemoDraft(행_메모_문자열을_구한다(row, memoOverrides));
    },
    [memoOverrides],
  );

  const 비고_모달을_닫는다 = useCallback(() => {
    setMemoModalRow(null);
  }, []);

  const 비고_모달_드래프트를_바꾼다 = useCallback((v: string) => {
    setMemoDraft(v);
  }, []);

  const 비고_모달에서_저장한다 = useCallback(() => {
    if (!memoModalRow) return;
    비고를_바꾼다(memoModalRow.id, memoDraft);
    setMemoModalRow(null);
  }, [memoModalRow, memoDraft, 비고를_바꾼다]);

  const 수량_수동_조정_한다 = useCallback(
    async (
      householdId: string,
      itemId: string,
      itemLabel: string,
      quantityDelta: number,
      memo?: string,
    ): Promise<boolean> => {
      if (!port.recordAdjustment) return false;
      try {
        const row = await port.recordAdjustment(
          householdId,
          itemId,
          itemLabel,
          quantityDelta,
          memo,
        );
        if (row) {
          setLedger((prev) => {
            const exists = prev.some((r) => r.id === row.id);
            if (exists) return prev;
            return [row, ...prev];
          });
        }
        return true;
      } catch (e) {
        console.error("수동 조정 오류:", e);
        return false;
      }
    },
    [port],
  );

  const baseRows = useMemo(() => {
    let rows = [...ledger];
    if (filterHouseholdId !== "all") {
      rows = rows.filter((r) => r.householdId === filterHouseholdId);
    }
    return rows;
  }, [ledger, filterHouseholdId]);

  const columnFilterOptions = useMemo(
    () => 열_필터_옵션을_추출한다(baseRows, households),
    [baseRows, households],
  );

  const hasActiveColumnFilters = useMemo(
    () =>
      Object.values(columnFilters).some(
        (v) => typeof v === "string" && v.trim() !== "",
      ),
    [columnFilters],
  );

  const hasActivePeriodFilter = Boolean(periodStart || periodEnd);

  const periodFilteredRows = useMemo(
    () =>
      baseRows.filter((r) => {
        const key = iso를_날짜키로_만든다(r.createdAt);
        return 날짜키가_기간에_포함되는가(key, periodStart, periodEnd);
      }),
    [baseRows, periodStart, periodEnd],
  );

  const columnFilteredRows = useMemo(
    () =>
      periodFilteredRows.filter((r) =>
        행이_컬럼_필터에_일치하는가(r, households, columnFilters),
      ),
    [periodFilteredRows, households, columnFilters],
  );

  const searchedRows = useMemo(
    () =>
      columnFilteredRows.filter((r) =>
        행이_검색어에_일치하는가(r, households, searchQuery, memoOverrides),
      ),
    [columnFilteredRows, households, searchQuery, memoOverrides],
  );

  const sortedRows = useMemo(() => {
    const sortColumn =
      sortPhase.scope === "column"
        ? sortPhase.column
        : DEFAULT_LEDGER_SORT.column;
    const sortDir =
      sortPhase.scope === "column" ? sortPhase.dir : DEFAULT_LEDGER_SORT.dir;
    return 행_배열을_정렬한다(
      searchedRows,
      households,
      sortColumn,
      sortDir,
      memoOverrides,
    );
  }, [searchedRows, households, sortPhase, memoOverrides]);

  const totalBase = baseRows.length;
  const totalFiltered = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / LEDGER_PAGE_SIZE));
  const maxPageIndex = Math.max(0, totalPages - 1);
  const activePageIndex = Math.min(Math.max(0, pageIndex), maxPageIndex);

  const paginatedRows = useMemo(
    () =>
      sortedRows.slice(
        activePageIndex * LEDGER_PAGE_SIZE,
        activePageIndex * LEDGER_PAGE_SIZE + LEDGER_PAGE_SIZE,
      ),
    [sortedRows, activePageIndex],
  );

  const hasFilterContext =
    searchQuery.trim() !== "" || hasActiveColumnFilters || hasActivePeriodFilter;
  const footerRangeStart =
    totalFiltered === 0 ? 0 : activePageIndex * LEDGER_PAGE_SIZE + 1;
  const footerRangeEnd = Math.min(
    totalFiltered,
    (activePageIndex + 1) * LEDGER_PAGE_SIZE,
  );

  const 이전_페이지로_간다 = useCallback(() => {
    setPageIndex((p) => Math.max(0, p - 1));
  }, []);

  const 다음_페이지로_간다 = useCallback(() => {
    setPageIndex((p) => Math.min(maxPageIndex, p + 1));
  }, [maxPageIndex]);

  const value = useMemo<InventoryHistoryContextType>(
    () => ({
      loading,
      households,
      paginatedRows,
      totalBase,
      totalFiltered,
      totalPages,
      activePageIndex,
      hasFilterContext,
      hasActiveColumnFilters,
      hasActivePeriodFilter,
      periodFilteredRowsCount: periodFilteredRows.length,
      columnFilteredRowsCount: columnFilteredRows.length,
      footerRangeStart,
      footerRangeEnd,
      columnFilterOptions,
      sortPhase,
      memoOverrides,
      filterHouseholdId,
      searchQuery,
      columnFilters,
      periodStart,
      periodEnd,
      memoModalRow,
      memoDraft,
      거점_필터를_바꾼다,
      검색어를_바꾼다,
      컬럼_필터를_바꾼다,
      컬럼_필터를_초기화한다,
      기간_시작을_바꾼다,
      기간_종료를_바꾼다,
      기간을_초기화한다,
      정렬을_바꾼다,
      페이지를_바꾼다: setPageIndex,
      이전_페이지로_간다,
      다음_페이지로_간다,
      비고_수정_모달을_연다,
      비고_모달을_닫는다,
      비고_모달_드래프트를_바꾼다,
      비고_모달에서_저장한다,
      수량_수동_조정_한다,
    }),
    [
      loading,
      households,
      paginatedRows,
      totalBase,
      totalFiltered,
      totalPages,
      activePageIndex,
      hasFilterContext,
      hasActiveColumnFilters,
      hasActivePeriodFilter,
      periodFilteredRows.length,
      columnFilteredRows.length,
      footerRangeStart,
      footerRangeEnd,
      columnFilterOptions,
      sortPhase,
      memoOverrides,
      filterHouseholdId,
      searchQuery,
      columnFilters,
      periodStart,
      periodEnd,
      memoModalRow,
      memoDraft,
      거점_필터를_바꾼다,
      검색어를_바꾼다,
      컬럼_필터를_바꾼다,
      컬럼_필터를_초기화한다,
      기간_시작을_바꾼다,
      기간_종료를_바꾼다,
      기간을_초기화한다,
      정렬을_바꾼다,
      이전_페이지로_간다,
      다음_페이지로_간다,
      비고_수정_모달을_연다,
      비고_모달을_닫는다,
      비고_모달_드래프트를_바꾼다,
      비고_모달에서_저장한다,
      수량_수동_조정_한다,
    ],
  );

  return (
    <InventoryHistoryContext.Provider value={value}>
      {children}
    </InventoryHistoryContext.Provider>
  );
}

/* ─────────────────────── Current Provider ─────────────────────── */

/* ── API 로그 fetch 헬퍼 ── */

async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const json = (await res.json()) as { success: boolean; data: T; message?: string };
  if (!json.success) throw new Error(json.message ?? "API 오류");
  return json.data;
}

interface ApiInventoryLog {
  id: string;
  inventoryItemId: string;
  type: string;
  quantity: number;
  memo: string | null;
  createdAt: string;
}

function mapLogToLedgerRow(
  householdId: string,
  itemLabel: string,
  log: ApiInventoryLog,
): InventoryLedgerRow {
  const isOut = log.type === "out" || log.type === "waste";
  const quantityDelta = isOut ? -Math.abs(log.quantity) : log.quantity;
  return {
    id: log.id,
    householdId,
    inventoryItemId: log.inventoryItemId,
    type: log.type as InventoryLedgerRow["type"],
    quantityDelta,
    quantityAfter: 0,
    itemLabel: itemLabel || undefined,
    memo: log.memo ?? undefined,
    createdAt: log.createdAt,
  };
}

/** current 경로 전용 Provider. localStorage + API 데이터 소스를 주입한다. */
export function CurrentInventoryHistoryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [port] = useState<InventoryHistoryDataPort>(() => ({
    initialHouseholds: () => getHouseholds(),
    initialLedger: () => getInventoryLedger(),
    subscribe: (onH, onL) =>
      subscribeInventoryHistoryBundle(() => {
        onH(getHouseholds());
        onL(getInventoryLedger());
      }),

    async loadApiLedger() {
      // localStorage + API households를 병합
      const localHouseholds = getHouseholds();
      const apiHouseholds = await apiFetch<
        Array<{ id: string; name: string }>
      >("/api/households").catch(() => [] as Array<{ id: string; name: string }>);

      // id 기반 병합
      const householdMap = new Map<string, { id: string; items: Array<{ id: string; name: string }> }>();
      for (const h of localHouseholds) {
        householdMap.set(h.id, { id: h.id, items: h.items ?? [] });
      }
      for (const h of apiHouseholds) {
        if (!householdMap.has(h.id)) {
          householdMap.set(h.id, { id: h.id, items: [] });
        }
      }

      const rows: InventoryLedgerRow[] = [];
      await Promise.all(
        Array.from(householdMap.values()).map(async (h) => {
          const localItems = h.items ?? [];
          const apiItems = await apiFetch<
            Array<{
              id: string;
              name?: string;
              productVariant?: {
                product?: { name?: string };
                name?: string | null;
              };
            }>
          >(`/api/households/${h.id}/inventory-items`).catch(
            () => [],
          );

          // id 기반 병합 (중복 제거)
          const itemMap = new Map<string, string>();
          for (const item of localItems) {
            itemMap.set(item.id, item.name);
          }
          for (const item of apiItems) {
            if (!itemMap.has(item.id)) {
              const label =
                item.productVariant?.product?.name ?? item.name ?? "품목";
              itemMap.set(item.id, label);
            }
          }

          await Promise.all(
            Array.from(itemMap.entries()).map(async ([itemId, itemName]) => {
              const logs = await apiFetch<ApiInventoryLog[]>(
                `/api/households/${h.id}/inventory-items/${itemId}/logs`,
              ).catch(() => [] as ApiInventoryLog[]);
              for (const log of logs) {
                rows.push(mapLogToLedgerRow(h.id, itemName, log));
              }
            }),
          );
        }),
      );
      return rows;
    },

    async recordAdjustment(householdId, itemId, itemLabel, quantityDelta, memo) {
      try {
        const result = await apiFetch<ApiInventoryLog>(
          `/api/households/${householdId}/inventory-items/${itemId}/logs/adjustment`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantityDelta, memo: memo?.trim() }),
          },
        );
        const row = mapLogToLedgerRow(householdId, itemLabel, result);
        appendInventoryLedgerRow(row);
        return row;
      } catch (e) {
        console.error("수동 조정 API 오류:", e);
        return null;
      }
    },
  }));

  return (
    <InventoryHistoryProvider port={port}>{children}</InventoryHistoryProvider>
  );
}
