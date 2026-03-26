"use client";

import { InventoryLotExpiryBadge } from "@/app/_ui/inventory-lot-expiry-badge";
import { formatLocationBreadcrumb } from "@/lib/household-location";
import { 구매목록에서_품목_로트_요약을_구한다 } from "@/lib/inventory-lot-from-purchases";
import { 유통기한까지_일수를_구한다 } from "@/lib/purchase-lot-helpers";
import { resolveProductImageUrl } from "@/lib/product-catalog-helpers";
import { cn } from "@/lib/utils";
import type {
  Household,
  InventoryLedgerRow,
  InventoryLedgerType,
  InventoryRow,
  ProductCatalog,
  PurchaseRecord,
} from "@/types/domain";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  MapPin,
  Package,
  RefreshCw,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

/* ── animation config ── */

const DURATION = 0.35;
const EASE = [0.32, 0.72, 0, 1] as const;

/* ── types ── */

export type ItemDetailDrawerProps = {
  open: boolean;
  onClose: () => void;
  item: InventoryRow | null;
  household: Household;
  catalog: ProductCatalog;
  purchases: PurchaseRecord[];
  ledger: InventoryLedgerRow[];
  on소비하려고_연다: (item: InventoryRow) => void;
  on폐기하려고_연다: (item: InventoryRow) => void;
};

/* ── ledger type helpers ── */

const LEDGER_TYPE_META: Record<
  InventoryLedgerType,
  { label: string; icon: typeof ArrowUpRight; color: string; bgColor: string }
> = {
  in: {
    label: "입고",
    icon: ArrowUpRight,
    color: "text-teal-300",
    bgColor: "bg-teal-500/15",
  },
  out: {
    label: "소비",
    icon: ArrowDownRight,
    color: "text-blue-300",
    bgColor: "bg-blue-500/15",
  },
  waste: {
    label: "폐기",
    icon: Trash2,
    color: "text-rose-300",
    bgColor: "bg-rose-500/15",
  },
  adjust: {
    label: "조정",
    icon: RefreshCw,
    color: "text-zinc-300",
    bgColor: "bg-zinc-500/15",
  },
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${m}/${day}`;
  } catch {
    return iso.slice(5, 10);
  }
}

function formatFullDate(iso: string): string {
  try {
    const d = new Date(`${iso}T12:00:00`);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}.${m}.${day}`;
  } catch {
    return iso;
  }
}

function isLowStock(item: InventoryRow): boolean {
  return (
    item.minStockLevel != null &&
    Number.isFinite(item.minStockLevel) &&
    item.quantity <= item.minStockLevel
  );
}

/* ── expiry day badge ── */

function ExpiryDaysBadge({ days }: { days: number | null }) {
  if (days === null) return null;
  const abs = Math.abs(days);
  if (days < 0) {
    return (
      <span className="rounded-md bg-rose-500/20 px-1.5 py-0.5 text-xs font-medium text-rose-200 ring-1 ring-rose-500/30">
        만료 {abs}일
      </span>
    );
  }
  if (days === 0) {
    return (
      <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-xs font-medium text-amber-100 ring-1 ring-amber-500/30">
        오늘 만료
      </span>
    );
  }
  if (days <= 3) {
    return (
      <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-xs font-medium text-amber-200 ring-1 ring-amber-500/25">
        D-{days}
      </span>
    );
  }
  return (
    <span className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300">
      D-{days}
    </span>
  );
}

/* ── section wrapper ── */

function DrawerSection({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {title}
        </h4>
        {count != null && (
          <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] tabular-nums text-zinc-400">
            {count}
          </span>
        )}
        <div className="h-px flex-1 bg-zinc-800/80" />
      </div>
      {children}
    </div>
  );
}

/* ── main drawer ── */

