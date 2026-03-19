"use client";

import type { Household } from "@/types/domain";

type ItemsSpreadsheetProps = {
  household: Household;
  onDeleteItem: (itemId: string) => void;
};

export function ItemsSpreadsheet({
  household,
  onDeleteItem,
}: ItemsSpreadsheetProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-950 text-xs uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-3 font-medium">품목명</th>
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
                colSpan={5}
                className="px-3 py-10 text-center text-zinc-500"
              >
                물품이 없습니다. 아래 폼에서 등록하세요.
              </td>
            </tr>
          ) : (
            household.items.map((it) => {
              const room = household.rooms.find((r) => r.id === it.roomId);
              return (
                <tr
                  key={it.id}
                  className="border-b border-zinc-800/80 hover:bg-zinc-900/50"
                >
                  <td className="px-3 py-2.5 text-zinc-200">{it.name}</td>
                  <td className="px-3 py-2.5 text-zinc-400">{it.quantity}</td>
                  <td className="px-3 py-2.5 text-zinc-400">{it.unit}</td>
                  <td className="px-3 py-2.5 text-zinc-400">
                    {room?.name ?? "(삭제된 방)"}
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => onDeleteItem(it.id)}
                      className="text-xs text-rose-400 hover:underline"
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
  );
}
