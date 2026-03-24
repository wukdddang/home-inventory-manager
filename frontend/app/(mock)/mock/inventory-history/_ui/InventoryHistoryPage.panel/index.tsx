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
import type {
  Household,
  InventoryLedgerRow,
  InventoryLedgerType,
} from "@/types/domain";
import { useAppRoutePrefix } from "@/lib/use-app-route-prefix";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

const LEDGER_PAGE_SIZE = 15;
const LEDGER_TABLE_COL_COUNT = 13;

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
  return overrides[row.id] !== undefined
    ? overrides[row.id]!
    : (row.memo ?? "");
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

/** 사용자가 열 정렬을 끄면(scope default) 목록은 일시 내림차순으로 둔다 */
type SortPhase =
  | { scope: "default" }
  | { scope: "column"; column: SortColumn; dir: "asc" | "desc" };

const DEFAULT_LEDGER_SORT: { column: SortColumn; dir: "asc" | "desc" } = {
  column: "createdAt",
  dir: "desc",
};

function 열_첫_정렬_방향을_구한다(column: SortColumn): "asc" | "desc" {
  return column === "createdAt" ? "desc" : "asc";
}

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
  if (filters.type && 이력_유형_라벨을_구한다(row.type) !== filters.type) {
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

function 이력_페이지네이션_컨트롤({
  pageIndex,
  totalPages,
  onPrev,
  onNext,
  onGoToPage,
}: {
  pageIndex: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onGoToPage: (page: number) => void;
}) {
  const canPrev = pageIndex > 0;
  const canNext = pageIndex < totalPages - 1;
  return (
    <nav
      className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2"
      aria-label="페이지네이션"
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        className="inline-flex h-8 cursor-pointer items-center gap-0.5 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-[11px] font-medium text-zinc-200 transition-colors hover:border-teal-500/50 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="size-3.5 shrink-0" aria-hidden />
        이전
      </button>
      {totalPages <= 8 ? (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: totalPages }, (_, p) => {
            const active = p === pageIndex;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onGoToPage(p)}
                aria-current={active ? "page" : undefined}
                className={`inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border text-[11px] font-semibold tabular-nums transition-colors ${
                  active
                    ? "border-teal-500/60 bg-teal-500/15 text-teal-200"
                    : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                }`}
              >
                {p + 1}
              </button>
            );
          })}
        </div>
      ) : (
        <span className="px-1 text-[11px] font-medium tabular-nums text-zinc-400">
          {pageIndex + 1} / {totalPages}
        </span>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        className="inline-flex h-8 cursor-pointer items-center gap-0.5 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-[11px] font-medium text-zinc-200 transition-colors hover:border-teal-500/50 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        다음
        <ChevronRight className="size-3.5 shrink-0" aria-hidden />
      </button>
    </nav>
  );
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

function 헤더_열_필터_셀렉트({
  열이름,
  value,
  onChange,
  options,
  align = "left",
  className = "",
}: {
  열이름: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  align?: "left" | "right";
  className?: string;
}) {
  const 비어있음 = value === "";
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={`${열이름} 열 필터`}
      className={`box-border h-7 min-w-0 flex-1 cursor-pointer rounded border border-zinc-600/80 bg-zinc-950 px-1.5 py-0 text-[11px] outline-none focus:border-teal-500 ${
        align === "right" ? "text-right" : "text-left"
      } ${비어있음 ? "text-zinc-500" : "text-zinc-200"} ${className}`.trim()}
    >
      <option value="">{열이름}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

/** 호버 시 아이콘 표시 · 활성 열은 방향 표시 — 같은 열 클릭 시 첫 방향 → 반대 → 기본(일시 내림차순) */
function 헤더_정렬_호버_버튼({
  column,
  label,
  sortPhase,
  onSort,
}: {
  column: SortColumn;
  label: string;
  sortPhase: SortPhase;
  onSort: (c: SortColumn) => void;
}) {
  const active = sortPhase.scope === "column" && sortPhase.column === column;
  const sortDir = active ? sortPhase.dir : "asc";
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className={`inline-flex shrink-0 items-center justify-center rounded p-0.5 transition-opacity focus-visible:outline focus-visible:ring-2 focus-visible:ring-teal-500/50 ${
        active
          ? "text-teal-400 opacity-100"
          : "text-zinc-400 opacity-0 group-hover:opacity-100"
      }`}
      aria-label={
        active
          ? `${label} 정렬, ${sortDir === "asc" ? "오름차순" : "내림차순"} 적용`
          : `${label} 정렬`
      }
    >
      {active ? (
        sortDir === "asc" ? (
          <ArrowUp className="size-3.5" aria-hidden />
        ) : (
          <ArrowDown className="size-3.5" aria-hidden />
        )
      ) : (
        <ArrowUp className="size-3.5 text-zinc-500" aria-hidden />
      )}
    </button>
  );
}

