"use client";

import { AlertModal } from "@/app/_ui/alert-modal";
import { InventoryLotExpiryBadge } from "@/app/_ui/inventory-lot-expiry-badge";
import { formatLocationBreadcrumb } from "@/lib/household-location";
import { 구매목록에서_품목_로트_요약을_구한다 } from "@/lib/inventory-lot-from-purchases";
import { resolveInventoryRowColumns } from "@/lib/product-catalog-defaults";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import type {
  Household,
  InventoryRow,
  ProductCatalog,
  PurchaseRecord,
} from "@/types/domain";

type ItemsSpreadsheetProps = {
  household: Household;
  catalog: ProductCatalog;
  purchases: PurchaseRecord[];
  onDeleteItem: (itemId: string) => void;
  on소비하려고_연다: (item: InventoryRow) => void;
  on폐기하려고_연다: (item: InventoryRow) => void;
  /** 표에서 방 셀 클릭 시 조회 영역의 선택 방·등록 위젯과 동기 */
  onSelectRoomId?: (roomId: string) => void;
};

/** 정렬 가능 컬럼 (로트·액션 열 제외) */
type SortKey =
  | "category"
  | "product"
  | "spec"
  | "quantity"
  | "unit"
  | "room"
  | "location";

type SortState = { key: SortKey | null; dir: "asc" | "desc" };

