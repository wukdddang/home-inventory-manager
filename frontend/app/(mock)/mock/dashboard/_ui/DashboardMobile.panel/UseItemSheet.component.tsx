"use client";

import { BottomSheet } from "@/app/_ui/mobile/BottomSheet.component";
import { QuantityStepper } from "@/app/_ui/mobile/QuantityStepper.component";
import { useDashboard } from "../../_hooks/useDashboard";
import type { InventoryRow } from "@/types/domain";
import { useState, useEffect } from "react";

type UseItemSheetProps = {
  item: InventoryRow | null;
  householdId: string;
  onClose: () => void;
};

export function UseItemSheet({ item, householdId, onClose }: UseItemSheetProps) {
  const { 재고_소비를_기록_한다 } = useDashboard();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (item) setQuantity(1);
  }, [item]);

  const handleConfirm = () => {
    if (!item) return;
    재고_소비를_기록_한다(householdId, item.id, quantity, "모바일 사용 처리");
    onClose();
  };

  return (
    <BottomSheet open={item !== null} onClose={onClose} title="사용 처리">
      {item && (
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-sm font-medium text-zinc-100">
              {item.name}
              {item.variantCaption && (
                <span className="ml-1.5 text-zinc-500">
                  {item.variantCaption}
                </span>
              )}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              현재 재고: {item.quantity}{item.unit}
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-zinc-500">사용 수량</span>
            <QuantityStepper
              value={quantity}
              min={1}
              max={item.quantity}
              onChange={setQuantity}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 cursor-pointer rounded-xl border border-zinc-700 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 cursor-pointer rounded-xl bg-teal-600 py-3 text-sm font-medium text-white transition-colors hover:bg-teal-500"
            >
              사용 확인
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
