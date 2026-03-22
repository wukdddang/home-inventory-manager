import type { PurchaseRecord } from "@/types/domain";
import { mock구매_시드를_생성한다 } from "./purchases-mock-seed";

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
