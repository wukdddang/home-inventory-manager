"use client";

import { usePathname } from "next/navigation";
import { PurchasesScreen } from "./PurchasesScreen";

export default function PurchasesPage() {
  const pathname = usePathname();
  const dataMode = pathname.startsWith("/mock") ? "mock" : "api";

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
      <PurchasesScreen dataMode={dataMode} />
    </div>
  );
}
