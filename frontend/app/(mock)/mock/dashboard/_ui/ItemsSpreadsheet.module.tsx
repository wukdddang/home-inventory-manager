"use client";

import { AlertModal } from "@/app/_ui/alert-modal";
import { resolveInventoryRowColumns } from "@/lib/product-catalog-defaults";
import { useState } from "react";
import type { Household } from "@/types/domain";

type ItemsSpreadsheetProps = {
  household: Household;
  onDeleteItem: (itemId: string) => void;
  /** 표에서 방 셀 클릭 시 조회 영역의 선택 방·등록 위젯과 동기 */
  onSelectRoomId?: (roomId: string) => void;
};

export function ItemsSpreadsheet({
  household,
  onDeleteItem,
  onSelectRoomId,
}: ItemsSpreadsheetProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const pendingItem = pendingDeleteId
    ? household.items.find((i) => i.id === pendingDeleteId)
    : null;

  const catalog = household.catalog;

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full min-w-160 border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950 text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-3 py-3 font-medium">카테고리</th>
              <th className="px-3 py-3 font-medium">품목</th>
              <th className="px-3 py-3 font-medium">용량·포장</th>
              <th className="px-3 py-3 font-medium">수량</th>
              <th className="px-3 py-3 font-medium">단위</th>
              <th className="px-3 py-3 font-medium">방</th>
              <th className="w-24 px-3 py-3 font-medium">작업</th>
            </tr>
          </thead>
          <tbody>
            {household.items.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-10 text-center text-zinc-500"
                >
                  물품이 없습니다. 방을 선택한 뒤 아래에서 등록하세요.
                </td>
              </tr>
            ) : (
              household.items.map((it) => {
                const room = household.rooms.find((r) => r.id === it.roomId);
                const cols = catalog
                  ? resolveInventoryRowColumns(catalog, it)
                  : {
                      category: "—",
                      product: "—",
                      spec: it.name,
                    };
                return (
                  <tr
                    key={it.id}
                    className="border-b border-zinc-800/80 hover:bg-zinc-900/50"
                  >
                    <td className="px-3 py-2.5 text-zinc-300">{cols.category}</td>
                    <td className="px-3 py-2.5 text-zinc-200">{cols.product}</td>
                    <td className="px-3 py-2.5 text-zinc-400">{cols.spec}</td>
                    <td className="px-3 py-2.5 text-zinc-400">{it.quantity}</td>
                    <td className="px-3 py-2.5 text-zinc-400">{it.unit}</td>
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
