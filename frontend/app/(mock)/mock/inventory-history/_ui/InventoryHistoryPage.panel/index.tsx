"use client";

import {
  appViewPresenceTransition,
  appViewPresenceVariants,
} from "@/app/_ui/app-view-transition.motion";
import { FormModal } from "@/app/_ui/form-modal";
import {
  MOCK_SEED_HOUSEHOLDS,
  MOCK_SEED_INVENTORY_LEDGER,
} from "@/app/(mock)/mock/dashboard/_context/dashboard-mock.service";
import {
  resolveLedgerLocationColumns,
  type LedgerLocationColumns,
} from "@/lib/household-location";
import type { Household, InventoryLedgerRow, InventoryLedgerType } from "@/types/domain";
import { useAppRoutePrefix } from "@/lib/use-app-route-prefix";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

/** `resolveLedgerLocationColumns`와 동일 규칙 — 거점 스냅샷이 없으면 id만 */
function 이력_행_위치_열을_구한다(
  households: Household[],
  row: InventoryLedgerRow,
): LedgerLocationColumns {
  const h = households.find((x) => x.id === row.householdId);
  if (!h) {
    return {
      householdName: row.householdId,
      roomName: "-",
      placeLabel: "-",
      detailLabel: "-",
    };
  }
  return resolveLedgerLocationColumns(h, row.inventoryItemId);
}

function 이력_유형_라벨을_구한다(type: InventoryLedgerType): string {
  const labels: Record<InventoryLedgerType, string> = {
    in: "입고",
    out: "소비",
    adjust: "수량 조정",
    waste: "폐기",
  };
  return labels[type];
}

function 폐기_사유_라벨을_구한다(code?: string): string {
  if (!code) return "";
  if (code === "expired") return "유통기한 만료";
  if (code === "damaged") return "파손·불량";
  if (code === "other") return "기타";
  return code;
}

function 일시_문자열을_구한다(iso: string): { 날짜: string; 시각: string } {
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) {
    return { 날짜: iso, 시각: "" };
  }
  return {
    날짜: when.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
    시각: when.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  };
}

/** 편집 중인 메모(없으면 원본 `row.memo`) */
function 행_메모_문자열을_구한다(
  row: InventoryLedgerRow,
  overrides: Record<string, string>,
): string {
  return overrides[row.id] !== undefined ? overrides[row.id]! : (row.memo ?? "");
}

/** 비고 열 표시 — 사용자 메모만(폐기 사유는 별도 열) */
function 비고_메모_표시를_구한다(메모문자열: string): string {
  const m = 메모문자열.trim();
  return m || "—";
}

/** 폐기 사유 열 — 폐기가 아니거나 사유 없으면 "-" */
function 폐기_사유_열_텍스트를_구한다(row: InventoryLedgerRow): string {
  if (row.type !== "waste" || !row.reason?.trim()) return "-";
  return 폐기_사유_라벨을_구한다(row.reason);
}

/** `식료품 › 라면 › 1봉` / `식료품 > 우유 > 500ml` 형태를 분류·이름·규격으로 나눈다 */
function 품목_라벨을_분해한다(
  itemLabel: string | undefined,
  inventoryItemId: string,
): { 분류: string; 이름: string; 규격: string } {
  const raw = (itemLabel ?? "").trim();
  if (!raw) {
    return { 분류: "—", 이름: inventoryItemId, 규격: "—" };
  }
  const parts = raw
    .split(/[›>＞]/g)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 3) {
    return {
      분류: parts[0]!,
      이름: parts[1]!,
      규격: parts.slice(2).join(" › "),
    };
  }
  if (parts.length === 2) {
    return { 분류: parts[0]!, 이름: parts[1]!, 규격: "—" };
  }
  return { 분류: "—", 이름: parts[0]!, 규격: "—" };
}

const 뱃지_공통 =
  "inline-flex max-w-full items-center justify-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums leading-tight ring-1";

