"use client";

import { usePathname } from "next/navigation";
import { DashboardScreen } from "./DashboardScreen";

export default function DashboardPage() {
  const pathname = usePathname();
  const dataMode = pathname.startsWith("/mock") ? "mock" : "api";

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <DashboardScreen dataMode={dataMode} />
    </div>
  );
}
