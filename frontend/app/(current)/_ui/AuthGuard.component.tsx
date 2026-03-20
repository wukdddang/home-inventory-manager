"use client";

import { useAppRoutePrefix } from "@/lib/use-app-route-prefix";
import {
  getAuthUserSnapshot,
  subscribeAuthUser,
} from "@/lib/local-store";
import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const prefix = useAppRoutePrefix();
  const user = useSyncExternalStore(
    subscribeAuthUser,
    getAuthUserSnapshot,
    () => null,
  );

  useEffect(() => {
    if (user === null) router.replace(`${prefix}/login`);
  }, [user, router, prefix]);

  if (!user) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-zinc-950 text-zinc-400">
        <p className="text-sm">불러오는 중…</p>
      </div>
    );
  }

  return <>{children}</>;
}