function 구분_뱃지_클래스를_구한다(type: InventoryLedgerType): string {
  switch (type) {
    case "in":
      return `${뱃지_공통} bg-emerald-500/15 text-emerald-200 ring-emerald-500/40`;
    case "out":
      return `${뱃지_공통} bg-teal-500/15 text-teal-200 ring-teal-500/40`;
    case "waste":
      return `${뱃지_공통} bg-rose-500/15 text-rose-200 ring-rose-500/40`;
    default:
      return `${뱃지_공통} bg-zinc-800/90 text-zinc-300 ring-zinc-600`;
  }
}

function 증감_뱃지_클래스를_구한다(delta: number): string {
  if (delta > 0) {
    return `${뱃지_공통} bg-emerald-500/15 text-emerald-300 ring-emerald-500/40`;
  }
  if (delta < 0) {
    return `${뱃지_공통} bg-rose-500/15 text-rose-300 ring-rose-500/40`;
  }
  return `${뱃지_공통} bg-zinc-800/90 text-zinc-400 ring-zinc-600`;
}

type SortColumn =
  | "createdAt"
  | "householdName"
  | "roomName"
  | "placeLabel"
  | "detailLabel"
  | "category"
  | "itemName"
  | "spec"
  | "type"
  | "wasteReason"
  | "delta"
  | "balance"
  | "note";

/** 테이블 헤더 아래에 두지 않고 상단 툴바에만 쓰는 열 필터 키 */
type ColumnFilterKey =
  | "householdName"
  | "roomName"
  | "placeLabel"
  | "detailLabel"
  | "category"
  | "itemName"
  | "spec"
  | "type";

function 행_검색_텍스트를_구한다(
  row: InventoryLedgerRow,
  households: Household[],
  memoOverrides: Record<string, string>,
): string {
  const { 분류, 이름, 규격 } = 품목_라벨을_분해한다(
    row.itemLabel,
    row.inventoryItemId,
  );
  const { 날짜, 시각 } = 일시_문자열을_구한다(row.createdAt);
  const 메모 = 행_메모_문자열을_구한다(row, memoOverrides);
  const 폐기사유 = 폐기_사유_열_텍스트를_구한다(row);
  const loc = 이력_행_위치_열을_구한다(households, row);
  return [
    loc.householdName,
    loc.roomName,
    loc.placeLabel,
    loc.detailLabel,
    분류,
    이름,
    규격,
    이력_유형_라벨을_구한다(row.type),
    폐기사유 !== "-" ? 폐기사유 : "",
    String(row.quantityDelta),
    String(row.quantityAfter),
    메모,
    row.createdAt,
    날짜,
    시각,
    row.itemLabel ?? "",
    row.inventoryItemId,
  ]
    .join(" ")
    .toLowerCase();
}

function 행이_검색어에_일치하는가(
  row: InventoryLedgerRow,
  households: Household[],
  query: string,
  memoOverrides: Record<string, string>,
): boolean {
  const q = query.trim();
  if (!q) return true;
  const haystack = 행_검색_텍스트를_구한다(row, households, memoOverrides);
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  return tokens.every((t) => haystack.includes(t));
}

function 행이_컬럼_필터에_일치하는가(
  row: InventoryLedgerRow,
  households: Household[],
  filters: Partial<Record<ColumnFilterKey, string>>,
): boolean {
  const loc = 이력_행_위치_열을_구한다(households, row);
  const { 분류, 이름, 규격 } = 품목_라벨을_분해한다(
    row.itemLabel,
    row.inventoryItemId,
  );

  if (filters.householdName && loc.householdName !== filters.householdName) {
    return false;
  }
  if (filters.roomName && loc.roomName !== filters.roomName) return false;
  if (filters.placeLabel && loc.placeLabel !== filters.placeLabel) {
    return false;
  }
  if (filters.detailLabel && loc.detailLabel !== filters.detailLabel) {
    return false;
  }
  if (filters.category && 분류 !== filters.category) return false;
  if (filters.itemName && 이름 !== filters.itemName) return false;
  if (filters.spec && 규격 !== filters.spec) return false;
  if (
    filters.type &&
    이력_유형_라벨을_구한다(row.type) !== filters.type
  ) {
    return false;
  }
  return true;
}

