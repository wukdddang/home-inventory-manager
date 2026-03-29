"use client";

import { BottomSheet } from "@/app/_ui/mobile/BottomSheet.component";
import { QuantityStepper } from "@/app/_ui/mobile/QuantityStepper.component";
import { useDashboard } from "../../_hooks/useDashboard";
import type { InventoryRow } from "@/types/domain";
import { useState, useEffect } from "react";

const WASTE_REASONS = [
  { code: "expired", label: "유통기한 만료" },
  { code: "quality", label: "품질 저하" },
  { code: "other", label: "기타" },
] as const;

type WasteItemSheetProps = {
  item: InventoryRow | null;
  householdId: string;
  onClose: () => void;
};

export function WasteItemSheet({
  item,
  householdId,
  onClose,
}: WasteItemSheetProps) {
  const { 재고_폐기를_기록_한다 } = useDashboard();
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState<string>("expired");

  useEffect(() => {
    if (item) {
      setQuantity(1);
      setReason("expired");
    }
  }, [item]);

  const handleConfirm = () => {
    if (!item) return;
    재고_폐기를_기록_한다(
      householdId,
      item.id,
      quantity,
      reason,
      "모바일 폐기 처리",
    );
    onClose();
  };

  return (
    <BottomSheet open={item !== null} onClose={onClose} title="폐기 처리">
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
            <span className="text-xs text-zinc-500">폐기 수량</span>
            <QuantityStepper
              value={quantity}
              min={1}
              max={item.quantity}
              onChange={setQuantity}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs text-zinc-500">폐기 사유</span>
            {WASTE_REASONS.map((r) => (
              <label
                key={r.code}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-zinc-800"
              >
                <div
                  className={`flex size-5 items-center justify-center rounded-full border-2 ${
                    reason === r.code
                      ? "border-teal-500 bg-teal-500"
                      : "border-zinc-600"
                  }`}
                >
                  {reason === r.code && (
                    <div className="size-2 rounded-full bg-white" />
                  )}
                </div>
                <span className="text-sm text-zinc-200">{r.label}</span>
              </label>
            ))}
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
              className="flex-1 cursor-pointer rounded-xl bg-rose-600 py-3 text-sm font-medium text-white transition-colors hover:bg-rose-500"
            >
              폐기 확인
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
