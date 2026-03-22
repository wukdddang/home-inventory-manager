"use client";

import { MotionModalLayer } from "@/app/_ui/motion-modal-layer";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { InventoryRow, PurchaseBatchLot, PurchaseRecord } from "@/types/domain";
import { useId, useState } from "react";
import { 오늘_날짜_문자열을_구한다 } from "@/lib/purchase-lot-helpers";

export type PurchaseDraft = Omit<PurchaseRecord, "id">;

const inputClass =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30";

function newLot(): PurchaseBatchLot {
  return {
    id: crypto.randomUUID(),
    quantity: 1,
    expiresOn: 오늘_날짜_문자열을_구한다(),
  };
}

export function PurchaseRegisterModal({
  open,
  onOpenChange,
  householdId,
  inventoryItems,
  on등록한다,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  householdId: string;
  inventoryItems: InventoryRow[];
  on등록한다: (draft: PurchaseDraft) => void;
}) {
  const titleId = `purchase-reg-${useId().replace(/:/g, "")}`;
  const [inventoryPick, setInventoryPick] = useState("");
  const [itemName, setItemName] = useState("");
  const [unitSymbol, setUnitSymbol] = useState("개");
  const [variantCaption, setVariantCaption] = useState("");
  const [productId, setProductId] = useState<string | undefined>();
  const [productVariantId, setProductVariantId] = useState<string | undefined>();
  const [inventoryItemId, setInventoryItemId] = useState<string | undefined>();
  const [purchasedOn, setPurchasedOn] = useState(() =>
    오늘_날짜_문자열을_구한다(),
  );
  const [supplierName, setSupplierName] = useState("");
  const [unitPriceStr, setUnitPriceStr] = useState("");
  const [totalPriceStr, setTotalPriceStr] = useState("");
  const [batches, setBatches] = useState<PurchaseBatchLot[]>(() => [newLot()]);

  const handleInventoryChange = (value: string) => {
    setInventoryPick(value);
    if (!value) {
      setInventoryItemId(undefined);
      setProductId(undefined);
      setProductVariantId(undefined);
      return;
    }
    const row = inventoryItems.find((i) => i.id === value);
    if (!row) return;
    setInventoryItemId(row.id);
    setItemName(row.name);
    setUnitSymbol(row.unit);
    setVariantCaption(row.variantCaption ?? "");
    setProductId(row.productId);
    setProductVariantId(row.productVariantId);
  };

  const handleAddLot = () => {
    setBatches((prev) => [...prev, newLot()]);
  };

  const handleRemoveLot = (id: string) => {
    setBatches((prev) => (prev.length <= 1 ? prev : prev.filter((b) => b.id !== id)));
  };

  const handleLotChange = (
    id: string,
    patch: Partial<Pick<PurchaseBatchLot, "quantity" | "expiresOn">>,
  ) => {
    setBatches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    );
  };

  const handleSubmit = () => {
    const name = itemName.trim();
    if (!name) {
      toast({ title: "품목 이름을 입력하세요", variant: "warning" });
      return;
    }
    const unit = unitSymbol.trim() || "개";
    const up = Number.parseFloat(unitPriceStr.replace(/,/g, ""));
    const tp = Number.parseFloat(totalPriceStr.replace(/,/g, ""));
    if (!Number.isFinite(up) || up < 0) {
      toast({ title: "단가를 올바르게 입력하세요", variant: "warning" });
      return;
    }
    if (!Number.isFinite(tp) || tp < 0) {
      toast({ title: "총액을 올바르게 입력하세요", variant: "warning" });
      return;
    }
    if (!purchasedOn.trim()) {
      toast({ title: "구매일을 선택하세요", variant: "warning" });
      return;
    }
    const normalized: PurchaseBatchLot[] = [];
    for (const b of batches) {
      const q = Math.floor(Number(b.quantity));
      if (!Number.isFinite(q) || q < 1) {
        toast({ title: "각 로트 수량은 1 이상이어야 합니다", variant: "warning" });
        return;
      }
      if (!b.expiresOn?.trim()) {
        toast({ title: "유통기한을 입력하세요", variant: "warning" });
        return;
      }
      normalized.push({ ...b, quantity: q, expiresOn: b.expiresOn.trim() });
    }
    const draft: PurchaseDraft = {
      householdId,
      inventoryItemId,
      productId,
      productVariantId,
      itemName: name,
      variantCaption: variantCaption.trim() || undefined,
      unitSymbol: unit,
      purchasedOn: purchasedOn.trim(),
      unitPrice: up,
      totalPrice: tp,
      supplierName: supplierName.trim() || undefined,
      batches: normalized,
    };
    on등록한다(draft);
    toast({
      title: "구매를 등록했습니다",
      description: `${name} · 로트 ${normalized.length}건`,
    });
    onOpenChange(false);
  };

  const sumQty = batches.reduce((s, b) => s + (Number.isFinite(b.quantity) ? b.quantity : 0), 0);

  return (
    <MotionModalLayer
      open={open}
      onOpenChange={onOpenChange}
      closeOnOverlayClick
      panelClassName="fixed left-1/2 top-1/2 z-10041 max-h-[min(100dvh-2rem,42rem)] w-[min(100vw-2rem,34rem)] -translate-x-1/2 -translate-y-1/2 outline-none"
      ariaLabelledBy={titleId}
    >
      <div className="flex max-h-[min(100dvh-2rem,42rem)] flex-col rounded-2xl border border-zinc-700 bg-zinc-900 shadow-xl">
        <div className="shrink-0 border-b border-zinc-800 p-5 pb-4">
          <h2 id={titleId} className="text-lg font-semibold text-white">
            구매·유통기한 로트 등록
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            한 번의 구매에 여러 유통기한 로트를 나누어 넣을 수 있습니다.{" "}
            <span className="text-zinc-500">
              장보기 직후·정리 전에는 재고 연결 없이 적어 두었다가, 나중에 메인에서
              물품을 만들고 연결해도 됩니다.
            </span>{" "}
            데이터는 브라우저 `him-purchases`에 저장됩니다.
          </p>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-y-contain px-5 py-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-400">재고에서 선택 (선택)</span>
            <select
              value={inventoryPick}
              onChange={(e) => handleInventoryChange(e.target.value)}
              className={cn(inputClass, "cursor-pointer")}
            >
              <option value="">직접 입력</option>
              {inventoryItems.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                  {i.variantCaption ? ` (${i.variantCaption})` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-400">품목 이름</span>
            <input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className={inputClass}
              placeholder="예: 우유 1L"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-400">수량 단위</span>
              <input
                value={unitSymbol}
                onChange={(e) => setUnitSymbol(e.target.value)}
                className={inputClass}
                placeholder="팩, 개, ml…"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-400">용량·포장 메모</span>
              <input
                value={variantCaption}
                onChange={(e) => setVariantCaption(e.target.value)}
                className={inputClass}
                placeholder="선택"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-400">구매일</span>
              <input
                type="date"
                value={purchasedOn}
                onChange={(e) => setPurchasedOn(e.target.value)}
                className={cn(inputClass, "cursor-pointer")}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-400">구매처 (선택)</span>
              <input
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className={inputClass}
                placeholder="마트 이름 등"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-400">단가</span>
              <input
                inputMode="decimal"
                value={unitPriceStr}
                onChange={(e) => setUnitPriceStr(e.target.value)}
                className={inputClass}
                placeholder="0"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-400">총액</span>
              <input
                inputMode="decimal"
                value={totalPriceStr}
                onChange={(e) => setTotalPriceStr(e.target.value)}
                className={inputClass}
                placeholder="0"
              />
            </label>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-zinc-200">유통기한 로트</p>
              <button
                type="button"
                onClick={handleAddLot}
                className="cursor-pointer rounded-lg border border-zinc-600 px-2.5 py-1 text-xs font-medium text-teal-300 hover:bg-zinc-800"
              >
                로트 추가
              </button>
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">
              로트 수량 합계: <span className="text-zinc-300">{sumQty}</span>
              {unitSymbol ? ` ${unitSymbol}` : ""}
            </p>
            <ul className="mt-3 space-y-3">
              {batches.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-wrap items-end gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/80 p-2"
                >
                  <label className="min-w-[5rem] flex-1 space-y-1">
                    <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                      수량
                    </span>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={b.quantity}
                      onChange={(e) =>
                        handleLotChange(b.id, {
                          quantity: Number.parseInt(e.target.value, 10),
                        })
                      }
                      className={inputClass}
                    />
                  </label>
                  <label className="min-w-[9rem] flex-[2] space-y-1">
                    <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                      유통기한
                    </span>
                    <input
                      type="date"
                      value={b.expiresOn}
                      onChange={(e) =>
                        handleLotChange(b.id, { expiresOn: e.target.value })
                      }
                      className={cn(inputClass, "cursor-pointer")}
                    />
                  </label>
                  <button
                    type="button"
                    disabled={batches.length <= 1}
                    onClick={() => handleRemoveLot(b.id)}
                    className="cursor-pointer rounded-lg border border-zinc-600 px-2 py-2 text-xs text-zinc-400 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-zinc-800 p-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer rounded-xl border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="cursor-pointer rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400"
          >
            등록
          </button>
        </div>
      </div>
    </MotionModalLayer>
  );
}
