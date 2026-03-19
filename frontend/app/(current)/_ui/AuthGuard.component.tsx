"use client";

import { useAppRoutePrefix } from "@/lib/use-app-route-prefix";
import { getAuthUser } from "@/lib/local-store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const prefix = useAppRoutePrefix();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const u = getAuthUser();
    if (!u) router.replace(`${prefix}/login`);
    else setOk(true);
  }, [router, prefix]);

  if (!ok) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        <p className="text-sm">불러오는 중…</p>
      </div>
    );
  }

  return <>{children}</>;
}
