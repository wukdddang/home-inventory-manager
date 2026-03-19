"use client";

import { useAppRoutePrefix } from "@/lib/use-app-route-prefix";
import type { AuthUser } from "@/types/domain";
import { getAuthUser, setAuthUser } from "@/lib/local-store";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navPaths = [
  { path: "/dashboard", label: "메인" },
  { path: "/settings", label: "설정" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const prefix = useAppRoutePrefix();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getAuthUser());
  }, []);

  const handleLogout = () => {
    setAuthUser(null);
    router.replace(`${prefix}/login`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href={`${prefix}/dashboard`}
            className="font-semibold tracking-tight text-teal-400"
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
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
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
            <span className="hidden max-w-[140px] truncate text-zinc-500 sm:inline">
              {user?.displayName ?? user?.email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:border-zinc-500"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
