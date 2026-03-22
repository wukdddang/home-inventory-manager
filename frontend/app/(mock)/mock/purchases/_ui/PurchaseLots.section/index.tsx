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

function 구매의_최악_만료_일수를_구한다(p: PurchaseRecord): number | null {
  let min: number | null = null;
  for (const b of p.batches) {
    const d = 유통기한까지_일수를_구한다(b.expiresOn);
    if (d === null) continue;
    if (min === null || d < min) min = d;
  }
  return min;
}

function 만료_뱃지를_렌더한다(days: number | null) {
  if (days === null) {
    return (
      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">
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

  const inventoryItems = selected?.items ?? [];

  if (households.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-center">
        <p className="text-sm text-zinc-400">
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
    <section className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <h2 className="text-lg font-semibold text-white">구매·유통기한 로트</h2>
          <p className="text-sm text-zinc-500">
            구매 단위로 기록하고, 로트별 유통기한을 나눕니다.{" "}
            <span className="text-zinc-600">him-purchases</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => 거점_목록을_새로_고친다()}
            className={cn(rowBtnClass, "border-zinc-700 text-zinc-400")}
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
                : "bg-zinc-900 text-zinc-400 ring-1 ring-zinc-800 hover:bg-zinc-800 hover:text-zinc-200",
            )}
          >
            {h.name}
          </button>
        ))}
      </div>

      {filteredPurchases.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/30 px-4 py-10 text-center text-sm text-zinc-500">
          이 거점에 등록된 구매가 없습니다.「구매 등록」으로 첫 로트를
          추가해 보세요.
          <p className="mt-2 text-xs text-zinc-600">
            오늘 날짜: {오늘_날짜_문자열을_구한다()}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3 font-medium">품목</th>
                <th className="px-4 py-3 font-medium">구매일</th>
                <th className="px-4 py-3 font-medium">금액</th>
                <th className="px-4 py-3 font-medium">로트</th>
                <th className="px-4 py-3 font-medium">임박</th>
                <th className="px-4 py-3 font-medium text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.map((p) => {
                const worst = 구매의_최악_만료_일수를_구한다(p);
                return (
                  <tr
                    key={p.id}
                    className="border-b border-zinc-800/90 last:border-0 hover:bg-zinc-900/40"
                  >
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium text-zinc-100">{p.itemName}</p>
                      {p.variantCaption ? (
                        <p className="text-xs text-zinc-500">{p.variantCaption}</p>
                      ) : null}
                      {p.supplierName ? (
                        <p className="text-[11px] text-zinc-600">
                          {p.supplierName}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 align-top text-zinc-300 tabular-nums">
                      {p.purchasedOn}
                    </td>
                    <td className="px-4 py-3 align-top text-zinc-300 tabular-nums">
                      <div>₩{p.totalPrice.toLocaleString()}</div>
                      <div className="text-xs text-zinc-500">
                        단가 ₩{p.unitPrice.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-zinc-300">
                      <ul className="space-y-1 text-xs">
                        {p.batches.map((b) => (
                          <li key={b.id} className="tabular-nums">
                            <span className="text-zinc-400">{b.expiresOn}</span>
                            <span className="mx-1.5 text-zinc-600">·</span>
                            <span>
                              {b.quantity}
                              {p.unitSymbol}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {만료_뱃지를_렌더한다(worst)}
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <button
                        type="button"
                        onClick={() => setPendingDelete(p)}
                        className={cn(rowBtnClass, "text-rose-300/90")}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
