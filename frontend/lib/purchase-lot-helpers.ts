import type { PurchaseBatchLot, PurchaseRecord } from "@/types/domain";

/** 구매 1건에 포함된 로트 수량 합 */
export function 구매_로트_수량_합을_구한다(p: PurchaseRecord): number {
  return p.batches.reduce((s, b) => s + b.quantity, 0);
}

/**
 * 로트(유통기한)마다 배분된 총액.
 * 구매 전체 `totalPrice`를 로트 수량 비율로 나눠 표시(반올림) — 합이면 구매 총액과 일치.
 */
export function 구매_로트_행_배분_총액을_구한다(
  p: PurchaseRecord,
  batch: PurchaseBatchLot,
): number {
  const sum = 구매_로트_수량_합을_구한다(p);
  if (sum <= 0) return 0;
  return Math.round((p.totalPrice * batch.quantity) / sum);
}

/** YYYY-MM-DD 기준 오늘과의 일수 차이(음수=만료됨). */
export function 유통기한까지_일수를_구한다(expiresOn: string): number | null {
  const t = new Date(`${expiresOn}T12:00:00`).getTime();
  if (Number.isNaN(t)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(t);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function 오늘_날짜_문자열을_구한다(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
