"use client";

import { usePathname } from "next/navigation";

/** `/mock/...` 구간이면 `/mock`, 실제 앱 루트면 빈 문자열 */
export function useAppRoutePrefix(): "" | "/mock" {
  const pathname = usePathname();
  return pathname.startsWith("/mock") ? "/mock" : "";
}