export function ItemDetailDrawer({
  open,
  onClose,
  item,
  household,
  catalog,
  purchases,
  ledger,
  on소비하려고_연다,
  on폐기하려고_연다,
}: ItemDetailDrawerProps) {
  const mounted = typeof window !== "undefined";

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const location = useMemo(() => {
    if (!item) return "";
    return formatLocationBreadcrumb(household, item);
  }, [item, household]);

  const lotSummary = useMemo(() => {
    if (!item)
      return { lotCount: 0, worstExpiryDays: null, nearestExpiresOn: null };
    return 구매목록에서_품목_로트_요약을_구한다(
      purchases,
      household.id,
      item.id,
    );
  }, [item, purchases, household.id]);

  const itemPurchases = useMemo(() => {
    if (!item) return [];
    return purchases
      .filter(
        (p) => p.householdId === household.id && p.inventoryItemId === item.id,
      )
      .sort(
        (a, b) =>
          new Date(b.purchasedOn).getTime() - new Date(a.purchasedOn).getTime(),
      );
  }, [item, purchases, household.id]);

  const allLots = useMemo(() => {
    return itemPurchases
      .flatMap((p) =>
        p.batches.map((b) => ({
          ...b,
          purchasedOn: p.purchasedOn,
          days: 유통기한까지_일수를_구한다(b.expiresOn),
        })),
      )
      .sort((a, b) => {
        if (a.days === null && b.days === null) return 0;
        if (a.days === null) return 1;
        if (b.days === null) return -1;
        return a.days - b.days;
      });
  }, [itemPurchases]);

  const itemLedger = useMemo(() => {
    if (!item) return [];
    return ledger
      .filter(
        (r) => r.inventoryItemId === item.id && r.householdId === household.id,
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 10);
  }, [item, ledger, household.id]);

  const low = item ? isLowStock(item) : false;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence mode="sync">
      {open && item ? (
        <>
          {/* overlay */}
          <motion.div
            key="item-drawer-overlay"
            className="fixed inset-0 z-10040 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION, ease: EASE }}
            onClick={onClose}
            aria-hidden
          />

          {/* drawer panel */}
          <motion.aside
            key="item-drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label={`${item.name} 상세`}
            className="fixed inset-y-0 right-0 z-10041 flex w-full max-w-md flex-col bg-zinc-950 shadow-2xl shadow-black/40 outline-none sm:max-w-104"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: DURATION, ease: EASE }}
          >
            {/* ── header ── */}
            <div className="relative shrink-0 border-b border-zinc-800 px-5 pb-4 pt-5">
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
                aria-label="닫기"
              >
                <X className="size-4" />
              </button>
              <div className="flex items-start gap-3 pr-10">
                {(() => {
                  const imgUrl = resolveProductImageUrl(
                    catalog,
                    item.productId,
                  );
                  return imgUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imgUrl}
                      alt=""
                      className="size-10 shrink-0 rounded-xl border border-zinc-800 object-cover"
                    />
                  ) : (
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
                      <Package className="size-5 text-zinc-500" />
                    </div>
                  );
                })()}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold text-white">
                    {item.name}
                  </h2>
                  {item.variantCaption && (
                    <p className="mt-0.5 truncate text-sm text-zinc-400">
                      {item.variantCaption}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── scrollable body ── */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
              <div className="space-y-6 px-5 py-5">
                {/* info cards */}
                <div className="grid grid-cols-3 gap-2">
                  <div
                    className={cn(
                      "rounded-xl border px-3 py-2.5",
                      low
                        ? "border-amber-500/30 bg-amber-500/8"
                        : "border-zinc-800 bg-zinc-900/60",
                    )}
                  >
                    <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      수량
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-lg font-bold tabular-nums",
                        low ? "text-amber-300" : "text-white",
                      )}
                    >
                      {item.quantity}
                      <span className="ml-0.5 text-xs font-normal text-zinc-400">
                        {item.unit}
                      </span>
                    </p>
                  </div>
                  <div
                    className={cn(
                      "rounded-xl border px-3 py-2.5",
                      low
                        ? "border-amber-500/30 bg-amber-500/8"
                        : "border-zinc-800 bg-zinc-900/60",
                    )}
                  >
                    <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      최소 재고
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-lg font-bold tabular-nums",
                        low ? "text-amber-300" : "text-white",
                      )}
                    >
                      {item.minStockLevel ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      로트
                    </p>
                    <div className="mt-1">
                      <InventoryLotExpiryBadge
                        worstExpiryDays={lotSummary.worstExpiryDays}
                        lotCount={lotSummary.lotCount}
                      />
                    </div>
                  </div>
                </div>

                {/* location */}
                {location && (
                  <div className="flex items-center gap-2 rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-3 py-2">
                    <MapPin className="size-3.5 shrink-0 text-zinc-500" />
                    <span className="truncate text-sm text-zinc-300">
                      {location}
                    </span>
                  </div>
                )}

                {/* lots & expiry */}
                <DrawerSection title="로트" count={allLots.length}>
                  {allLots.length === 0 ? (
                    <p className="py-3 text-center text-sm text-zinc-600">
                      연결된 로트가 없습니다
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {allLots.map((lot) => (
                        <div
                          key={lot.id}
                          className="flex items-center gap-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-3 py-2"
                        >
                          <CalendarDays className="size-3.5 shrink-0 text-zinc-600" />
                          <span className="min-w-0 flex-1 text-sm tabular-nums text-zinc-300">
                            {formatFullDate(lot.expiresOn)}
                          </span>
                          <span className="shrink-0 text-sm tabular-nums text-zinc-400">
                            {lot.quantity}
                            {item.unit}
                          </span>
                          <ExpiryDaysBadge days={lot.days} />
                        </div>
                      ))}
                    </div>
                  )}
                </DrawerSection>

                {/* recent history */}
                <DrawerSection title="최근 이력" count={itemLedger.length}>
                  {itemLedger.length === 0 ? (
                    <p className="py-3 text-center text-sm text-zinc-600">
                      이력이 없습니다
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {itemLedger.map((row) => {
                        const meta = LEDGER_TYPE_META[row.type];
                        const Icon = meta.icon;
                        return (
                          <div
                            key={row.id}
                            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition hover:bg-zinc-900/60"
                          >
                            <div
                              className={cn(
                                "flex size-7 shrink-0 items-center justify-center rounded-lg",
                                meta.bgColor,
                              )}
                            >
                              <Icon className={cn("size-3.5", meta.color)} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={cn(
                                    "text-xs font-medium",
                                    meta.color,
                                  )}
                                >
                                  {meta.label}
                                </span>
                                <span className="text-sm font-semibold tabular-nums text-zinc-200">
                                  {row.quantityDelta > 0 ? "+" : ""}
                                  {row.quantityDelta}
                                </span>
                                <span className="text-xs tabular-nums text-zinc-500">
                                  → {row.quantityAfter}
                                </span>
                              </div>
                              {row.memo && (
                                <p className="mt-0.5 truncate text-xs text-zinc-500">
                                  {row.memo}
                                </p>
                              )}
                            </div>
                            <span className="shrink-0 text-xs tabular-nums text-zinc-600">
                              {formatDate(row.createdAt)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </DrawerSection>

                {/* purchase history */}
                <DrawerSection title="구매 내역" count={itemPurchases.length}>
                  {itemPurchases.length === 0 ? (
                    <p className="py-3 text-center text-sm text-zinc-600">
                      구매 기록이 없습니다
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {itemPurchases.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-3 py-2.5"
                        >
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/12">
                            <ShoppingBag className="size-3.5 text-violet-300" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-sm tabular-nums text-zinc-300">
                              {formatFullDate(p.purchasedOn)}
                            </span>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                              <span className="tabular-nums">
                                {p.totalPrice.toLocaleString()}원
                              </span>
                              <span>·</span>
                              <span>{p.batches.length}로트</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </DrawerSection>
              </div>
            </div>

            {/* ── footer ── */}
            <div className="shrink-0 border-t border-zinc-800 px-5 py-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={item.quantity < 1}
                  onClick={() => {
                    on소비하려고_연다(item);
                    onClose();
                  }}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 py-2.5 text-sm font-semibold text-teal-300 transition hover:bg-teal-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowDownRight className="size-4" />
                  소비
                </button>
                <button
                  type="button"
                  disabled={item.quantity < 1}
                  onClick={() => {
                    on폐기하려고_연다(item);
                    onClose();
                  }}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="size-4" />
                  폐기
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
