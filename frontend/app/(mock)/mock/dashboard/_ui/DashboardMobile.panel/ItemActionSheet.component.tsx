"use client";

import { BottomSheet } from "@/app/_ui/mobile/BottomSheet.component";
import type { InventoryRow } from "@/types/domain";
import { PackagePlus, UtensilsCrossed, Trash2 } from "lucide-react";

type ItemActionSheetProps = {
  item: InventoryRow | null;
  onClose: () => void;
  onUse: (item: InventoryRow) => void;
  onWaste: (item: InventoryRow) => void;
  onRestock: (item: InventoryRow) => void;
};

export function ItemActionSheet({
  item,
  onClose,
  onUse,
  onWaste,
  onRestock,
}: ItemActionSheetProps) {
  if (!item)
    return (
      <BottomSheet open={false} onClose={onClose}>
        {null}
      </BottomSheet>
    );

  const isLowStock =
    item.minStockLevel != null && item.quantity <= item.minStockLevel;

  const handleAction = (action: (item: InventoryRow) => void) => {
    onClose();
    // 액션 시트 닫힌 뒤 다음 시트 열기 (애니메이션 충돌 방지)
    setTimeout(() => action(item), 200);
  };

  return (
    <BottomSheet open={item !== null} onClose={onClose}>
      <div className="flex flex-col gap-4">
        {/* 아이템 정보 */}
        <div className="flex flex-col gap-1 px-1">
          <p className="text-base font-semibold text-zinc-100">
            {item.name}
            {item.variantCaption && (
              <span className="ml-1.5 font-normal text-zinc-500">
                {item.variantCaption}
              </span>
            )}
          </p>
          <p className="text-sm text-zinc-400">
            현재 {item.quantity}
            {item.unit} 보유
            {isLowStock && (
              <span className="ml-1.5 text-blue-400">
                (적정 {item.minStockLevel}
                {item.unit})
              </span>
            )}
          </p>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => handleAction(onRestock)}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 transition-colors active:bg-zinc-800"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/15">
              <PackagePlus className="size-5 text-blue-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-zinc-100">보충</p>
              <p className="text-xs text-zinc-500">재고를 추가합니다</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAction(onUse)}
            disabled={item.quantity <= 0}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 transition-colors active:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-teal-500/15">
              <UtensilsCrossed className="size-5 text-teal-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-zinc-100">사용</p>
              <p className="text-xs text-zinc-500">소비한 수량을 차감합니다</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAction(onWaste)}
            disabled={item.quantity <= 0}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 transition-colors active:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-rose-500/15">
              <Trash2 className="size-5 text-rose-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-zinc-100">폐기</p>
              <p className="text-xs text-zinc-500">만료·손상된 재고를 처리합니다</p>
            </div>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
