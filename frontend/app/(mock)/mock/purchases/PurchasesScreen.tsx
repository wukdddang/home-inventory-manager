"use client";

import { PurchasesPanel } from "./_ui/PurchasesPage.panel";

/** Provider는 상위 page.tsx에서 Mock/Current 중 하나가 마운트된다. */
export function PurchasesScreen() {
  return <PurchasesPanel />;
}
