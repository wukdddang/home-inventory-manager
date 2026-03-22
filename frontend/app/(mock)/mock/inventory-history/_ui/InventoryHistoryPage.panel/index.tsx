"use client";

import {
  appViewPresenceTransition,
  appViewPresenceVariants,
} from "@/app/_ui/app-view-transition.motion";
import { MOCK_SEED_HOUSEHOLDS } from "@/app/(mock)/mock/dashboard/_context/dashboard-mock.service";
import type { Household, InventoryLedgerRow, InventoryLedgerType } from "@/types/domain";
import {
  getInventoryHistoryBundleSnapshot,
  subscribeInventoryHistoryBundle,
} from "@/lib/local-store";
import { useAppRoutePrefix } from "@/lib/use-app-route-prefix";
import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";

function 거점_표시_이름을_구한다(
  households: Household[],
  householdId: string,
): string {
  const h = households.find((x) => x.id === householdId);
  return h?.name ?? householdId;
}

function 이력_유형_라벨을_구한다(type: InventoryLedgerType): string {
  const labels: Record<InventoryLedgerType, string> = {
    in: "입고",
    out: "소비",
    adjust: "수량 조정",
    waste: "폐기",
  };
  return labels[type];
}

function 폐기_사유_라벨을_구한다(code?: string): string {
  if (!code) return "";
  if (code === "expired") return "유통기한 만료";
  if (code === "damaged") return "파손·불량";
  if (code === "other") return "기타";
  return code;
}

export function InventoryHistoryPanel() {
  const prefix = useAppRoutePrefix();
  const { ledger, households } = useSyncExternalStore(
    subscribeInventoryHistoryBundle,
    getInventoryHistoryBundleSnapshot,
    () => ({ ledger: [], households: [], purchases: [] }),
  );

  const householdsForLabels = useMemo(() => {
    if (households.length > 0) return households;
    return structuredClone(MOCK_SEED_HOUSEHOLDS);
  }, [households]);

  const [filterHouseholdId, setFilterHouseholdId] = useState<string>("all");

  const sortedRows = useMemo(() => {
    let rows = [...ledger];
    if (filterHouseholdId !== "all") {
      rows = rows.filter((r) => r.householdId === filterHouseholdId);
    }
    rows.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return rows;
  }, [ledger, filterHouseholdId]);

  return (
    <motion.div
      className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-6 pb-16"
      initial="initial"
      animate="animate"
      variants={appViewPresenceVariants}
      transition={appViewPresenceTransition}
    >
      <div>
        <h1 className="text-2xl font-semibold text-white">재고 이력</h1>
        <p className="mt-1 text-sm text-zinc-500">
          소비·폐기 등으로 남긴 기록입니다. 로컬{" "}
          <span className="text-zinc-600">him-inventory-ledger</span>에
          저장됩니다.
        </p>
        <Link
          href={`${prefix}/dashboard`}
          className="mt-2 inline-block text-xs font-medium text-teal-400/90 hover:underline"
        >
          ← 메인(대시보드)으로
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <span>거점</span>
          <select
            value={filterHouseholdId}
            onChange={(e) => setFilterHouseholdId(e.target.value)}
            className="cursor-pointer rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
          >
            <option value="all">전체</option>
            {householdsForLabels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </label>
        <span className="text-xs text-zinc-600">
          항목 {sortedRows.length}건
        </span>
      </div>

      {sortedRows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-700 px-4 py-10 text-center text-sm text-zinc-500">
          아직 기록이 없습니다. 대시보드 물품 목록에서 소비·폐기를 남기면 여기에
          쌓입니다.
        </p>
      ) : (
        <ol className="relative space-y-0 border-l border-zinc-800 pl-6">
          {sortedRows.map((row) => (
            <TimelineEntry key={row.id} row={row} households={householdsForLabels} />
          ))}
        </ol>
      )}
    </motion.div>
  );
}

function TimelineEntry({
  row,
  households,
}: {
  row: InventoryLedgerRow;
  households: Household[];
}) {
  const when = new Date(row.createdAt);
  const dateStr = Number.isNaN(when.getTime())
    ? row.createdAt
    : when.toLocaleString("ko-KR", {
        dateStyle: "medium",
        timeStyle: "short",
      });

  const typeStyle =
    row.type === "waste"
      ? "bg-rose-500/15 text-rose-200 ring-rose-500/35"
      : row.type === "out"
        ? "bg-teal-500/12 text-teal-200 ring-teal-500/30"
        : "bg-zinc-800 text-zinc-300 ring-zinc-600";

  return (
    <li className="relative pb-8 last:pb-0">
      <span
        className="absolute -left-[calc(0.5rem+1px)] top-1.5 size-2.5 rounded-full bg-teal-500 ring-4 ring-zinc-950"
        aria-hidden
      />
      <article className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-zinc-100">
              {row.itemLabel ?? row.inventoryItemId}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {거점_표시_이름을_구한다(households, row.householdId)}
            </p>
          </div>
          <time className="shrink-0 text-xs text-zinc-500 tabular-nums">
            {dateStr}
          </time>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${typeStyle}`}
          >
            {이력_유형_라벨을_구한다(row.type)}
          </span>
          <span className="text-sm tabular-nums text-zinc-300">
            {row.quantityDelta > 0 ? "+" : ""}
            {row.quantityDelta}
            <span className="ml-2 text-xs text-zinc-500">
              → 잔여 {row.quantityAfter}
            </span>
          </span>
        </div>
        {row.type === "waste" && row.reason ? (
          <p className="mt-2 text-xs text-zinc-400">
            사유: {폐기_사유_라벨을_구한다(row.reason)}
          </p>
        ) : null}
        {row.memo ? (
          <p className="mt-1 text-xs text-zinc-500">메모: {row.memo}</p>
        ) : null}
      </article>
    </li>
  );
}
