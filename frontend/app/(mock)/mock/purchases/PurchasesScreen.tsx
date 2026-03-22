"use client";

import {
  PurchasesProvider,
  type PurchasesDataMode,
} from "./_context/PurchasesContext";
import { PurchasesPanel } from "./_ui/PurchasesPage.panel";

export function PurchasesScreen({ dataMode }: { dataMode: PurchasesDataMode }) {
  return (
    <PurchasesProvider dataMode={dataMode}>
      <PurchasesPanel />
    </PurchasesProvider>
  );
}
