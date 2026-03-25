import type { PurchaseRecord } from "@/types/domain";

/* ── 목 시드 데이터 ── */

function 날짜에_일수를_더한다(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function 날짜를_YMD_문자열로_한다(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * `/mock/purchases`에서 `him-purchases`가 비었을 때만 쓰는 예시 구매·로트.
 * 호출 시점의 «오늘» 기준으로 만료·임박·여유 뱃지가 보이도록 날짜를 잡는다.
 */
export function mock구매_시드를_생성한다(): PurchaseRecord[] {
  const now = new Date();
  return [
    {
      id: "mock-purchase-milk-1",
      householdId: "mock-household-home",
      inventoryItemId: "mock-item-milk-shelf",
      productId: "p-milk",
      productVariantId: "v-milk-500",
      itemName: "식료품 › 우유 › 500ml",
      variantCaption: "500ml",
      unitSymbol: "병",
      purchasedOn: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, -5)),
      unitPrice: 2800,
      totalPrice: 5600,
      supplierName: "이마트",
      batches: [
        {
          id: "mock-lot-milk-a",
          quantity: 1,
          expiresOn: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, -2)),
        },
        {
          id: "mock-lot-milk-b",
          quantity: 1,
          expiresOn: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, 3)),
        },
      ],
    },
    {
      id: "mock-purchase-ramen-1",
      householdId: "mock-household-home",
      inventoryItemId: "mock-item-ramen",
      productId: "p-ramen",
      productVariantId: "v-ramen-1",
      itemName: "식료품 › 라면 › 1봉",
      variantCaption: "1봉",
      unitSymbol: "개",
      purchasedOn: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, -12)),
      unitPrice: 900,
      totalPrice: 10800,
      supplierName: "쿠팡",
      batches: [
        {
          id: "mock-lot-ramen-a",
          quantity: 12,
          expiresOn: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, 200)),
        },
      ],
    },
    {
      id: "mock-purchase-paper-1",
      householdId: "mock-household-office",
      inventoryItemId: "mock-item-paper",
      productId: "p-a4",
      productVariantId: "v-a4-ream",
      itemName: "사무용품 › A4 용지 › 1권",
      variantCaption: "1권",
      unitSymbol: "권",
      purchasedOn: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, -35)),
      unitPrice: 12000,
      totalPrice: 60000,
      supplierName: "오피스디포",
      batches: [
        {
          id: "mock-lot-paper-a",
          quantity: 2,
          expiresOn: 날짜를_YMD_문자열로_한다(now),
        },
        {
          id: "mock-lot-paper-b",
          quantity: 3,
          expiresOn: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, 400)),
        },
      ],
    },
    /** 메인에서「구매·로트에서 가져오기」데모용 — 아직 재고 행과 연결되지 않음 */
    {
      id: "mock-purchase-snack-unplaced",
      householdId: "mock-household-home",
      itemName: "간식 › 과자 (미배치)",
      variantCaption: "1봉",
      unitSymbol: "개",
      purchasedOn: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, -1)),
      unitPrice: 1500,
      totalPrice: 3000,
      supplierName: "편의점",
      batches: [
        {
          id: "mock-lot-snack-a",
          quantity: 2,
          expiresOn: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, 20)),
        },
      ],
    },
    {
      id: "mock-purchase-drink-office-unplaced",
      householdId: "mock-household-office",
      itemName: "음료 › 생수 500ml (미배치)",
      variantCaption: "500ml",
      unitSymbol: "병",
      purchasedOn: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, -3)),
      unitPrice: 600,
      totalPrice: 3600,
      batches: [
        {
          id: "mock-lot-water-a",
          quantity: 6,
          expiresOn: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, 90)),
        },
      ],
    },
    /** 장보기 제안「유통기한 임박」만 — 수량은 최소 재고 이상(min 없음) */
    {
      id: "mock-purchase-battery-remote",
      householdId: "mock-household-home",
      inventoryItemId: "mock-item-remote",
      productId: "p-battery",
      productVariantId: "v-battery-aaa",
      itemName: "전자·소모품 › 건전지 › AAA 4입",
      variantCaption: "AAA 4입",
      unitSymbol: "팩",
      purchasedOn: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, -14)),
      unitPrice: 4800,
      totalPrice: 9600,
      supplierName: "다이소",
      batches: [
        {
          id: "mock-lot-battery-a",
          quantity: 2,
          expiresOn: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, 2)),
        },
      ],
    },
  ];
}

/* ── 목 세션 스토어 ── */

let cache: PurchaseRecord[] | null = null;

const listeners = new Set<() => void>();

function ensureCache(): PurchaseRecord[] {
  if (cache === null) {
    cache = mock구매_시드를_생성한다();
  }
  return cache;
}

function emit() {
  listeners.forEach((fn) => fn());
}

/**
 * `/mock` 구간에서만 사용 — 브라우저 세션 동안 메모리에만 유지.
 * `useSyncExternalStore`용으로 **같은 내용이면 동일 배열 참조**를 유지한다(스냅샷 무한 루프 방지).
 * 반환값을 직접 mutate 하지 말고 `setMockPurchasesSession` / `updateMockPurchasesSession`만 쓴다.
 */
export function getMockPurchasesSession(): PurchaseRecord[] {
  return ensureCache();
}

export function setMockPurchasesSession(next: PurchaseRecord[]) {
  cache = [...next];
  emit();
}

export function updateMockPurchasesSession(
  updater: (prev: PurchaseRecord[]) => PurchaseRecord[],
) {
  const prev = [...ensureCache()];
  setMockPurchasesSession(updater(prev));
}

export function subscribeMockPurchasesSession(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}
