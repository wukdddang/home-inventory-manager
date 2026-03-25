"use client";

import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  MOCK_HISTORY_HOUSEHOLDS,
  MOCK_HISTORY_LEDGER,
} from "./inventory-history-mock.service";
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
} from "./inventory-history-helpers.service";

export type InventoryHistoryContextType = {
  /* ── 데이터 ── */
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

  /* ── 필터·상태 ── */
  filterHouseholdId: string;
  searchQuery: string;
  columnFilters: Partial<Record<ColumnFilterKey, string>>;
  periodStart: string;
  periodEnd: string;

  /* ── 메모 모달 ── */
  memoModalRow: InventoryLedgerRow | null;
  memoDraft: string;

  /* ── 액션 ── */
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
};

export const InventoryHistoryContext = createContext<
  InventoryHistoryContextType | undefined
>(undefined);

export function InventoryHistoryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const households = useMemo(
    () => structuredClone(MOCK_HISTORY_HOUSEHOLDS),
    [],
  );

  /* ── 상태 ── */
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

  /* ── 액션 ── */
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

  /* ── 파생 데이터 ── */
  const baseRows = useMemo(() => {
    let rows = [...MOCK_HISTORY_LEDGER];
    if (filterHouseholdId !== "all") {
      rows = rows.filter((r) => r.householdId === filterHouseholdId);
    }
    return rows;
  }, [filterHouseholdId]);

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
    }),
    [
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
    ],
  );

  return (
    <InventoryHistoryContext.Provider value={value}>
      {children}
    </InventoryHistoryContext.Provider>
  );
}