function 정렬_값을_구한다(
  row: InventoryLedgerRow,
  households: Household[],
  column: SortColumn,
  memoOverrides: Record<string, string>,
): string | number {
  switch (column) {
    case "createdAt":
      return new Date(row.createdAt).getTime();
    case "householdName":
    case "roomName":
    case "placeLabel":
    case "detailLabel": {
      const loc = 이력_행_위치_열을_구한다(households, row);
      if (column === "householdName") return loc.householdName;
      if (column === "roomName") return loc.roomName;
      if (column === "placeLabel") return loc.placeLabel;
      return loc.detailLabel;
    }
    case "category":
      return 품목_라벨을_분해한다(row.itemLabel, row.inventoryItemId).분류;
    case "itemName":
      return 품목_라벨을_분해한다(row.itemLabel, row.inventoryItemId).이름;
    case "spec":
      return 품목_라벨을_분해한다(row.itemLabel, row.inventoryItemId).규격;
    case "type":
      return 이력_유형_라벨을_구한다(row.type);
    case "wasteReason":
      return 폐기_사유_열_텍스트를_구한다(row);
    case "delta":
      return row.quantityDelta;
    case "balance":
      return row.quantityAfter;
    case "note":
      return 행_메모_문자열을_구한다(row, memoOverrides);
    default:
      return "";
  }
}

function 행_배열을_정렬한다(
  rows: InventoryLedgerRow[],
  households: Household[],
  column: SortColumn,
  dir: "asc" | "desc",
  memoOverrides: Record<string, string>,
): InventoryLedgerRow[] {
  const mul = dir === "asc" ? 1 : -1;
  const out = [...rows];
  out.sort((a, b) => {
    const va = 정렬_값을_구한다(a, households, column, memoOverrides);
    const vb = 정렬_값을_구한다(b, households, column, memoOverrides);
    let cmp = 0;
    if (typeof va === "number" && typeof vb === "number") {
      cmp = va - vb;
    } else {
      cmp = String(va).localeCompare(String(vb), "ko");
    }
    if (cmp !== 0) return cmp * mul;
    return a.id.localeCompare(b.id);
  });
  return out;
}

function LedgerLegend({ className = "" }: { className?: string }) {
  const 구분_순서: InventoryLedgerType[] = ["in", "out", "adjust", "waste"];
  return (
    <div
      className={`flex min-w-0 flex-nowrap items-center gap-x-2 gap-y-2 rounded-xl border border-zinc-700/90 bg-zinc-900/80 px-3 py-2 shadow-sm ${className}`.trim()}
      role="note"
      aria-label="표 범례"
    >
      <span className="shrink-0 text-[11px] font-semibold text-zinc-300">
        범례
      </span>
      <span className="shrink-0 text-[11px] text-zinc-500">증감</span>
      <span className={증감_뱃지_클래스를_구한다(1)}>+증가</span>
      <span className={증감_뱃지_클래스를_구한다(-1)}>−감소</span>
      <span
        className="mx-0.5 hidden h-4 w-px shrink-0 bg-zinc-700 sm:inline-block"
        aria-hidden
      />
      <span className="shrink-0 text-[11px] text-zinc-500">구분</span>
      {구분_순서.map((t) => (
        <span key={t} className={구분_뱃지_클래스를_구한다(t)}>
          {이력_유형_라벨을_구한다(t)}
        </span>
      ))}
    </div>
  );
}

