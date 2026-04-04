"use client";

import { AppliancesPanel } from "./_ui/AppliancesPage.panel";

/** Provider는 상위 page.tsx에서 Mock/Current 중 하나가 마운트된다. */
export function AppliancesScreen() {
  return <AppliancesPanel />;
}
