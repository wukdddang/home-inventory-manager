"use client";

import { AlertModal } from "@/app/_ui/alert-modal";
import { PeriodFilterToolbar } from "@/app/_ui/table-period-filter-row";
import { useAppRoutePrefix } from "@/lib/use-app-route-prefix";
import { 날짜키가_기간에_포함되는가 } from "@/lib/table-period-filter";
import { resolveProductImageUrl } from "@/lib/product-catalog-helpers";
import { getSharedProductCatalog } from "@/lib/local-store";
import { cn } from "@/lib/utils";
import type { PurchaseBatchLot, PurchaseRecord } from "@/types/domain";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePurchases } from "../../_hooks/usePurchases";
import {
  구매_로트_행_배분_총액을_구한다,
  오늘_날짜_문자열을_구한다,
  유통기한까지_일수를_구한다,
} from "@/lib/purchase-lot-helpers";
import { PurchaseRegisterModal } from "./PurchaseRegister.module";

const PURCHASE_LOT_TABLE_COL_COUNT = 11;

/** 열 필터에서만 사용 — 실제 구매처 이름과 겹치지 않게 길게 둠 */
const 구매처_필터_미입력_라벨 = "(구매처 미입력)";

type PurchaseLotRow = { purchase: PurchaseRecord; batch: PurchaseBatchLot };

