"use client";

import { usePathname } from "next/navigation";
import { MockPurchasesProvider } from "./_context/PurchasesContext";
import { CurrentPurchasesProvider } from "@/app/(current)/purchases/_context/PurchasesContext";
import { PurchasesScreen } from "./PurchasesScreen";

export default function PurchasesPage() {
  const pathname = usePathname();
  const ProviderWrapper = pathname.startsWith("/mock")
    ? MockPurchasesProvider
    : CurrentPurchasesProvider;

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
      <ProviderWrapper>
        <PurchasesScreen />
      </ProviderWrapper>
    </div>
  );
}