function getSortComparable(
  key: SortKey,
  it: InventoryRow,
  household: Household,
  catalog: ProductCatalog,
): string | number {
  const room = household.rooms.find((r) => r.id === it.roomId);
  const cols = resolveInventoryRowColumns(catalog, it);
  switch (key) {
    case "category":
      return cols.category;
    case "product":
      return cols.product;
    case "spec":
      return cols.spec;
    case "quantity":
      return it.quantity;
    case "unit":
      return it.unit;
    case "room":
      return room?.name ?? "(삭제된 방)";
    case "location":
      return formatLocationBreadcrumb(household, it);
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

function compareForSort(
  key: SortKey,
  a: InventoryRow,
  b: InventoryRow,
  household: Household,
  catalog: ProductCatalog,
): number {
  const va = getSortComparable(key, a, household, catalog);
  const vb = getSortComparable(key, b, household, catalog);
  if (key === "quantity") {
    const n = (va as number) - (vb as number);
    if (n !== 0) return n;
  } else {
    const s = String(va).localeCompare(String(vb), "ko");
    if (s !== 0) return s;
  }
  return a.id.localeCompare(b.id);
}

type SortableThProps = {
  label: string;
  column: SortKey;
  sort: SortState;
  onCycleSort: (column: SortKey) => void;
  className?: string;
};

function SortableTh({
  label,
  column,
  sort,
  onCycleSort,
  className,
}: SortableThProps) {
  const active = sort.key === column;
  const ariaSort = active
    ? sort.dir === "asc"
      ? "ascending"
      : "descending"
    : "none";

  return (
    <th
      className={cn(
        "px-3 py-2 align-top text-xs font-medium uppercase tracking-wider text-zinc-500",
        className,
      )}
      aria-sort={ariaSort}
    >
      <button
        type="button"
        className="flex w-full min-w-0 cursor-pointer items-center gap-1 text-left hover:text-zinc-300"
        onClick={() => onCycleSort(column)}
        aria-label={
          active
            ? `${label}, ${sort.dir === "asc" ? "오름차순" : "내림차순"} 정렬됨. 클릭하여 변경`
            : `${label} 기준으로 정렬`
        }
      >
        <span className="min-w-0 truncate">{label}</span>
        <span
          className={cn(
            "shrink-0 font-normal tabular-nums",
            active ? "text-teal-400" : "text-zinc-600",
          )}
          aria-hidden
        >
          {active ? (sort.dir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </th>
  );
}

export function ItemsSpreadsheet({
  household,
  catalog,
  purchases,
  onDeleteItem,
  on소비하려고_연다,
  on폐기하려고_연다,
  onSelectRoomId,
}: ItemsSpreadsheetProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState>({ key: null, dir: "asc" });

  const cycleSort = (column: SortKey) => {
    setSort((prev) => {
      if (prev.key !== column) return { key: column, dir: "asc" };
      if (prev.dir === "asc") return { key: column, dir: "desc" };
      return { key: null, dir: "asc" };
    });
  };

  const sortedItems = useMemo(() => {
    const items = household.items.slice();
    if (!sort.key) return items;
    const k = sort.key;
    const dir = sort.dir;
    items.sort((a, b) => {
      const c = compareForSort(k, a, b, household, catalog);
      return dir === "asc" ? c : -c;
    });
    return items;
  }, [household, catalog, sort.key, sort.dir]);

  const pendingItem = pendingDeleteId
    ? household.items.find((i) => i.id === pendingDeleteId)
    : null;

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full min-w-6xl border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950 text-xs tracking-wider">
              <SortableTh
                label="카테고리"
                column="category"
                sort={sort}
                onCycleSort={cycleSort}
              />
              <SortableTh
                label="품목"
                column="product"
                sort={sort}
                onCycleSort={cycleSort}
              />
              <SortableTh
                label="용량·포장"
                column="spec"
                sort={sort}
                onCycleSort={cycleSort}
              />
              <SortableTh
                label="수량"
                column="quantity"
                sort={sort}
                onCycleSort={cycleSort}
              />
              <SortableTh
                label="단위"
                column="unit"
                sort={sort}
                onCycleSort={cycleSort}
              />
              <th className="min-w-32 px-3 py-3 align-top text-xs font-medium uppercase tracking-wider text-zinc-500">
                로트·임박
              </th>
              <SortableTh
                label="방"
                column="room"
                sort={sort}
                onCycleSort={cycleSort}
              />
              <SortableTh
                label="보관 위치"
                column="location"
                sort={sort}
                onCycleSort={cycleSort}
                className="min-w-44"
              />
              <th className="min-w-36 px-3 py-3 align-top text-xs font-medium uppercase tracking-wider text-zinc-500">
                소비·폐기
              </th>
              <th className="w-20 px-3 py-3 align-top text-xs font-medium uppercase tracking-wider text-zinc-500">
                삭제
              </th>
            </tr>
          </thead>
          <tbody>
            {household.items.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-3 py-10 text-center text-zinc-500"
                >
                  물품이 없습니다. 방을 선택한 뒤 아래에서 등록하세요.
                </td>
              </tr>
            ) : (
              sortedItems.map((it) => {
                const room = household.rooms.find((r) => r.id === it.roomId);
                const cols = resolveInventoryRowColumns(catalog, it);
                const lot = 구매목록에서_품목_로트_요약을_구한다(
                  purchases,
                  household.id,
                  it.id,
                );
                return (
                  <tr
                    key={it.id}
                    className="border-b border-zinc-800/80 hover:bg-zinc-900/50"
                  >
                    <td className="px-3 py-2.5 text-zinc-300">
                      {cols.category}
                    </td>
                    <td className="px-3 py-2.5 text-zinc-200">
                      {cols.product}
                    </td>
                    <td className="px-3 py-2.5 text-zinc-400">{cols.spec}</td>
                    <td className="px-3 py-2.5 text-zinc-400">{it.quantity}</td>
                    <td className="px-3 py-2.5 text-zinc-400">{it.unit}</td>
                    <td className="px-3 py-2.5 align-middle">
                      <InventoryLotExpiryBadge
                        worstExpiryDays={lot.worstExpiryDays}
                        lotCount={lot.lotCount}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-zinc-400">
                      {room && onSelectRoomId ? (
                        <button
                          type="button"
                          onClick={() => onSelectRoomId(room.id)}
                          className="cursor-pointer text-left text-teal-400/90 underline-offset-2 hover:underline"
                        >
                          {room.name}
                        </button>
                      ) : (
                        (room?.name ?? "(삭제된 방)")
                      )}
                    </td>
                    <td className="max-w-56 px-3 py-2.5 text-xs leading-snug text-zinc-500">
                      {formatLocationBreadcrumb(household, it)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          disabled={it.quantity < 1}
                          onClick={() => on소비하려고_연다(it)}
                          className="cursor-pointer rounded border border-zinc-600 px-1.5 py-0.5 text-[10px] text-teal-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          소비
                        </button>
                        <button
                          type="button"
                          disabled={it.quantity < 1}
                          onClick={() => on폐기하려고_연다(it)}
                          className="cursor-pointer rounded border border-zinc-600 px-1.5 py-0.5 text-[10px] text-rose-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          폐기
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(it.id)}
                        className="cursor-pointer text-xs text-rose-400 hover:underline"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <AlertModal
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
        title="물품 삭제"
        description={
          pendingItem
            ? `삭제하시겠습니까? 「${pendingItem.name}」을(를) 목록에서 제거합니다.`
            : "삭제하시겠습니까?"
        }
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="danger"
        onConfirm={() => {
          if (pendingDeleteId) onDeleteItem(pendingDeleteId);
          setPendingDeleteId(null);
        }}
      />
    </>
  );
}