/** 재고 이력 표와 동일 — `식료품 › 라면 › 1봉` 형태를 분류·이름·규격으로 나눈다 */
function 품목_라벨을_분해한다(
  itemLabel: string | undefined,
  fallbackId: string,
): { 분류: string; 이름: string; 규격: string } {
  const raw = (itemLabel ?? "").trim();
  if (!raw) {
    return { 분류: "—", 이름: fallbackId, 규격: "—" };
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

function 문자열을_비교용으로_정규화한다(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

/** 품목 라벨 규격과 variantCaption 이 같으면 한 번만 표시 */
function 구매_용량포장_텍스트를_구한다(p: PurchaseRecord): string {
  const { 규격 } = 품목_라벨을_분해한다(
    p.itemName,
    p.inventoryItemId ?? p.id,
  );
  const cap = p.variantCaption?.trim() ?? "";
  const norm규격 = 규격.trim();
  if (norm규격 !== "—" && cap) {
    if (
      문자열을_비교용으로_정규화한다(norm규격) ===
      문자열을_비교용으로_정규화한다(cap)
    ) {
      return norm규격;
    }
    return `${norm규격} · ${cap}`;
  }
  if (norm규격 !== "—") return norm규격;
  if (cap) return cap;
  return "—";
}

function 만료_뱃지를_렌더한다(days: number | null) {
  if (days === null) {
    return (
      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
        날짜 확인
      </span>
    );
  }
  if (days < 0) {
    return (
      <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-medium text-rose-200 ring-1 ring-rose-500/40">
        만료 후 {Math.abs(days)}일
      </span>
    );
  }
  if (days === 0) {
    return (
      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-100 ring-1 ring-amber-500/35">
        오늘 만료
      </span>
    );
  }
  if (days <= 3) {
    return (
      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-100 ring-1 ring-amber-500/30">
        D-{days}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
      D-{days}
    </span>
  );
}

type SortColumn =
  | "category"
  | "itemName"
  | "supplier"
  | "packSpec"
  | "purchasedOn"
  | "unitPrice"
  | "totalPrice"
  | "expiresOn"
  | "quantity"
  | "expiryDays";

type ColumnFilterKey =
  | "category"
  | "itemName"
  | "packSpec"
  | "purchasedOn"
  | "supplier"
  | "expiresOn";

type SortPhase =
  | { scope: "default" }
  | { scope: "column"; column: SortColumn; dir: "asc" | "desc" };

const DEFAULT_PURCHASE_LOT_SORT: { column: SortColumn; dir: "asc" | "desc" } =
  {
    column: "purchasedOn",
    dir: "desc",
  };

function 열_첫_정렬_방향을_구한다(column: SortColumn): "asc" | "desc" {
  if (column === "purchasedOn" || column === "expiresOn") return "desc";
  if (column === "expiryDays") return "asc";
  return "asc";
}

function 구매_로트_행_검색_텍스트를_구한다(row: PurchaseLotRow): string {
  const p = row.purchase;
  const b = row.batch;
  const { 분류, 이름, 규격 } = 품목_라벨을_분해한다(
    p.itemName,
    p.inventoryItemId ?? p.id,
  );
  const pack = 구매_용량포장_텍스트를_구한다(p);
  const days = 유통기한까지_일수를_구한다(b.expiresOn);
  const 로트총액 = 구매_로트_행_배분_총액을_구한다(p, b);
  const 임박 =
    days === null
      ? "날짜확인"
      : days < 0
        ? `만료후${Math.abs(days)}일`
        : days === 0
          ? "오늘만료"
          : `d-${days}`;
  return [
    분류,
    이름,
    규격,
    pack,
    p.supplierName ?? "",
    p.purchasedOn,
    String(p.unitPrice),
    String(로트총액),
    String(p.totalPrice),
    b.expiresOn,
    String(b.quantity),
    p.unitSymbol,
    p.itemName ?? "",
    임박,
    p.id,
    b.id,
  ]
    .join(" ")
    .toLowerCase();
}

function 구매_로트_행이_검색어에_일치하는가(
  row: PurchaseLotRow,
  query: string,
): boolean {
  const q = query.trim();
  if (!q) return true;
  const haystack = 구매_로트_행_검색_텍스트를_구한다(row);
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  return tokens.every((t) => haystack.includes(t));
}

function 구매_로트_행이_컬럼_필터에_일치하는가(
  row: PurchaseLotRow,
  filters: Partial<Record<ColumnFilterKey, string>>,
): boolean {
  const p = row.purchase;
  const b = row.batch;
  const { 분류, 이름 } = 품목_라벨을_분해한다(
    p.itemName,
    p.inventoryItemId ?? p.id,
  );
  const pack = 구매_용량포장_텍스트를_구한다(p);

  if (filters.category && 분류 !== filters.category) return false;
  if (filters.itemName && 이름 !== filters.itemName) return false;
  if (filters.packSpec && pack !== filters.packSpec) return false;
  if (filters.purchasedOn && p.purchasedOn !== filters.purchasedOn) {
    return false;
  }
  if (filters.expiresOn && b.expiresOn !== filters.expiresOn) return false;
  if (filters.supplier) {
    if (filters.supplier === 구매처_필터_미입력_라벨) {
      if (p.supplierName?.trim()) return false;
    } else if (p.supplierName !== filters.supplier) {
      return false;
    }
  }
  return true;
}

function 구매_로트_정렬_값을_구한다(
  row: PurchaseLotRow,
  column: SortColumn,
): string | number {
  const p = row.purchase;
  const b = row.batch;
  const { 분류, 이름 } = 품목_라벨을_분해한다(
    p.itemName,
    p.inventoryItemId ?? p.id,
  );
  switch (column) {
    case "category":
      return 분류;
    case "itemName":
      return 이름;
    case "supplier":
      return p.supplierName?.trim() ?? "";
    case "packSpec":
      return 구매_용량포장_텍스트를_구한다(p);
    case "purchasedOn":
      return p.purchasedOn;
    case "unitPrice":
      return p.unitPrice;
    case "totalPrice":
      return 구매_로트_행_배분_총액을_구한다(p, b);
    case "expiresOn":
      return b.expiresOn;
    case "quantity":
      return b.quantity;
    case "expiryDays": {
      const d = 유통기한까지_일수를_구한다(b.expiresOn);
      return d === null ? Number.POSITIVE_INFINITY : d;
    }
    default:
      return "";
  }
}

function 구매_로트_행_배열을_정렬한다(
  rows: PurchaseLotRow[],
  column: SortColumn,
  dir: "asc" | "desc",
): PurchaseLotRow[] {
  const mul = dir === "asc" ? 1 : -1;
  const out = [...rows];
  out.sort((a, b) => {
    const va = 구매_로트_정렬_값을_구한다(a, column);
    const vb = 구매_로트_정렬_값을_구한다(b, column);
    let cmp = 0;
    if (typeof va === "number" && typeof vb === "number") {
      cmp = va - vb;
    } else {
      cmp = String(va).localeCompare(String(vb), "ko");
    }
    if (cmp !== 0) return cmp * mul;
    const ka = `${a.purchase.id}\0${a.batch.id}`;
    const kb = `${b.purchase.id}\0${b.batch.id}`;
    return ka.localeCompare(kb);
  });
  return out;
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
      className={`box-border h-7 min-w-0 flex-1 cursor-pointer rounded border border-zinc-600/80 bg-zinc-950 px-1.5 py-0 text-xs outline-none focus:border-teal-500 ${
        align === "right" ? "text-right" : "text-left"
      } ${비어있음 ? "text-zinc-300" : "text-zinc-200"} ${className}`.trim()}
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
          : "text-zinc-300 opacity-0 group-hover:opacity-100"
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
        <ArrowUp className="size-3.5 text-zinc-300" aria-hidden />
      )}
    </button>
  );
}

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
            className={`min-w-0 flex-1 truncate text-zinc-300 ${
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

const rowBtnClass =
  "cursor-pointer rounded-lg border border-zinc-600 px-2.5 py-1 text-xs text-zinc-200 hover:bg-zinc-800";

export function PurchaseLotsSection() {
  const prefix = useAppRoutePrefix();
  const {
    households,
    purchases,
    거점_목록을_새로_고친다,
    구매를_추가_한다,
    구매를_삭제_한다,
  } = usePurchases();

  const catalog = useSyncExternalStore(
    () => () => {},
    () => getSharedProductCatalog(),
    () => null,
  );

  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(
    null,
  );
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerKey, setRegisterKey] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<PurchaseRecord | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [columnFilters, setColumnFilters] = useState<
    Partial<Record<ColumnFilterKey, string>>
  >({});
  const [sortPhase, setSortPhase] = useState<SortPhase>({ scope: "default" });
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  const viewingHouseholdId = useMemo(() => {
    if (households.length === 0) return null;
    if (
      selectedHouseholdId != null &&
      households.some((h) => h.id === selectedHouseholdId)
    ) {
      return selectedHouseholdId;
    }
    return households[0]?.id ?? null;
  }, [households, selectedHouseholdId]);

  const selected = useMemo(
    () => households.find((h) => h.id === viewingHouseholdId) ?? null,
    [households, viewingHouseholdId],
  );

  const filteredPurchases = useMemo(
    () =>
      viewingHouseholdId
        ? purchases.filter((p) => p.householdId === viewingHouseholdId)
        : [],
    [purchases, viewingHouseholdId],
  );

  const prevHouseholdIdRef = useRef(viewingHouseholdId);
  if (prevHouseholdIdRef.current !== viewingHouseholdId) {
    prevHouseholdIdRef.current = viewingHouseholdId;
    setSearchQuery("");
    setColumnFilters({});
    setSortPhase({ scope: "default" });
    setPeriodStart("");
    setPeriodEnd("");
  }

  const baseLotRows = useMemo((): PurchaseLotRow[] => {
    return filteredPurchases.flatMap((p) =>
      p.batches.map((b) => ({ purchase: p, batch: b })),
    );
  }, [filteredPurchases]);

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

  const columnFilterOptions = useMemo(() => {
    const category = new Set<string>();
    const itemName = new Set<string>();
    const packSpec = new Set<string>();
    const purchasedOn = new Set<string>();
    const expiresOn = new Set<string>();
    const supplierNames = new Set<string>();
    let 구매처_없음_행_있음 = false;

    for (const { purchase: p, batch: b } of baseLotRows) {
      const { 분류, 이름 } = 품목_라벨을_분해한다(
        p.itemName,
        p.inventoryItemId ?? p.id,
      );
      category.add(분류);
      itemName.add(이름);
      packSpec.add(구매_용량포장_텍스트를_구한다(p));
      purchasedOn.add(p.purchasedOn);
      expiresOn.add(b.expiresOn);
      const sn = p.supplierName?.trim();
      if (sn) supplierNames.add(sn);
      else 구매처_없음_행_있음 = true;
    }

    const sortStr = (a: string, b: string) => a.localeCompare(b, "ko");
    const supplierOpts: string[] = [];
    if (구매처_없음_행_있음) supplierOpts.push(구매처_필터_미입력_라벨);
    supplierOpts.push(...[...supplierNames].sort(sortStr));

    return {
      category: [...category].sort(sortStr),
      itemName: [...itemName].sort(sortStr),
      packSpec: [...packSpec].sort(sortStr),
      purchasedOn: [...purchasedOn].sort(sortStr).reverse(),
      expiresOn: [...expiresOn].sort(sortStr).reverse(),
      supplier: supplierOpts,
    };
  }, [baseLotRows]);

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
      baseLotRows.filter((r) =>
        날짜키가_기간에_포함되는가(
          r.purchase.purchasedOn,
          periodStart,
          periodEnd,
        ),
      ),
    [baseLotRows, periodStart, periodEnd],
  );

  const columnFilteredRows = useMemo(
    () =>
      periodFilteredRows.filter((r) =>
        구매_로트_행이_컬럼_필터에_일치하는가(r, columnFilters),
      ),
    [periodFilteredRows, columnFilters],
  );

  const searchedRows = useMemo(
    () =>
      columnFilteredRows.filter((r) =>
        구매_로트_행이_검색어에_일치하는가(r, searchQuery),
      ),
    [columnFilteredRows, searchQuery],
  );

  const sortedRows = useMemo(() => {
    const sortColumn =
      sortPhase.scope === "column"
        ? sortPhase.column
        : DEFAULT_PURCHASE_LOT_SORT.column;
    const sortDir =
      sortPhase.scope === "column"
        ? sortPhase.dir
        : DEFAULT_PURCHASE_LOT_SORT.dir;
    return 구매_로트_행_배열을_정렬한다(searchedRows, sortColumn, sortDir);
  }, [searchedRows, sortPhase]);

  const displayRows = useMemo(
    () =>
      sortedRows.map((row, i) => ({
        ...row,
        zebra: i % 2 === 1,
      })),
    [sortedRows],
  );

  const totalBase = baseLotRows.length;
  const totalFiltered = sortedRows.length;
  const hasFilterContext =
    searchQuery.trim() !== "" ||
    hasActiveColumnFilters ||
    hasActivePeriodFilter;

  const inventoryItems = selected?.items ?? [];

  if (households.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-center">
        <p className="text-sm text-zinc-300">
          등록된 거점이 없습니다. 메인에서 거점을 만든 뒤 구매·로트를
          추가하세요.
        </p>
        <Link
          href={`${prefix}/dashboard`}
          className="mt-4 inline-block cursor-pointer rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400"
        >
          메인(대시보드)으로
        </Link>
      </div>
    );
  }

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <h2 className="text-lg font-semibold text-white">구매·로트</h2>
          <p className="text-sm text-zinc-300">
            구매 단위로 기록하고 로트별 유통기한을 나눕니다. 재고 행과 연결은
            선택이며, 나중에 메인에서 재고를 맞춰도 됩니다.{" "}
            <span className="text-zinc-300">him-purchases</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => 거점_목록을_새로_고친다()}
            className={cn(rowBtnClass, "border-zinc-700 text-zinc-300")}
          >
            거점·카탈로그 새로고침
          </button>
          <button
            type="button"
            disabled={!viewingHouseholdId}
            onClick={() => {
              setRegisterKey((k) => k + 1);
              setRegisterOpen(true);
            }}
            className="cursor-pointer rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400 disabled:pointer-events-none disabled:opacity-40"
          >
            구매 등록
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-zinc-800/80 pb-3">
        {households.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => setSelectedHouseholdId(h.id)}
            className={cn(
              "cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              h.id === viewingHouseholdId
                ? "bg-teal-500/15 text-teal-200 ring-1 ring-teal-500/35"
                : "bg-zinc-900 text-zinc-300 ring-1 ring-zinc-800 hover:bg-zinc-800 hover:text-zinc-200",
            )}
          >
            {h.name}
          </button>
        ))}
      </div>

      {filteredPurchases.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/30 px-4 py-10 text-center text-sm text-zinc-300">
          이 거점에 등록된 구매가 없습니다.「구매 등록」으로 첫 로트를 추가해
          보세요. 이미 보관 장소에 넣은 재고는 메인에서 등록해 보관 위치까지 한 번에
          맞출 수 있습니다.
          <p className="mt-2 text-xs text-zinc-300">
            오늘 날짜: {오늘_날짜_문자열을_구한다()}
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 w-full min-w-0 flex-col gap-3">
          <div
            className="flex w-full min-w-0 shrink-0 flex-col gap-2 sm:flex-row sm:items-center"
            role="toolbar"
            aria-label="구매 로트 검색 및 열 필터"
          >
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              {totalBase > 0 && hasActiveColumnFilters ? (
                <button
                  type="button"
                  onClick={() => setColumnFilters({})}
                  className="shrink-0 whitespace-nowrap text-xs font-medium text-teal-400/90 hover:underline"
                >
                  표 열 필터 초기화
                </button>
              ) : null}
              <PeriodFilterToolbar
                dateFieldLabel="구매일"
                periodStart={periodStart}
                periodEnd={periodEnd}
                onPeriodStartChange={setPeriodStart}
                onPeriodEndChange={setPeriodEnd}
                onClear={() => {
                  setPeriodStart("");
                  setPeriodEnd("");
                }}
              />
              <div className="relative h-9 min-w-0 flex-1 basis-full sm:min-w-48 sm:basis-0">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-300"
                  aria-hidden
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="검색 (분류·품목·용량·구매처·날짜·금액 등)"
                  className={`box-border h-9 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-950 py-0 pl-9 pr-3 text-sm leading-none outline-none placeholder:text-zinc-300 focus:border-teal-500 ${
                    searchQuery.trim() === "" ? "text-zinc-300" : "text-zinc-100"
                  }`}
                  autoComplete="off"
                />
              </div>
            </div>
          </div>

          {sortedRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/30 px-4 py-10 text-center text-sm text-zinc-300">
              {hasActivePeriodFilter &&
              periodFilteredRows.length === 0 &&
              totalBase > 0
                ? "기간 조건에 맞는 로트가 없습니다."
                : columnFilteredRows.length === 0
                  ? "표 열 필터 조건에 맞는 로트가 없습니다."
                  : "검색 조건에 맞는 로트가 없습니다."}
              <p className="mt-4 text-xs text-zinc-400">
                {hasFilterContext
                  ? `표시 ${totalFiltered} / 전체 ${totalBase}개 로트`
                  : `총 ${totalFiltered}개 로트`}
              </p>
            </div>
          ) : (
            <div className="flex min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950/80 shadow-inner ring-1 ring-zinc-800/80">
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-auto [scrollbar-width:thin]">
                <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
                  <table className="w-full min-w-240 table-fixed border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-zinc-900">
                        <정렬_및_필터_헤더
                          column="category"
                          label="분류"
                          sortPhase={sortPhase}
                          onSort={handleSort}
                          thClassName="w-[8%]"
                          filter={{
                            value: columnFilters.category ?? "",
                            options: columnFilterOptions.category,
                            onChange: (v) => 컬럼_필터를_바꾼다("category", v),
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
                            onChange: (v) => 컬럼_필터를_바꾼다("itemName", v),
                          }}
                        />
                        <정렬_및_필터_헤더
                          column="supplier"
                          label="구매처"
                          sortPhase={sortPhase}
                          onSort={handleSort}
                          thClassName="w-[8%]"
                          filter={{
                            value: columnFilters.supplier ?? "",
                            options: columnFilterOptions.supplier,
                            onChange: (v) => 컬럼_필터를_바꾼다("supplier", v),
                          }}
                        />
                        <정렬_및_필터_헤더
                          column="packSpec"
                          label="용량/포장"
                          sortPhase={sortPhase}
                          onSort={handleSort}
                          thClassName="w-[10%]"
                          filter={{
                            value: columnFilters.packSpec ?? "",
                            options: columnFilterOptions.packSpec,
                            onChange: (v) => 컬럼_필터를_바꾼다("packSpec", v),
                          }}
                        />
                        <정렬_및_필터_헤더
                          column="purchasedOn"
                          label="구매일"
                          sortPhase={sortPhase}
                          onSort={handleSort}
                          thClassName="w-[8%] whitespace-nowrap"
                          filter={{
                            value: columnFilters.purchasedOn ?? "",
                            options: columnFilterOptions.purchasedOn,
                            onChange: (v) =>
                              컬럼_필터를_바꾼다("purchasedOn", v),
                          }}
                        />
                        <정렬_및_필터_헤더
                          column="unitPrice"
                          label="단가"
                          sortPhase={sortPhase}
                          onSort={handleSort}
                          align="right"
                          thClassName="w-[8%] whitespace-nowrap"
                        />
                        <정렬_및_필터_헤더
                          column="totalPrice"
                          label="총액"
                          sortPhase={sortPhase}
                          onSort={handleSort}
                          align="right"
                          thClassName="w-[8%] whitespace-nowrap"
                        />
                        <정렬_및_필터_헤더
                          column="expiresOn"
                          label="유통기한"
                          sortPhase={sortPhase}
                          onSort={handleSort}
                          thClassName="w-[9%] whitespace-nowrap"
                          filter={{
                            value: columnFilters.expiresOn ?? "",
                            options: columnFilterOptions.expiresOn,
                            onChange: (v) =>
                              컬럼_필터를_바꾼다("expiresOn", v),
                          }}
                        />
                        <정렬_및_필터_헤더
                          column="quantity"
                          label="수량"
                          sortPhase={sortPhase}
                          onSort={handleSort}
                          thClassName="w-[7%] whitespace-nowrap"
                        />
                        <정렬_및_필터_헤더
                          column="expiryDays"
                          label="임박"
                          sortPhase={sortPhase}
                          onSort={handleSort}
                          thClassName="w-[8%]"
                        />
                        <th
                          scope="col"
                          className="sticky top-0 z-10 w-[7%] border-b border-zinc-700 bg-zinc-900 px-2 py-1 text-right text-xs font-semibold tracking-wide text-zinc-300"
                        />
                      </tr>
                    </thead>
                    <tbody>
                      {displayRows.map(({ purchase: p, batch: b, zebra }) => {
                        const fallbackId = p.inventoryItemId ?? p.id;
                        const { 분류, 이름 } = 품목_라벨을_분해한다(
                          p.itemName,
                          fallbackId,
                        );
                        const 용량포장 = 구매_용량포장_텍스트를_구한다(p);
                        const days = 유통기한까지_일수를_구한다(b.expiresOn);
                        const 로트총액 = 구매_로트_행_배분_총액을_구한다(p, b);
                        return (
                          <tr
                            key={`${p.id}-${b.id}`}
                            className={`border-b border-zinc-800/90 ${zebra ? "bg-zinc-900/40" : "bg-transparent"} hover:bg-zinc-800/35`}
                          >
                            <td className="px-3 py-2 align-middle text-zinc-300">
                              <span className="line-clamp-3 wrap-break-words text-xs">
                                {분류}
                              </span>
                            </td>
                            <td className="px-3 py-2 align-middle font-medium text-zinc-100">
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const imgUrl = catalog ? resolveProductImageUrl(catalog, p.productId) : undefined;
                                  return imgUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={imgUrl} alt="" className="size-6 shrink-0 rounded border border-zinc-700 object-cover" />
                                  ) : null;
                                })()}
                                <span className="line-clamp-3 wrap-break-words">
                                  {이름}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2 align-middle text-zinc-300">
                              <span className="line-clamp-2 wrap-break-words text-xs">
                                {p.supplierName?.trim() ? (
                                  p.supplierName
                                ) : (
                                  <span className="text-zinc-500">—</span>
                                )}
                              </span>
                            </td>
                            <td className="px-3 py-2 align-middle tabular-nums text-zinc-300">
                              <span className="line-clamp-3 wrap-break-words text-xs">
                                {용량포장}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 align-middle tabular-nums text-zinc-300">
                              {p.purchasedOn}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 align-middle text-right tabular-nums text-zinc-200">
                              ₩{p.unitPrice.toLocaleString()}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 align-middle text-right tabular-nums font-medium text-zinc-100">
                              ₩{로트총액.toLocaleString()}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 align-middle tabular-nums text-zinc-300">
                              {b.expiresOn}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 align-middle tabular-nums text-zinc-200">
                              {b.quantity}
                              {p.unitSymbol}
                            </td>
                            <td className="px-3 py-2 align-middle">
                              {만료_뱃지를_렌더한다(days)}
                            </td>
                            <td className="px-3 py-2 align-middle text-right">
                              <button
                                type="button"
                                onClick={() => setPendingDelete(p)}
                                className={cn(rowBtnClass, "text-rose-300/90")}
                              >
                                삭제
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <table
                className="w-full min-w-240 table-fixed border-collapse border-t border-zinc-800 bg-zinc-900/95 text-left text-sm"
                aria-label="구매 로트 표 요약"
              >
                <tfoot>
                  <tr>
                    <td
                      colSpan={PURCHASE_LOT_TABLE_COL_COUNT}
                      className="px-3 py-2.5 align-middle"
                    >
                      <p className="text-xs text-zinc-300">
                        {hasFilterContext ? (
                          <>
                            표시{" "}
                            <span className="font-medium tabular-nums text-zinc-200">
                              {totalFiltered}
                            </span>
                            개 로트 · 전체{" "}
                            <span className="tabular-nums">{totalBase}</span>개
                          </>
                        ) : (
                          <>
                            총{" "}
                            <span className="font-medium tabular-nums text-zinc-200">
                              {totalFiltered}
                            </span>
                            개 로트
                          </>
                        )}
                      </p>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {viewingHouseholdId ? (
        <PurchaseRegisterModal
          key={registerKey}
          open={registerOpen}
          onOpenChange={setRegisterOpen}
          householdId={viewingHouseholdId}
          inventoryItems={inventoryItems}
          on등록한다={구매를_추가_한다}
        />
      ) : null}

      <AlertModal
        open={pendingDelete != null}
        onOpenChange={(o) => {
          if (!o) setPendingDelete(null);
        }}
        title="구매 기록 삭제"
        description={
          pendingDelete
            ? `「${pendingDelete.itemName}」(${pendingDelete.purchasedOn}) 구매와 포함된 로트를 모두 삭제합니다.`
            : undefined
        }
        confirmLabel="삭제"
        variant="danger"
        onConfirm={() => {
          if (pendingDelete) 구매를_삭제_한다(pendingDelete.id);
        }}
      />
    </section>
  );
}
