"use client";

import { useAppRoutePrefix } from "@/lib/use-app-route-prefix";
import { Home, History, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { path: "/dashboard", label: "홈", Icon: Home },
  { path: "/inventory-history", label: "이력", Icon: History },
  { path: "/settings", label: "설정", Icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const prefix = useAppRoutePrefix();

  return (
    <nav
      className="z-40 shrink-0 border-t border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex h-16 items-center justify-around">
        {tabs.map((tab) => {
          const href = `${prefix}${tab.path}`;
          const isActive = pathname === href;
          const Icon = tab.Icon;

          return (
            <Link
              key={tab.path}
              href={href}
              className={`flex min-w-[4rem] flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? "text-teal-400"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className="size-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