/** 한 줄: 필터(select) 또는 라벨 + 호버 시 정렬 아이콘 */
function 정렬_및_필터_헤더({
  column,
  label,
  sortPhase,
  onSort,
  align = "left",
  thClassName = "",
  filter,
}: {
  column: SortColumn;
  label: string;
  sortPhase: SortPhase;
  onSort: (c: SortColumn) => void;
  align?: "left" | "right";
  thClassName?: string;
  filter?: {
    value: string;
    options: string[];
    onChange: (v: string) => void;
  };
}) {
  const rowClass =
    align === "right"
      ? "group flex min-w-0 items-center justify-end gap-1"
      : "group flex min-w-0 items-center gap-1";
  return (
    <th
      scope="col"
      className={`sticky top-0 z-10 border-b border-zinc-700 bg-zinc-900 px-2 py-1 align-middle text-xs font-semibold tracking-wide ${thClassName}`.trim()}
    >
      <div className={rowClass}>
        {filter ? (
          <헤더_열_필터_셀렉트
            열이름={label}
            value={filter.value}
            onChange={filter.onChange}
            options={filter.options}
            align={align}
          />
        ) : (
          <span
            className={`min-w-0 flex-1 truncate text-zinc-400 ${
              align === "right" ? "text-right" : "text-left"
            }`}
          >
            {label}
          </span>
        )}
        <헤더_정렬_호버_버튼
          column={column}
          label={label}
          sortPhase={sortPhase}
          onSort={onSort}
        />
      </div>
    </th>
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
  const [sortPhase, setSortPhase] = useState<SortPhase>({
    scope: "default",
  });
  const [memoOverrides, setMemoOverrides] = useState<Record<string, string>>(
    {},
  );
  const [memoModalRow, setMemoModalRow] = useState<InventoryLedgerRow | null>(
    null,
  );
  const [memoDraft, setMemoDraft] = useState("");
  const [pageIndex, setPageIndex] = useState(0);

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
    [columnFilteredRows, householdsForLabels, searchQuery, memoOverrides],
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
      householdsForLabels,
      sortColumn,
      sortDir,
      memoOverrides,
    );
  }, [searchedRows, householdsForLabels, sortPhase, memoOverrides]);

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

  const totalBase = baseRows.length;
  const hasFilterContext = searchQuery.trim() !== "" || hasActiveColumnFilters;
  const footerRangeStart =
    totalFiltered === 0 ? 0 : activePageIndex * LEDGER_PAGE_SIZE + 1;
  const footerRangeEnd = Math.min(
    totalFiltered,
    (activePageIndex + 1) * LEDGER_PAGE_SIZE,
  );

  return (
    <motion.div
      className="flex w-full min-w-0 max-w-none min-h-0 flex-1 flex-col gap-6 overflow-hidden"
      initial="initial"
      animate="animate"
      variants={appViewPresenceVariants}
      transition={appViewPresenceTransition}
    >
      <div className="shrink-0">
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

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div
          className="flex w-full min-w-0 shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-3"
          role="toolbar"
          aria-label="목록 필터 및 범례"
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <select
              value={filterHouseholdId}
              onChange={(e) => {
                setPageIndex(0);
                setColumnFilters({});
                setFilterHouseholdId(e.target.value);
              }}
              aria-label="표시 거점 범위"
              className={`box-border h-9 min-w-30 shrink-0 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-0 text-xs leading-none outline-none focus:border-teal-500 ${
                filterHouseholdId === "all" ? "text-zinc-500" : "text-zinc-100"
              }`}
            >
              <option value="all">거점</option>
              {householdsForLabels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
            {totalBase > 0 && hasActiveColumnFilters ? (
              <button
                type="button"
                onClick={() => {
                  setPageIndex(0);
                  setColumnFilters({});
                }}
                className="shrink-0 whitespace-nowrap text-xs font-medium text-teal-400/90 hover:underline"
              >
                표 열 필터 초기화
              </button>
            ) : null}
            <div className="relative h-9 min-w-0 flex-1 basis-full sm:min-w-48 sm:basis-0">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
                aria-hidden
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setPageIndex(0);
                  setSearchQuery(e.target.value);
                }}
                placeholder="검색 (거점·품목·구분·비고 등)"
                className={`box-border h-9 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-950 py-0 pl-9 pr-3 text-sm leading-none outline-none placeholder:text-zinc-600 focus:border-teal-500 ${
                  searchQuery.trim() === "" ? "text-zinc-500" : "text-zinc-100"
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
          <div className="flex min-h-0 flex-1 flex-col justify-center rounded-xl border border-dashed border-zinc-700 px-4 py-10">
            <p className="text-center text-sm text-zinc-500">
              아직 기록이 없습니다. 대시보드 물품 목록에서 소비·폐기를 남기면
              여기에 쌓입니다.
            </p>
            <p className="mt-6 text-right text-xs text-zinc-600">총 0행</p>
          </div>
        ) : (
          <>
            {sortedRows.length === 0 ? (
              <div className="flex min-h-0 flex-1 flex-col justify-center rounded-xl border border-dashed border-zinc-700 px-4 py-10">
                <p className="text-center text-sm text-zinc-500">
                  {columnFilteredRows.length === 0
                    ? "표 열 필터 조건에 맞는 행이 없습니다."
                    : "검색 조건에 맞는 행이 없습니다."}
                </p>
                <p className="mt-6 text-right text-xs text-zinc-600">
                  {hasFilterContext
                    ? `표시 ${totalFiltered} / 전체 ${totalBase}행`
                    : `총 ${totalFiltered}행`}
                </p>
              </div>
            ) : (
              <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950/80 shadow-inner ring-1 ring-zinc-800/80">
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-auto [scrollbar-width:thin]">
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <table className="w-full min-w-350 table-fixed border-collapse text-left text-sm">
                      <thead>
                        <tr className="bg-zinc-900">
                          <정렬_및_필터_헤더
                            column="createdAt"
                            label="일시"
                            sortPhase={sortPhase}
                            onSort={handleSort}
                            thClassName="w-[6%] whitespace-nowrap"
                          />
                          <정렬_및_필터_헤더
                            column="householdName"
                            label="거점"
                            sortPhase={sortPhase}
                            onSort={handleSort}
                            thClassName="w-[8%] min-w-[5rem]"
                            filter={{
                              value: columnFilters.householdName ?? "",
                              options: columnFilterOptions.householdName,
                              onChange: (v) =>
                                컬럼_필터를_바꾼다("householdName", v),
                            }}
                          />
                          <정렬_및_필터_헤더
                            column="roomName"
                            label="방"
                            sortPhase={sortPhase}
                            onSort={handleSort}
                            thClassName="w-[7%] min-w-[4rem]"
                            filter={{
                              value: columnFilters.roomName ?? "",
                              options: columnFilterOptions.roomName,
                              onChange: (v) =>
                                컬럼_필터를_바꾼다("roomName", v),
                            }}
                          />
                          <정렬_및_필터_헤더
                            column="placeLabel"
                            label="장소"
                            sortPhase={sortPhase}
                            onSort={handleSort}
                            thClassName="w-[8%] min-w-[5rem]"
                            filter={{
                              value: columnFilters.placeLabel ?? "",
                              options: columnFilterOptions.placeLabel,
                              onChange: (v) =>
                                컬럼_필터를_바꾼다("placeLabel", v),
                            }}
                          />
                          <정렬_및_필터_헤더
                            column="detailLabel"
                            label="세부장소"
                            sortPhase={sortPhase}
                            onSort={handleSort}
                            thClassName="w-[8%] min-w-[5rem]"
                            filter={{
                              value: columnFilters.detailLabel ?? "",
                              options: columnFilterOptions.detailLabel,
                              onChange: (v) =>
                                컬럼_필터를_바꾼다("detailLabel", v),
                            }}
                          />
                          <정렬_및_필터_헤더
                            column="category"
                            label="분류"
                            sortPhase={sortPhase}
                            onSort={handleSort}
                            thClassName="w-[8%]"
                            filter={{
                              value: columnFilters.category ?? "",
                              options: columnFilterOptions.category,
                              onChange: (v) =>
                                컬럼_필터를_바꾼다("category", v),
                            }}
                          />
                          <정렬_및_필터_헤더
                            column="itemName"
                            label="품목"
                            sortPhase={sortPhase}
                            onSort={handleSort}
                            thClassName="w-[9%]"
                            filter={{
                              value: columnFilters.itemName ?? "",
                              options: columnFilterOptions.itemName,
                              onChange: (v) =>
                                컬럼_필터를_바꾼다("itemName", v),
                            }}
                          />
                          <정렬_및_필터_헤더
                            column="spec"
                            label="규격"
                            sortPhase={sortPhase}
                            onSort={handleSort}
                            thClassName="w-[7%]"
                            filter={{
                              value: columnFilters.spec ?? "",
                              options: columnFilterOptions.spec,
                              onChange: (v) => 컬럼_필터를_바꾼다("spec", v),
                            }}
                          />
                          <정렬_및_필터_헤더
                            column="type"
                            label="구분"
                            sortPhase={sortPhase}
                            onSort={handleSort}
                            thClassName="w-[5%] whitespace-nowrap"
                            filter={{
                              value: columnFilters.type ?? "",
                              options: columnFilterOptions.type,
                              onChange: (v) => 컬럼_필터를_바꾼다("type", v),
                            }}
                          />
                          <정렬_및_필터_헤더
                            column="wasteReason"
                            label="폐기 사유"
                            sortPhase={sortPhase}
                            onSort={handleSort}
                            thClassName="w-[8%]"
                          />
                          <정렬_및_필터_헤더
                            column="delta"
                            label="증감"
                            sortPhase={sortPhase}
                            onSort={handleSort}
                            align="right"
                            thClassName="w-[6%] whitespace-nowrap"
                          />
                          <정렬_및_필터_헤더
                            column="balance"
                            label="잔여 수량"
                            sortPhase={sortPhase}
                            onSort={handleSort}
                            align="right"
                            thClassName="w-[5%] whitespace-nowrap"
                          />
                          <정렬_및_필터_헤더
                            column="note"
                            label="비고(수정 가능)"
                            sortPhase={sortPhase}
                            onSort={handleSort}
                            thClassName="min-w-0"
                          />
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRows.map((row, idx) => (
                          <LedgerTableRow
                            key={row.id}
                            row={row}
                            households={householdsForLabels}
                            zebra={idx % 2 === 1}
                            memoValue={행_메모_문자열을_구한다(
                              row,
                              memoOverrides,
                            )}
                            onEditMemo={() => 비고_수정_모달을_연다(row)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <table
                    className="w-full min-w-350 table-fixed border-collapse border-t border-zinc-800 bg-zinc-900/95 text-left text-sm"
                    aria-label="재고 이력 표 요약"
                  >
                    <tfoot>
                      <tr>
                        <td
                          colSpan={LEDGER_TABLE_COL_COUNT}
                          className="px-3 py-2.5 align-middle"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="min-w-0 text-left text-xs leading-relaxed text-zinc-600">
                              {totalFiltered === 0 ? (
                                "표시할 행 없음"
                              ) : (
                                <>
                                  <span className="font-medium text-zinc-400">
                                    {footerRangeStart}–{footerRangeEnd}번째
                                  </span>
                                  <span className="text-zinc-600">
                                    {" "}
                                    / 이번 목록 {totalFiltered}행
                                  </span>
                                  {hasFilterContext ? (
                                    <span className="text-zinc-500">
                                      {" "}
                                      (거점 범위·검색·표 열 필터 적용 전{" "}
                                      {totalBase}행)
                                    </span>
                                  ) : (
                                    <span className="text-zinc-500">
                                      {" "}
                                      · 페이지당 {LEDGER_PAGE_SIZE}행
                                    </span>
                                  )}
                                </>
                              )}
                            </p>
                            <이력_페이지네이션_컨트롤
                              pageIndex={activePageIndex}
                              totalPages={totalPages}
                              onPrev={() =>
                                setPageIndex(Math.max(0, activePageIndex - 1))
                              }
                              onNext={() =>
                                setPageIndex(
                                  Math.min(maxPageIndex, activePageIndex + 1),
                                )
                              }
                              onGoToPage={(p) => setPageIndex(p)}
                            />
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
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
            ? (memoModalRow.itemLabel ?? memoModalRow.inventoryItemId)
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
        <label
          htmlFor="ledger-memo-draft"
          className="text-xs font-medium text-zinc-400"
        >
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
