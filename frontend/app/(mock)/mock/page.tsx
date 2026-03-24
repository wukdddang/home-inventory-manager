"use client";

import { useAppRoutePrefix } from "@/lib/use-app-route-prefix";
import { getAuthUser } from "@/lib/local-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const router = useRouter();
  const prefix = useAppRoutePrefix();

  useEffect(() => {
    if (getAuthUser()) router.replace(`${prefix}/dashboard`);
    else router.replace(`${prefix}/login`);
  }, [router, prefix]);

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-zinc-950 text-zinc-300">
      <p className="text-sm">이동 중…</p>
    </div>
  );
}
