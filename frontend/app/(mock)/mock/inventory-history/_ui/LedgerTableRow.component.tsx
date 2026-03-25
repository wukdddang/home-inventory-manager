"use client";

import type { Household, InventoryLedgerRow } from "@/types/domain";
import {
  구분_뱃지_클래스를_구한다,
  비고_메모_표시를_구한다,
  이력_유형_라벨을_구한다,
  이력_행_위치_열을_구한다,
  일시_문자열을_구한다,
  증감_뱃지_클래스를_구한다,
  품목_라벨을_분해한다,
  폐기_사유_열_텍스트를_구한다,
} from "../_lib/inventory-history-helpers";

export function LedgerTableRow({
  row,
  households,
  zebra,
  memoValue,
  onEditMemo,
  productImageUrl,
}: {
  row: InventoryLedgerRow;
  households: Household[];
  zebra: boolean;
  memoValue: string;
  onEditMemo: () => void;
  productImageUrl?: string;
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
        <span className="block text-sm">{날짜}</span>
        {시각 ? (
          <span className="block text-xs text-zinc-300">{시각}</span>
        ) : null}
      </td>
      <td className="w-[8%] min-w-20 px-3 py-2 align-middle">
        <span className="line-clamp-2 wrap-break-words text-xs text-zinc-300">
          {loc.householdName}
        </span>
      </td>
      <td className="w-[7%] min-w-16 px-3 py-2 align-middle">
        <span className="line-clamp-2 wrap-break-words text-xs text-zinc-300">
          {loc.roomName}
        </span>
      </td>
      <td className="w-[8%] min-w-20 px-3 py-2 align-middle">
        <span className="line-clamp-2 wrap-break-words text-xs text-zinc-300">
          {loc.placeLabel}
        </span>
      </td>
      <td className="w-[8%] min-w-20 px-3 py-2 align-middle">
        <span className="line-clamp-2 wrap-break-words text-xs text-zinc-300">
          {loc.detailLabel}
        </span>
      </td>
      <td className="w-[8%] px-3 py-2 align-middle text-zinc-300">
        <span className="line-clamp-2 wrap-break-words">{분류}</span>
      </td>
      <td className="w-[9%] px-3 py-2 align-middle font-medium text-zinc-100">
        <div className="flex items-center gap-1.5">
          {productImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={productImageUrl} alt="" className="size-5 shrink-0 rounded border border-zinc-700 object-cover" />
          ) : null}
          <span className="line-clamp-2 wrap-break-words">{이름}</span>
        </div>
      </td>
      <td className="w-[7%] px-3 py-2 align-middle tabular-nums text-zinc-300">
        <span className="line-clamp-2 wrap-break-words">{규격}</span>
      </td>
      <td className="w-[5%] px-3 py-2 align-middle">
        <span className={구분_뱃지_클래스를_구한다(row.type)}>
          {이력_유형_라벨을_구한다(row.type)}
        </span>
      </td>
      <td className="w-[8%] px-3 py-2 align-middle text-xs text-zinc-300">
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
          className="block w-full min-w-0 max-w-[min(28rem,48vw)] cursor-pointer truncate border-0 bg-transparent p-0 text-left font-inherit text-xs text-zinc-300 underline-offset-2 transition-colors hover:text-zinc-300 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/45"
          aria-label={`비고 편집: ${row.itemLabel ?? row.inventoryItemId}`}
        >
          {비고_메모_표시를_구한다(memoValue)}
        </button>
      </td>
    </tr>
  );
}
