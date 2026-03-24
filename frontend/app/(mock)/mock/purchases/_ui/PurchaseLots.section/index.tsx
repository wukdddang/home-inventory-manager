"use client";

import { AlertModal } from "@/app/_ui/alert-modal";
import { useAppRoutePrefix } from "@/lib/use-app-route-prefix";
import { cn } from "@/lib/utils";
import type { PurchaseRecord } from "@/types/domain";
import Link from "next/link";
import { useMemo, useState } from "react";
import { usePurchases } from "../../_hooks/usePurchases";
import {
  오늘_날짜_문자열을_구한다,
  유통기한까지_일수를_구한다,
} from "@/lib/purchase-lot-helpers";
import { PurchaseRegisterModal } from "./PurchaseRegister.module";

/** 재고 이력 표와 동일 — `식료품 › 라면 › 1봉` 형태를 분류·이름·규격으로 나눈다 */
function 품목_라벨을_분해한다(
  itemLabel: string | undefined,
  fallbackId: string,
): { 분류: string; 이름: string; 규격: string } {
  const raw = (itemLabel ?? "").trim();
  if (!raw) {
    return { 분류: "—", 이름: fallbackId, 규격: "—" };
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

function 구매_용량포장_텍스트를_구한다(p: PurchaseRecord): string {
  const { 규격 } = 품목_라벨을_분해한다(
    p.itemName,
    p.inventoryItemId ?? p.id,
  );
  const cap = p.variantCaption?.trim();
  if (규격 !== "—" && cap) return `${규격} · ${cap}`;
  if (규격 !== "—") return 규격;
  if (cap) return cap;
  return "—";
}

function 만료_뱃지를_렌더한다(days: number | null) {
  if (days === null) {
    return (
      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300">
        날짜 확인
      </span>
    );
  }
  if (days < 0) {
    return (
      <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[11px] font-medium text-rose-200 ring-1 ring-rose-500/40">
        만료 후 {Math.abs(days)}일
      </span>
    );
  }
  if (days === 0) {
    return (
      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-100 ring-1 ring-amber-500/35">
        오늘 만료
      </span>
    );
  }
  if (days <= 3) {
    return (
      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-100 ring-1 ring-amber-500/30">
        D-{days}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300">
      D-{days}
    </span>
  );
}

const rowBtnClass =
  "cursor-pointer rounded-lg border border-zinc-600 px-2.5 py-1 text-xs text-zinc-200 hover:bg-zinc-800";

export function PurchaseLotsSection() {
  const prefix = useAppRoutePrefix();
  const {
    households,
    purchases,
    거점_목록을_새로_고친다,
    구매를_추가_한다,
    구매를_삭제_한다,
  } = usePurchases();

  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(
    null,
  );
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerKey, setRegisterKey] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<PurchaseRecord | null>(
    null,
  );

  const viewingHouseholdId = useMemo(() => {
    if (households.length === 0) return null;
    if (
      selectedHouseholdId != null &&
      households.some((h) => h.id === selectedHouseholdId)
    ) {
      return selectedHouseholdId;
    }
    return households[0]?.id ?? null;
  }, [households, selectedHouseholdId]);

  const selected = useMemo(
    () => households.find((h) => h.id === viewingHouseholdId) ?? null,
    [households, viewingHouseholdId],
  );

  const filteredPurchases = useMemo(
    () =>
      viewingHouseholdId
        ? purchases.filter((p) => p.householdId === viewingHouseholdId)
        : [],
    [purchases, viewingHouseholdId],
  );

  /** 로트마다 한 행 — 재고 이력 표처럼 유통기한별로 행을 나눈다 */
  const purchaseTableRows = useMemo(() => {
    const flat = filteredPurchases.flatMap((p) =>
      p.batches.map((b, bi) => ({
        purchase: p,
        batch: b,
        batchIndex: bi,
        batchCount: p.batches.length,
      })),
    );
    return flat.map((row, globalIdx) => ({
      ...row,
      zebra: globalIdx % 2 === 1,
    }));
  }, [filteredPurchases]);

  const inventoryItems = selected?.items ?? [];

  if (households.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-center">
        <p className="text-sm text-zinc-300">
          등록된 거점이 없습니다. 메인에서 거점을 만든 뒤 구매·로트를
          추가하세요.
        </p>
        <Link
          href={`${prefix}/dashboard`}
          className="mt-4 inline-block cursor-pointer rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400"
        >
          메인(대시보드)으로
        </Link>
      </div>
    );
  }

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <h2 className="text-lg font-semibold text-white">구매·유통기한 로트</h2>
          <p className="text-sm text-zinc-300">
            구매 단위로 기록하고 로트별 유통기한을 나눕니다. 재고 행과 연결은
            선택이며, 나중에 메인에서 물품을 맞춰도 됩니다.{" "}
            <span className="text-zinc-300">him-purchases</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => 거점_목록을_새로_고친다()}
            className={cn(rowBtnClass, "border-zinc-700 text-zinc-300")}
          >
            거점·카탈로그 새로고침
          </button>
          <button
            type="button"
            disabled={!viewingHouseholdId}
            onClick={() => {
              setRegisterKey((k) => k + 1);
              setRegisterOpen(true);
            }}
            className="cursor-pointer rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400 disabled:pointer-events-none disabled:opacity-40"
          >
            구매 등록
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-zinc-800/80 pb-3">
        {households.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => setSelectedHouseholdId(h.id)}
            className={cn(
              "cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              h.id === viewingHouseholdId
                ? "bg-teal-500/15 text-teal-200 ring-1 ring-teal-500/35"
                : "bg-zinc-900 text-zinc-300 ring-1 ring-zinc-800 hover:bg-zinc-800 hover:text-zinc-200",
            )}
          >
            {h.name}
          </button>
        ))}
      </div>

      {filteredPurchases.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/30 px-4 py-10 text-center text-sm text-zinc-300">
          이 거점에 등록된 구매가 없습니다.「구매 등록」으로 첫 로트를 추가해
          보세요. 이미 칸에 넣은 물품은 메인에서 등록해 보관 위치까지 한 번에
          맞출 수 있습니다.
          <p className="mt-2 text-xs text-zinc-300">
            오늘 날짜: {오늘_날짜_문자열을_구한다()}
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950/80 shadow-inner ring-1 ring-zinc-800/80">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-auto [scrollbar-width:thin]">
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
              <table className="w-full min-w-350 table-fixed border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900">
                    <th className="w-[9%] px-3 py-2.5 text-left text-xs font-medium text-zinc-300">
                      분류
                    </th>
                    <th className="w-[11%] px-3 py-2.5 text-left text-xs font-medium text-zinc-300">
                      품목
                    </th>
                    <th className="w-[10%] px-3 py-2.5 text-left text-xs font-medium text-zinc-300">
                      용량/포장
                    </th>
                    <th className="w-[8%] whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-zinc-300">
                      구매일
                    </th>
                    <th className="w-[10%] px-3 py-2.5 text-left text-xs font-medium text-zinc-300">
                      금액
                    </th>
                    <th className="w-[9%] whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-zinc-300">
                      유통기한
                    </th>
                    <th className="w-[7%] whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-zinc-300">
                      수량
                    </th>
                    <th className="w-[8%] px-3 py-2.5 text-left text-xs font-medium text-zinc-300">
                      임박
                    </th>
                    <th className="w-[7%] px-3 py-2.5 text-right text-xs font-medium text-zinc-300">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseTableRows.map(
                    ({ purchase: p, batch: b, batchIndex: bi, batchCount: n, zebra }) => {
                      const fallbackId = p.inventoryItemId ?? p.id;
                      const { 분류, 이름 } = 품목_라벨을_분해한다(
                        p.itemName,
                        fallbackId,
                      );
                      const 용량포장 = 구매_용량포장_텍스트를_구한다(p);
                      const days = 유통기한까지_일수를_구한다(b.expiresOn);
                      return (
                        <tr
                          key={`${p.id}-${b.id}`}
                          className={`border-b border-zinc-800/90 ${zebra ? "bg-zinc-900/40" : "bg-transparent"} hover:bg-zinc-800/35`}
                        >
                          {bi === 0 ? (
                            <>
                              <td
                                rowSpan={n}
                                className="px-3 py-2 align-top text-zinc-300"
                              >
                                <span className="line-clamp-3 wrap-break-words text-xs">
                                  {분류}
                                </span>
                              </td>
                              <td
                                rowSpan={n}
                                className="px-3 py-2 align-top font-medium text-zinc-100"
                              >
                                <span className="line-clamp-3 wrap-break-words">
                                  {이름}
                                </span>
                                {p.supplierName ? (
                                  <p className="mt-1 text-[11px] font-normal text-zinc-300">
                                    {p.supplierName}
                                  </p>
                                ) : null}
                              </td>
                              <td
                                rowSpan={n}
                                className="px-3 py-2 align-top tabular-nums text-zinc-300"
                              >
                                <span className="line-clamp-3 wrap-break-words text-xs">
                                  {용량포장}
                                </span>
                              </td>
                              <td
                                rowSpan={n}
                                className="whitespace-nowrap px-3 py-2 align-top tabular-nums text-zinc-300"
                              >
                                {p.purchasedOn}
                              </td>
                              <td
                                rowSpan={n}
                                className="px-3 py-2 align-top tabular-nums text-zinc-300"
                              >
                                <div>₩{p.totalPrice.toLocaleString()}</div>
                                <div className="text-xs text-zinc-300">
                                  단가 ₩{p.unitPrice.toLocaleString()}
                                </div>
                              </td>
                            </>
                          ) : null}
                          <td className="whitespace-nowrap px-3 py-2 align-middle tabular-nums text-zinc-300">
                            {b.expiresOn}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 align-middle tabular-nums text-zinc-200">
                            {b.quantity}
                            {p.unitSymbol}
                          </td>
                          <td className="px-3 py-2 align-middle">
                            {만료_뱃지를_렌더한다(days)}
                          </td>
                          {bi === 0 ? (
                            <td
                              rowSpan={n}
                              className="px-3 py-2 align-top text-right"
                            >
                              <button
                                type="button"
                                onClick={() => setPendingDelete(p)}
                                className={cn(rowBtnClass, "text-rose-300/90")}
                              >
                                삭제
                              </button>
                            </td>
                          ) : null}
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {viewingHouseholdId ? (
        <PurchaseRegisterModal
          key={registerKey}
          open={registerOpen}
          onOpenChange={setRegisterOpen}
          householdId={viewingHouseholdId}
          inventoryItems={inventoryItems}
          on등록한다={구매를_추가_한다}
        />
      ) : null}

      <AlertModal
        open={pendingDelete != null}
        onOpenChange={(o) => {
          if (!o) setPendingDelete(null);
        }}
        title="구매 기록 삭제"
        description={
          pendingDelete
            ? `「${pendingDelete.itemName}」(${pendingDelete.purchasedOn}) 구매와 포함된 로트를 모두 삭제합니다.`
            : undefined
        }
        confirmLabel="삭제"
        variant="danger"
        onConfirm={() => {
          if (pendingDelete) 구매를_삭제_한다(pendingDelete.id);
        }}
      />
    </section>
  );
}
