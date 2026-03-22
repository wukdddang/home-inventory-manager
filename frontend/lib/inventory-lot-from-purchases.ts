import type { PurchaseRecord } from "@/types/domain";
import { 유통기한까지_일수를_구한다 } from "./purchase-lot-helpers";

export type ItemLotExpirySummary = {
  /** 연결된 구매 로트 개수(배치 단위 합) */
  lotCount: number;
  /** 가장 급한 유통기한까지 일수(null이면 로트 없음·날짜 불가) */
  worstExpiryDays: number | null;
  nearestExpiresOn: string | null;
};

/** `him-purchases` 중 해당 재고 행(`inventoryItemId`)에 매칭되는 로트만 모아 요약한다. */
export function 구매목록에서_품목_로트_요약을_구한다(
  purchases: PurchaseRecord[],
  householdId: string,
  inventoryItemId: string,
): ItemLotExpirySummary {
  const relevant = purchases.filter(
    (p) =>
      p.householdId === householdId && p.inventoryItemId === inventoryItemId,
  );
  let lotCount = 0;
  let worst: number | null = null;
  let nearestExpiresOn: string | null = null;
  let bestDay: number | null = null;
  for (const p of relevant) {
    for (const b of p.batches) {
      lotCount += 1;
      const d = 유통기한까지_일수를_구한다(b.expiresOn);
      if (d !== null && (worst === null || d < worst)) worst = d;
      if (d !== null && (bestDay === null || d < bestDay)) {
        bestDay = d;
        nearestExpiresOn = b.expiresOn;
      }
    }
  }
  return { lotCount, worstExpiryDays: worst, nearestExpiresOn };
}
