"use client";

import { MotionModalLayer } from "@/app/_ui/motion-modal-layer";
import type { InventoryRow } from "@/types/domain";
import { useId, useState } from "react";

const inputClass =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30";

export type InventoryConsumeWasteMode = "consume" | "waste";

export function InventoryConsumeWasteModal({
  open,
  onOpenChange,
  mode,
  item,
  maxQuantity,
  on확인한다,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: InventoryConsumeWasteMode;
  item: InventoryRow | null;
  maxQuantity: number;
  on확인한다: (quantity: number, memo: string, wasteReason?: string) => void;
}) {
  const titleId = `inv-cw-${useId().replace(/:/g, "")}`;
  const [qtyStr, setQtyStr] = useState("1");
  const [memo, setMemo] = useState("");
  const [wasteReason, setWasteReason] = useState<
    "expired" | "damaged" | "other"
  >("expired");

  const title =
    mode === "consume" ? "물품 소비(사용)" : "물품 폐기";
  const submitLabel = mode === "consume" ? "소비 기록" : "폐기 기록";

  const handleSubmit = () => {
    const q = Math.floor(Number.parseInt(qtyStr, 10));
    if (!Number.isFinite(q) || q < 1) return;
    if (q > maxQuantity) return;
    const m = memo.trim();
    if (mode === "waste") {
      on확인한다(q, m, wasteReason);
    } else {
      on확인한다(q, m);
    }
    onOpenChange(false);
  };

  return (
    <MotionModalLayer
      open={open}
      onOpenChange={onOpenChange}
      closeOnOverlayClick
      panelClassName="fixed left-1/2 top-1/2 z-10041 w-[min(100vw-2rem,22rem)] -translate-x-1/2 -translate-y-1/2 outline-none"
      ariaLabelledBy={titleId}
    >
      <div className="flex flex-col rounded-2xl border border-zinc-700 bg-zinc-900 shadow-xl">
        <div className="border-b border-zinc-800 p-5 pb-3">
          <h2 id={titleId} className="text-lg font-semibold text-white">
            {title}
          </h2>
          {item ? (
            <p className="mt-2 text-sm text-zinc-300">
              <span className="text-zinc-200">{item.name}</span>
              <span className="ml-2 tabular-nums text-zinc-300">
                (보유 {maxQuantity}
                {item.unit})
              </span>
            </p>
          ) : null}
        </div>
        <div className="space-y-4 px-5 py-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-300">수량</span>
            <input
              type="number"
              min={1}
              max={maxQuantity}
              value={qtyStr}
              onChange={(e) => setQtyStr(e.target.value)}
              className={inputClass}
            />
          </label>
          {mode === "waste" ? (
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-300">사유</span>
              <select
                value={wasteReason}
                onChange={(e) =>
                  setWasteReason(e.target.value as typeof wasteReason)
                }
                className={`${inputClass} cursor-pointer`}
              >
                <option value="expired">유통기한 만료</option>
                <option value="damaged">파손·불량</option>
                <option value="other">기타</option>
              </select>
            </label>
          ) : null}
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-300">메모 (선택)</span>
            <input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className={inputClass}
              placeholder="예: 간식으로 사용"
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-800 p-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer rounded-xl border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              !item ||
              maxQuantity < 1 ||
              !Number.isFinite(Math.floor(Number.parseInt(qtyStr, 10))) ||
              Math.floor(Number.parseInt(qtyStr, 10)) < 1 ||
              Math.floor(Number.parseInt(qtyStr, 10)) > maxQuantity
            }
            className="cursor-pointer rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400 disabled:pointer-events-none disabled:opacity-40"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </MotionModalLayer>
  );
}
