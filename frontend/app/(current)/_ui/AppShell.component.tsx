"use client";

import { useAppRoutePrefix } from "@/lib/use-app-route-prefix";
import {
  getAuthUserSnapshot,
  setAuthUser,
  subscribeAuthUser,
} from "@/lib/local-store";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

const navPaths = [
  { path: "/dashboard", label: "메인" },
  { path: "/purchases", label: "구매·로트" },
  { path: "/inventory-history", label: "재고 이력" },
  { path: "/settings", label: "설정" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const prefix = useAppRoutePrefix();
  const user = useSyncExternalStore(
    subscribeAuthUser,
    getAuthUserSnapshot,
    () => null,
  );

  const handleLogout = () => {
    setAuthUser(null);
    router.replace(`${prefix}/login`);
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <header className="z-40 shrink-0 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
        <div className="flex h-14 w-full items-center justify-between gap-3 px-3 sm:px-4">
          <Link
            href={`${prefix}/dashboard`}
            className="cursor-pointer font-semibold tracking-tight text-teal-400"
          >
            집비치기
          </Link>
          <nav className="flex flex-1 items-center justify-center gap-1 sm:gap-2">
            {navPaths.map((n) => {
              const href = `${prefix}${n.path}`;
              return (
                <Link
                  key={n.path}
                  href={href}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    pathname === href
                      ? "bg-teal-500/15 text-teal-300"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden max-w-35 truncate text-zinc-500 sm:inline">
              {user?.displayName ?? user?.email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="cursor-pointer rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:border-zinc-500"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>
      <main className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto overscroll-y-contain px-3 py-4 sm:px-4">
        {children}
      </main>
    </div>
  );
}
