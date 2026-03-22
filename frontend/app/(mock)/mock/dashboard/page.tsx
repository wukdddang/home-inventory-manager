"use client";

import { usePathname } from "next/navigation";
import { DashboardScreen } from "./DashboardScreen";

export default function DashboardPage() {
  const pathname = usePathname();
  const dataMode = pathname.startsWith("/mock") ? "mock" : "api";

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
      <DashboardScreen dataMode={dataMode} />
    </div>
  );
}