function 정렬_가능한_헤더({
  column,
  label,
  sortColumn,
  sortDir,
  onSort,
  align = "left",
  thClassName = "",
}: {
  column: SortColumn;
  label: string;
  sortColumn: SortColumn;
  sortDir: "asc" | "desc";
  onSort: (c: SortColumn) => void;
  align?: "left" | "right";
  thClassName?: string;
}) {
  const active = sortColumn === column;
  return (
    <th
      scope="col"
      className={`sticky top-0 z-1 px-3 py-2.5 text-xs font-semibold tracking-wide ${
        align === "right" ? "text-right" : "text-left"
      } ${thClassName}`.trim()}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={`group flex max-w-full items-center gap-1 rounded-md text-zinc-400 transition-colors hover:text-zinc-200 focus-visible:outline focus-visible:ring-2 focus-visible:ring-teal-500/50 ${
          align === "right" ? "ml-auto w-full justify-end" : "inline-flex"
        }`}
        aria-sort={
          active
            ? sortDir === "asc"
              ? "ascending"
              : "descending"
            : undefined
        }
      >
        <span>{label}</span>
        {active ? (
          sortDir === "asc" ? (
            <ArrowUp className="size-3.5 shrink-0 text-teal-400" aria-hidden />
          ) : (
            <ArrowDown className="size-3.5 shrink-0 text-teal-400" aria-hidden />
          )
        ) : (
          <span className="inline-flex size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-40">
            <ArrowUp className="size-3.5" aria-hidden />
          </span>
        )}
      </button>
    </th>
  );
}

