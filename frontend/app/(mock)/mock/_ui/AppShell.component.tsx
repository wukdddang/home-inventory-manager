"use client";

import { CurrentDashboardProvider } from "@/app/(current)/dashboard/_context/DashboardContext";
import { MockDashboardProvider } from "@/app/(mock)/mock/dashboard/_context/DashboardContext";
import { DashboardShoppingListModal } from "@/app/(mock)/mock/dashboard/_ui/DashboardInventory.section/DashboardShoppingList.module";
import {
  NotificationCenterModal,
  useUnreadNotificationCount,
} from "@/app/_ui/notification-center.modal";
import { MobileShell } from "@/app/_ui/mobile/MobileShell.component";
import { useAppRoutePrefix } from "@/lib/use-app-route-prefix";
import { useDeviceLayout } from "@/hooks/useDeviceLayout";
import {
  getAuthUserSnapshot,
  setAuthUser,
  subscribeAuthUser,
} from "@/lib/local-store";
import {
  Bell,
  History,
  LayoutDashboard,
  Monitor,
  Receipt,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import {
  SelectedHouseholdShellProvider,
  useSelectedHouseholdShell,
} from "./selected-household-shell-bridge";

const navPaths = [
  { path: "/dashboard", label: "메인", Icon: LayoutDashboard },
  { path: "/purchases", label: "구매·로트", Icon: Receipt },
  { path: "/inventory-history", label: "재고 이력", Icon: History },
  { path: "/appliances", label: "가전·설비", Icon: Monitor },
  { path: "/settings", label: "설정", Icon: Settings },
] as const;

function ShoppingCartIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
      />
    </svg>
  );
}

/** 모바일 쉘에서 가구를 선택할 때 발행하는 커스텀 이벤트 키 */
export const MOBILE_HOUSEHOLD_SELECT_EVENT = "mobile:household-select";

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const prefix = useAppRoutePrefix();
  const { household } = useSelectedHouseholdShell();
  const { isMobileLayout } = useDeviceLayout();
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const unreadCount = useUnreadNotificationCount(household?.id ?? null);

  const user = useSyncExternalStore(
    subscribeAuthUser,
    getAuthUserSnapshot,
    () => null,
  );

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // 로그아웃 API 실패해도 로컬 정리 진행
    }
    setAuthUser(null);
    router.replace(`${prefix}/login`);
  };

  const handleMobileHouseholdSelect = (id: string) => {
    window.dispatchEvent(
      new CustomEvent(MOBILE_HOUSEHOLD_SELECT_EVENT, { detail: id }),
    );
  };

  const isMock = pathname.startsWith("/mock");
  const dataMode = isMock ? "mock" : "api";
  const DashboardProviderWrapper = isMock
    ? MockDashboardProvider
    : CurrentDashboardProvider;

  return (
    <DashboardProviderWrapper>
      {isMobileLayout ? (
        <>
          <MobileShell
            onNotificationOpen={() => setNotificationOpen(true)}
            onHouseholdSelect={handleMobileHouseholdSelect}
          >
            {children}
          </MobileShell>
          <NotificationCenterModal
            open={notificationOpen}
            onOpenChange={setNotificationOpen}
            householdId={household?.id ?? null}
            dataMode={dataMode}
          />
        </>
      ) : (
        <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-zinc-950 text-zinc-100 max-lg:hidden">
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
                  const Icon = n.Icon;
                  return (
                    <Link
                      key={n.path}
                      href={href}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                        pathname === href
                          ? "bg-teal-500/15 text-teal-300"
                          : "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-200"
                      }`}
                    >
                      <Icon
                        className="size-4 shrink-0 opacity-90"
                        aria-hidden
                      />
                      {n.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="flex items-center gap-2 text-sm sm:gap-3">
                <span className="hidden max-w-35 truncate text-zinc-300 sm:inline">
                  {user?.displayName ?? user?.email}
                </span>
                <button
                  type="button"
                  onClick={() => setNotificationOpen(true)}
                  className="relative flex size-8 cursor-pointer items-center justify-center rounded-lg border border-zinc-700 text-zinc-300 transition-colors hover:border-teal-500/40 hover:bg-zinc-800 hover:text-teal-300"
                  aria-label="알림"
                >
                  <Bell className="size-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-zinc-950">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShoppingOpen(true)}
                  className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-zinc-700 text-zinc-300 transition-colors hover:border-teal-500/40 hover:bg-zinc-800 hover:text-teal-300"
                  aria-label="장보기 목록"
                >
                  <ShoppingCartIcon className="size-4.5" />
                </button>
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
          <DashboardShoppingListModal
            open={shoppingOpen}
            onOpenChange={setShoppingOpen}
            household={household}
          />
          <NotificationCenterModal
            open={notificationOpen}
            onOpenChange={setNotificationOpen}
            householdId={household?.id ?? null}
            dataMode={dataMode}
          />
        </div>
      )}
    </DashboardProviderWrapper>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SelectedHouseholdShellProvider>
      <AppShellInner>{children}</AppShellInner>
    </SelectedHouseholdShellProvider>
  );
}
