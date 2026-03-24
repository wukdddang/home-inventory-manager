import {
  resolveLedgerLocationColumns,
  type LedgerLocationColumns,
} from "@/lib/household-location";
import type {
  Household,
  InventoryLedgerRow,
  InventoryLedgerType,
} from "@/types/domain";

/* ── 상수 ── */

export const LEDGER_PAGE_SIZE = 15;
export const LEDGER_TABLE_COL_COUNT = 13;

/* ── 위치 열 ── */

export function 이력_행_위치_열을_구한다(
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

/* ── 라벨·포맷 ── */

export function 이력_유형_라벨을_구한다(type: InventoryLedgerType): string {
  const labels: Record<InventoryLedgerType, string> = {
    in: "입고",
    out: "소비",
    adjust: "수량 조정",
    waste: "폐기",
  };
  return labels[type];
}

export function 폐기_사유_라벨을_구한다(code?: string): string {
  if (!code) return "";
  if (code === "expired") return "유통기한 만료";
  if (code === "damaged") return "파손·불량";
  if (code === "other") return "기타";
  return code;
}

export function 일시_문자열을_구한다(iso: string): {
  날짜: string;
  시각: string;
} {
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

export function 행_메모_문자열을_구한다(
  row: InventoryLedgerRow,
  overrides: Record<string, string>,
): string {
  return overrides[row.id] !== undefined
    ? overrides[row.id]!
    : (row.memo ?? "");
}

export function 비고_메모_표시를_구한다(메모문자열: string): string {
  const m = 메모문자열.trim();
  return m || "—";
}

export function 폐기_사유_열_텍스트를_구한다(row: InventoryLedgerRow): string {
  if (row.type !== "waste" || !row.reason?.trim()) return "-";
  return 폐기_사유_라벨을_구한다(row.reason);
}

export function 품목_라벨을_분해한다(
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

/* ── 뱃지 클래스 ── */

const 뱃지_공통 =
  "inline-flex max-w-full items-center justify-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums leading-tight ring-1";

export function 구분_뱃지_클래스를_구한다(type: InventoryLedgerType): string {
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

export function 증감_뱃지_클래스를_구한다(delta: number): string {
  if (delta > 0) {
    return `${뱃지_공통} bg-emerald-500/15 text-emerald-300 ring-emerald-500/40`;
  }
  if (delta < 0) {
    return `${뱃지_공통} bg-rose-500/15 text-rose-300 ring-rose-500/40`;
  }
  return `${뱃지_공통} bg-zinc-800/90 text-zinc-300 ring-zinc-600`;
}

/* ── 정렬 ── */

export type SortColumn =
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

export type SortPhase =
  | { scope: "default" }
  | { scope: "column"; column: SortColumn; dir: "asc" | "desc" };

export const DEFAULT_LEDGER_SORT: { column: SortColumn; dir: "asc" | "desc" } =
  {
    column: "createdAt",
    dir: "desc",
  };

export function 열_첫_정렬_방향을_구한다(column: SortColumn): "asc" | "desc" {
  return column === "createdAt" ? "desc" : "asc";
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

export function 행_배열을_정렬한다(
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

/* ── 열 필터 ── */

export type ColumnFilterKey =
  | "householdName"
  | "roomName"
  | "placeLabel"
  | "detailLabel"
  | "category"
  | "itemName"
  | "spec"
  | "type";

export function 행_검색_텍스트를_구한다(
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

export function 행이_검색어에_일치하는가(
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

export function 행이_컬럼_필터에_일치하는가(
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

/* ── 열 필터 옵션 추출 ── */

export type ColumnFilterOptions = Record<ColumnFilterKey, string[]>;

export function 열_필터_옵션을_추출한다(
  rows: InventoryLedgerRow[],
  households: Household[],
): ColumnFilterOptions {
  const householdName = new Set<string>();
  const roomName = new Set<string>();
  const placeLabel = new Set<string>();
  const detailLabel = new Set<string>();
  const category = new Set<string>();
  const itemName = new Set<string>();
  const spec = new Set<string>();
  const type = new Set<string>();

  for (const r of rows) {
    const loc = 이력_행_위치_열을_구한다(households, r);
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
}