function 컬럼_필터_필드({
  열이름,
  value,
  onChange,
  options,
}: {
  열이름: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const 전체인가 = value === "";
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={열이름}
      className={`box-border h-9 min-w-26 max-w-36 shrink-0 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-0 text-xs outline-none focus:border-teal-500 ${
        전체인가 ? "text-zinc-500" : "text-zinc-100"
      }`}
    >
      <option value="">{열이름} · 전체</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function InventoryHistoryPanel() {
  const prefix = useAppRoutePrefix();

  const householdsForLabels = useMemo(
    () => structuredClone(MOCK_SEED_HOUSEHOLDS),
    [],
  );

  const [filterHouseholdId, setFilterHouseholdId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [columnFilters, setColumnFilters] = useState<
    Partial<Record<ColumnFilterKey, string>>
  >({});
  const [sortColumn, setSortColumn] = useState<SortColumn>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [memoOverrides, setMemoOverrides] = useState<Record<string, string>>(
    {},
  );
  const [memoModalRow, setMemoModalRow] = useState<InventoryLedgerRow | null>(
    null,
  );
  const [memoDraft, setMemoDraft] = useState("");

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

  const 비고_모달에서_저장한다 = useCallback(() => {
    if (!memoModalRow) return;
    비고를_바꾼다(memoModalRow.id, memoDraft);
    setMemoModalRow(null);
  }, [memoModalRow, memoDraft, 비고를_바꾼다]);

  const handleSort = useCallback((column: SortColumn) => {
    if (sortColumn === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      /** 일시는 최신 우선이 자연스러워 첫 선택 시 내림차순 */
      setSortDir(column === "createdAt" ? "desc" : "asc");
    }
  }, [sortColumn]);

  const 컬럼_필터를_바꾼다 = useCallback((key: ColumnFilterKey, v: string) => {
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

  useEffect(() => {
    setColumnFilters({});
  }, [filterHouseholdId]);

  const baseRows = useMemo(() => {
    let rows = [...MOCK_SEED_INVENTORY_LEDGER];
    if (filterHouseholdId !== "all") {
      rows = rows.filter((r) => r.householdId === filterHouseholdId);
    }
    return rows;
  }, [filterHouseholdId]);

  const columnFilterOptions = useMemo(() => {
    const householdName = new Set<string>();
    const roomName = new Set<string>();
    const placeLabel = new Set<string>();
    const detailLabel = new Set<string>();
    const category = new Set<string>();
    const itemName = new Set<string>();
    const spec = new Set<string>();
    const type = new Set<string>();

    for (const r of baseRows) {
      const loc = 이력_행_위치_열을_구한다(householdsForLabels, r);
      householdName.add(loc.householdName);
      roomName.add(loc.roomName);
      placeLabel.add(loc.placeLabel);
      detailLabel.add(loc.detailLabel);
      const { 분류, 이름, 규격 } = 품목_라벨을_분해한다(
        r.itemLabel,
        r.inventoryItemId,
      );
      category.add(분류);
      itemName.add(이름);
      spec.add(규격);
      type.add(이력_유형_라벨을_구한다(r.type));
    }

    const sortStr = (a: string, b: string) => a.localeCompare(b, "ko");

    return {
      householdName: [...householdName].sort(sortStr),
      roomName: [...roomName].sort(sortStr),
      placeLabel: [...placeLabel].sort(sortStr),
      detailLabel: [...detailLabel].sort(sortStr),
      category: [...category].sort(sortStr),
      itemName: [...itemName].sort(sortStr),
      spec: [...spec].sort(sortStr),
      type: [...type].sort(sortStr),
    };
  }, [baseRows, householdsForLabels]);

  const hasActiveColumnFilters = useMemo(
    () =>
      Object.values(columnFilters).some(
        (v) => typeof v === "string" && v.trim() !== "",
      ),
    [columnFilters],
  );

  const columnFilteredRows = useMemo(
    () =>
      baseRows.filter((r) =>
        행이_컬럼_필터에_일치하는가(r, householdsForLabels, columnFilters),
      ),
    [baseRows, householdsForLabels, columnFilters],
  );

  const searchedRows = useMemo(
    () =>
      columnFilteredRows.filter((r) =>
        행이_검색어에_일치하는가(
          r,
          householdsForLabels,
          searchQuery,
          memoOverrides,
        ),
      ),
    [
      columnFilteredRows,
      householdsForLabels,
      searchQuery,
      memoOverrides,
    ],
  );

  const sortedRows = useMemo(
    () =>
      행_배열을_정렬한다(
        searchedRows,
        householdsForLabels,
        sortColumn,
        sortDir,
        memoOverrides,
      ),
    [searchedRows, householdsForLabels, sortColumn, sortDir, memoOverrides],
  );

  const totalBase = baseRows.length;

  return (
    <motion.div
      className="flex w-full min-w-0 max-w-none flex-col gap-6 pb-16"
      initial="initial"
      animate="animate"
      variants={appViewPresenceVariants}
      transition={appViewPresenceTransition}
    >
      <div>
        <h1 className="text-2xl font-semibold text-white">재고 이력</h1>
        <p className="mt-1 text-sm text-zinc-500">
          품목별 증감·잔여를 표로 확인합니다. 비고 텍스트를 누르면 모달에서
          편집할 수 있습니다. (mock 목 데이터·화면 전용)
        </p>
        <Link
          href={`${prefix}/dashboard`}
          className="mt-2 inline-block text-xs font-medium text-teal-400/90 hover:underline"
        >
          ← 메인(대시보드)으로
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        <div
          className="flex w-full min-w-0 items-center gap-2"
          role="toolbar"
          aria-label="목록 필터 및 범례"
        >
          <div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
            <div className="flex min-w-0 max-w-full flex-nowrap items-center gap-2 overflow-x-auto [scrollbar-width:thin]">
              <select
                value={filterHouseholdId}
                onChange={(e) => setFilterHouseholdId(e.target.value)}
                aria-label="거점"
                className={`box-border h-9 min-w-30 shrink-0 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-0 text-xs leading-none outline-none focus:border-teal-500 ${
                  filterHouseholdId === "all" ? "text-zinc-500" : "text-zinc-100"
                }`}
              >
                <option value="all">거점 · 전체</option>
                {householdsForLabels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
              {totalBase > 0 ? (
                <>
                  <컬럼_필터_필드
                    열이름="거점"
                    value={columnFilters.householdName ?? ""}
                    onChange={(v) => 컬럼_필터를_바꾼다("householdName", v)}
                    options={columnFilterOptions.householdName}
                  />
                  <컬럼_필터_필드
                    열이름="방"
                    value={columnFilters.roomName ?? ""}
                    onChange={(v) => 컬럼_필터를_바꾼다("roomName", v)}
                    options={columnFilterOptions.roomName}
                  />
                  <컬럼_필터_필드
                    열이름="장소"
                    value={columnFilters.placeLabel ?? ""}
                    onChange={(v) => 컬럼_필터를_바꾼다("placeLabel", v)}
                    options={columnFilterOptions.placeLabel}
                  />
                  <컬럼_필터_필드
                    열이름="세부장소"
                    value={columnFilters.detailLabel ?? ""}
                    onChange={(v) => 컬럼_필터를_바꾼다("detailLabel", v)}
                    options={columnFilterOptions.detailLabel}
                  />
                  <컬럼_필터_필드
                    열이름="분류"
                    value={columnFilters.category ?? ""}
                    onChange={(v) => 컬럼_필터를_바꾼다("category", v)}
                    options={columnFilterOptions.category}
                  />
                  <컬럼_필터_필드
                    열이름="품목"
                    value={columnFilters.itemName ?? ""}
                    onChange={(v) => 컬럼_필터를_바꾼다("itemName", v)}
                    options={columnFilterOptions.itemName}
                  />
                  <컬럼_필터_필드
                    열이름="규격"
                    value={columnFilters.spec ?? ""}
                    onChange={(v) => 컬럼_필터를_바꾼다("spec", v)}
                    options={columnFilterOptions.spec}
                  />
                  <컬럼_필터_필드
                    열이름="구분"
                    value={columnFilters.type ?? ""}
                    onChange={(v) => 컬럼_필터를_바꾼다("type", v)}
                    options={columnFilterOptions.type}
                  />
                </>
              ) : null}
              {hasActiveColumnFilters ? (
                <button
                  type="button"
                  onClick={() => setColumnFilters({})}
                  className="shrink-0 whitespace-nowrap text-xs font-medium text-teal-400/90 hover:underline"
                >
                  컬럼 필터 초기화
                </button>
              ) : null}
            </div>
            <div className="relative h-9 min-w-0 justify-self-stretch self-center">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
                aria-hidden
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검색 (거점·품목·구분·비고 등)"
                className={`box-border h-9 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-950 py-0 pl-9 pr-3 text-sm leading-none outline-none placeholder:text-zinc-600 focus:border-teal-500 ${
                  searchQuery.trim() === ""
                    ? "text-zinc-500"
                    : "text-zinc-100"
                }`}
                autoComplete="off"
              />
            </div>
          </div>
          {totalBase > 0 ? (
            <div className="max-w-[min(100%,28rem)] shrink-0">
              <LedgerLegend />
            </div>
          ) : null}
        </div>

        {totalBase === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-700 px-4 py-10">
            <p className="text-center text-sm text-zinc-500">
              아직 기록이 없습니다. 대시보드 물품 목록에서 소비·폐기를 남기면 여기에
              쌓입니다.
            </p>
            <p className="mt-6 text-right text-xs text-zinc-600">총 0행</p>
          </div>
        ) : (
          <>
            {sortedRows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-700 px-4 py-10">
                <p className="text-center text-sm text-zinc-500">
                  {columnFilteredRows.length === 0
                    ? "컬럼 필터 조건에 맞는 행이 없습니다."
                    : "검색 조건에 맞는 행이 없습니다."}
                </p>
                <p className="mt-6 text-right text-xs text-zinc-600">
                  {searchQuery.trim() || hasActiveColumnFilters
                    ? `표시 ${sortedRows.length} / 전체 ${totalBase}행`
                    : `총 ${sortedRows.length}행`}
                </p>
              </div>
            ) : (
              <div className="w-full overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950/80 shadow-inner ring-1 ring-zinc-800/80">
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[1400px] table-fixed border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-700 bg-zinc-900/90">
                      <정렬_가능한_헤더
                        column="createdAt"
                        label="일시"
                        sortColumn={sortColumn}
                        sortDir={sortDir}
                        onSort={handleSort}
                        thClassName="w-[6%] whitespace-nowrap"
                      />
                      <정렬_가능한_헤더
                        column="householdName"
                        label="거점"
                        sortColumn={sortColumn}
                        sortDir={sortDir}
                        onSort={handleSort}
                        thClassName="w-[8%] min-w-[5rem]"
                      />
                      <정렬_가능한_헤더
                        column="roomName"
                        label="방"
                        sortColumn={sortColumn}
                        sortDir={sortDir}
                        onSort={handleSort}
                        thClassName="w-[7%] min-w-[4rem]"
                      />
                      <정렬_가능한_헤더
                        column="placeLabel"
                        label="장소"
                        sortColumn={sortColumn}
                        sortDir={sortDir}
                        onSort={handleSort}
                        thClassName="w-[8%] min-w-[5rem]"
                      />
                      <정렬_가능한_헤더
                        column="detailLabel"
                        label="세부장소"
                        sortColumn={sortColumn}
                        sortDir={sortDir}
                        onSort={handleSort}
                        thClassName="w-[8%] min-w-[5rem]"
                      />
                      <정렬_가능한_헤더
                        column="category"
                        label="분류"
                        sortColumn={sortColumn}
                        sortDir={sortDir}
                        onSort={handleSort}
                        thClassName="w-[8%]"
                      />
                      <정렬_가능한_헤더
                        column="itemName"
                        label="품목"
                        sortColumn={sortColumn}
                        sortDir={sortDir}
                        onSort={handleSort}
                        thClassName="w-[9%]"
                      />
                      <정렬_가능한_헤더
                        column="spec"
                        label="규격"
                        sortColumn={sortColumn}
                        sortDir={sortDir}
                        onSort={handleSort}
                        thClassName="w-[7%]"
                      />
                      <정렬_가능한_헤더
                        column="type"
                        label="구분"
                        sortColumn={sortColumn}
                        sortDir={sortDir}
                        onSort={handleSort}
                        thClassName="w-[5%] whitespace-nowrap"
                      />
                      <정렬_가능한_헤더
                        column="wasteReason"
                        label="폐기 사유"
                        sortColumn={sortColumn}
                        sortDir={sortDir}
                        onSort={handleSort}
                        thClassName="w-[8%]"
                      />
                      <정렬_가능한_헤더
                        column="delta"
                        label="증감"
                        sortColumn={sortColumn}
                        sortDir={sortDir}
                        onSort={handleSort}
                        align="right"
                        thClassName="w-[6%] whitespace-nowrap"
                      />
                      <정렬_가능한_헤더
                        column="balance"
                        label="잔여 수량"
                        sortColumn={sortColumn}
                        sortDir={sortDir}
                        onSort={handleSort}
                        align="right"
                        thClassName="w-[5%] whitespace-nowrap"
                      />
                      <정렬_가능한_헤더
                        column="note"
                        label="비고(수정 가능)"
                        sortColumn={sortColumn}
                        sortDir={sortDir}
                        onSort={handleSort}
                        thClassName="min-w-0"
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((row, idx) => (
                      <LedgerTableRow
                        key={row.id}
                        row={row}
                        households={householdsForLabels}
                        zebra={idx % 2 === 1}
                        memoValue={행_메모_문자열을_구한다(row, memoOverrides)}
                        onEditMemo={() => 비고_수정_모달을_연다(row)}
                      />
                    ))}
                  </tbody>
                </table>
                </div>
                <p className="border-t border-zinc-800 px-3 py-2 text-right text-xs text-zinc-600">
                  {searchQuery.trim() || hasActiveColumnFilters
                    ? `표시 ${sortedRows.length} / 전체 ${totalBase}행`
                    : `총 ${sortedRows.length}행`}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <FormModal
        open={memoModalRow !== null}
        onOpenChange={(open) => {
          if (!open) setMemoModalRow(null);
        }}
        title="비고 수정"
        description={
          memoModalRow
            ? memoModalRow.itemLabel ?? memoModalRow.inventoryItemId
            : undefined
        }
        onSubmit={비고_모달에서_저장한다}
        submitLabel="저장"
      >
        {memoModalRow?.type === "waste" && memoModalRow.reason ? (
          <p className="mb-4 text-sm text-zinc-400">
            폐기 사유:{" "}
            <span className="text-zinc-200">
              {폐기_사유_라벨을_구한다(memoModalRow.reason)}
            </span>
          </p>
        ) : null}
        <label htmlFor="ledger-memo-draft" className="text-xs font-medium text-zinc-400">
          메모
        </label>
        <textarea
          id="ledger-memo-draft"
          value={memoDraft}
          onChange={(e) => setMemoDraft(e.target.value)}
          rows={5}
          placeholder="메모를 입력하세요"
          className="mt-1.5 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/30"
        />
      </FormModal>
    </motion.div>
  );
}

function LedgerTableRow({
  row,
  households,
  zebra,
  memoValue,
  onEditMemo,
}: {
  row: InventoryLedgerRow;
  households: Household[];
  zebra: boolean;
  memoValue: string;
  onEditMemo: () => void;
}) {
  const { 날짜, 시각 } = 일시_문자열을_구한다(row.createdAt);
  const delta = row.quantityDelta;

  const { 분류, 이름, 규격 } = 품목_라벨을_분해한다(
    row.itemLabel,
    row.inventoryItemId,
  );

  const loc = 이력_행_위치_열을_구한다(households, row);

  return (
    <tr
      className={`border-b border-zinc-800/90 ${zebra ? "bg-zinc-900/40" : "bg-transparent"} hover:bg-zinc-800/35`}
    >
      <td className="w-[6%] whitespace-nowrap px-3 py-2 align-middle tabular-nums text-zinc-300">
        <span className="block text-[13px]">{날짜}</span>
        {시각 ? (
          <span className="block text-xs text-zinc-500">{시각}</span>
        ) : null}
      </td>
      <td className="w-[8%] min-w-20 px-3 py-2 align-middle">
        <span className="line-clamp-2 wrap-break-words text-xs text-zinc-300">
          {loc.householdName}
        </span>
      </td>
      <td className="w-[7%] min-w-16 px-3 py-2 align-middle">
        <span className="line-clamp-2 wrap-break-words text-xs text-zinc-400">
          {loc.roomName}
        </span>
      </td>
      <td className="w-[8%] min-w-20 px-3 py-2 align-middle">
        <span className="line-clamp-2 wrap-break-words text-xs text-zinc-400">
          {loc.placeLabel}
        </span>
      </td>
      <td className="w-[8%] min-w-20 px-3 py-2 align-middle">
        <span className="line-clamp-2 wrap-break-words text-xs text-zinc-400">
          {loc.detailLabel}
        </span>
      </td>
      <td className="w-[8%] px-3 py-2 align-middle text-zinc-300">
        <span className="line-clamp-2 wrap-break-words">{분류}</span>
      </td>
      <td className="w-[9%] px-3 py-2 align-middle font-medium text-zinc-100">
        <span className="line-clamp-2 wrap-break-words">{이름}</span>
      </td>
      <td className="w-[7%] px-3 py-2 align-middle tabular-nums text-zinc-400">
        <span className="line-clamp-2 wrap-break-words">{규격}</span>
      </td>
      <td className="w-[5%] px-3 py-2 align-middle">
        <span className={구분_뱃지_클래스를_구한다(row.type)}>
          {이력_유형_라벨을_구한다(row.type)}
        </span>
      </td>
      <td className="w-[8%] px-3 py-2 align-middle text-xs text-zinc-400">
        <span className="line-clamp-2 wrap-break-words">
          {폐기_사유_열_텍스트를_구한다(row)}
        </span>
      </td>
      <td className="w-[6%] px-3 py-2 align-middle">
        <div className="flex justify-end">
          <span className={증감_뱃지_클래스를_구한다(delta)}>
            {delta > 0 ? "+" : ""}
            {delta}
          </span>
        </div>
      </td>
      <td className="w-[5%] whitespace-nowrap px-3 py-2 text-right align-middle tabular-nums font-medium text-zinc-200">
        {row.quantityAfter}
      </td>
      <td className="min-w-0 align-middle px-2 py-2">
        <button
          type="button"
          onClick={onEditMemo}
          className="block w-full min-w-0 max-w-[min(28rem,48vw)] cursor-pointer truncate border-0 bg-transparent p-0 text-left font-inherit text-xs text-zinc-400 underline-offset-2 transition-colors hover:text-zinc-300 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/45"
          aria-label={`비고 편집: ${row.itemLabel ?? row.inventoryItemId}`}
        >
          {비고_메모_표시를_구한다(memoValue)}
        </button>
      </td>
    </tr>
  );
}
