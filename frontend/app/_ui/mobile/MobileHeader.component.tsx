"use client";

import { useSelectedHouseholdShell } from "@/app/(mock)/mock/_ui/selected-household-shell-bridge";
import { useUnreadNotificationCount } from "@/app/_ui/notification-center.modal";
import { useDashboard } from "@/app/(mock)/mock/dashboard/_hooks/useDashboard";
import { Bell, ChevronDown } from "lucide-react";
import { useState } from "react";

type MobileHeaderProps = {
  onNotificationOpen: () => void;
  onHouseholdSelect: (id: string) => void;
};

export function MobileHeader({
  onNotificationOpen,
  onHouseholdSelect,
}: MobileHeaderProps) {
  const { household } = useSelectedHouseholdShell();
  const { households } = useDashboard();
  const unreadCount = useUnreadNotificationCount(household?.id ?? null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="z-40 shrink-0 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4">
        {/* 가구 선택 드롭다운 */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-zinc-100 transition-colors hover:bg-zinc-800"
          >
            <span className="max-w-[10rem] truncate">
              {household?.name ?? "거점 선택"}
            </span>
            <ChevronDown className="size-4 text-zinc-400" />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 z-50 mt-1 min-w-[12rem] rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl">
                {households.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => {
                      onHouseholdSelect(h.id);
                      setDropdownOpen(false);
                    }}
                    className={`flex w-full cursor-pointer items-center px-3 py-2.5 text-left text-sm transition-colors ${
                      h.id === household?.id
                        ? "bg-teal-500/15 text-teal-300"
                        : "text-zinc-300 hover:bg-zinc-800"
                    }`}
                  >
                    {h.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 알림 버튼 */}
        <button
          type="button"
          onClick={onNotificationOpen}
          className="relative flex size-10 cursor-pointer items-center justify-center rounded-lg text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-teal-300"
          aria-label="알림"
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-zinc-950">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
