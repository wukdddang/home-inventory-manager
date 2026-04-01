"use client";

import { useSettings } from "../../_hooks/useSettings";
import { useDashboard } from "@/app/(mock)/mock/dashboard/_hooks/useDashboard";
import { AppLoadingState } from "@/app/_ui/app-loading-state";
import { MOBILE_HOUSEHOLD_SELECT_EVENT } from "@/app/(mock)/mock/_ui/AppShell.component";
import {
  getMockSettingsAccountUserSnapshot,
  subscribeMockSettingsAccountUser,
  setAuthUser,
} from "@/lib/local-store";
import { useAppRoutePrefix } from "@/lib/use-app-route-prefix";
import { useRouter } from "next/navigation";
import { useSyncExternalStore, useState, useCallback } from "react";
import { LogOut, Monitor, Home, ChevronRight, Bell } from "lucide-react";

export function SettingsMobilePanel() {
  const { settings, loading, error, 알림_플래그를_토글_한다 } = useSettings();
  const { households } = useDashboard();
  const prefix = useAppRoutePrefix();
  const router = useRouter();

  const user = useSyncExternalStore(
    subscribeMockSettingsAccountUser,
    getMockSettingsAccountUserSnapshot,
    () => ({ email: "", displayName: "", emailVerified: false }),
  );

  // 푸시 알림 mock 상태
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushRequesting, setPushRequesting] = useState(false);

  const handlePushToggle = useCallback(async () => {
    if (pushEnabled) {
      console.log("[FCM] 토큰 삭제 요청");
      setPushEnabled(false);
      return;
    }
    setPushRequesting(true);
    try {
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const mockToken = `fcm_mock_${crypto.randomUUID().slice(0, 8)}`;
          console.log("[FCM] 토큰 발급:", mockToken);
          console.log("[FCM] 서버 등록 완료 (mock)");
          setPushEnabled(true);
        } else {
          console.log("[FCM] 권한 거부:", permission);
          alert("브라우저 설정에서 알림을 허용해 주세요.");
        }
      } else {
        console.log("[FCM] Notification API 미지원");
        // mock 환경에서는 그냥 토글
        const mockToken = `fcm_mock_${crypto.randomUUID().slice(0, 8)}`;
        console.log("[FCM] 토큰 발급 (mock fallback):", mockToken);
        setPushEnabled(true);
      }
    } finally {
      setPushRequesting(false);
    }
  }, [pushEnabled]);

  // 가구 전환
  const [showHouseholdPicker, setShowHouseholdPicker] = useState(false);
  const currentHousehold = households[0] ?? null;

  const handleHouseholdSelect = (id: string) => {
    window.dispatchEvent(
      new CustomEvent(MOBILE_HOUSEHOLD_SELECT_EVENT, { detail: id }),
    );
    setShowHouseholdPicker(false);
  };

  const handleLogout = () => {
    setAuthUser(null);
    router.replace(`${prefix}/login`);
  };

  if (loading || !settings) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <AppLoadingState message="설정 불러오는 중…" layout="standalone" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <p className="text-sm text-rose-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-4">
      {/* 계정 정보 */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-sm font-medium text-zinc-100">
          {user.displayName || "사용자"}
        </p>
        <p className="mt-0.5 text-xs text-zinc-400">{user.email}</p>
      </div>

      {/* 알림 설정 */}
      <div className="flex flex-col gap-1">
        <h3 className="px-1 pb-1 text-xs font-medium tracking-wide text-zinc-500">
          알림 설정
        </h3>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900">
          <ToggleRow
            label="푸시 알림 받기"
            checked={pushEnabled}
            onChange={handlePushToggle}
            disabled={pushRequesting}
            icon={<Bell className="size-4 text-zinc-400" />}
          />
          <div className="mx-4 h-px bg-zinc-800" />
          <ToggleRow
            label="유통기한 알림"
            checked={settings.notifyExpiration}
            onChange={() => 알림_플래그를_토글_한다("notifyExpiration")}
          />
          <div className="mx-4 h-px bg-zinc-800" />
          <ToggleRow
            label="장보기 알림"
            checked={settings.notifyShopping}
            onChange={() => 알림_플래그를_토글_한다("notifyShopping")}
          />
          <div className="mx-4 h-px bg-zinc-800" />
          <ToggleRow
            label="재고 부족 알림"
            checked={settings.notifyLowStock}
            onChange={() => 알림_플래그를_토글_한다("notifyLowStock")}
          />
        </div>
      </div>

      {/* 가구 전환 */}
      {households.length > 0 && (
        <div className="flex flex-col gap-1">
          <h3 className="px-1 pb-1 text-xs font-medium tracking-wide text-zinc-500">
            가구
          </h3>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900">
            <button
              type="button"
              onClick={() => setShowHouseholdPicker(!showHouseholdPicker)}
              className="flex w-full cursor-pointer items-center gap-3 px-4 py-3.5"
            >
              <Home className="size-4 text-zinc-400" />
              <span className="flex-1 text-left text-sm text-zinc-200">
                {currentHousehold?.name ?? "가구 없음"}
              </span>
              <ChevronRight
                className={`size-4 text-zinc-500 transition-transform ${
                  showHouseholdPicker ? "rotate-90" : ""
                }`}
              />
            </button>
            {showHouseholdPicker && households.length > 1 && (
              <div className="border-t border-zinc-800 px-2 pb-2">
                {households.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => handleHouseholdSelect(h.id)}
                    className={`mt-1 w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                      h.id === currentHousehold?.id
                        ? "bg-teal-500/15 text-teal-300"
                        : "text-zinc-300 active:bg-zinc-800"
                    }`}
                  >
                    {h.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 로그아웃 */}
      <button
        type="button"
        onClick={handleLogout}
        className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 py-3.5 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/10"
      >
        <LogOut className="size-4" />
        로그아웃
      </button>

      {/* 데스크탑 유도 안내 */}
      <div className="flex items-start gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
        <Monitor className="mt-0.5 size-4 shrink-0 text-zinc-500" />
        <p className="text-xs leading-relaxed text-zinc-500">
          카탈로그 관리, 멤버 초대/역할 변경, 비밀번호 변경 등 상세 설정은
          데스크탑에서 이용해 주세요.
        </p>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  disabled,
  icon,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className="flex w-full cursor-pointer items-center justify-between px-4 py-3.5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="flex items-center gap-2 text-sm text-zinc-200">
        {icon}
        {label}
      </span>
      <div
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? "bg-teal-600" : "bg-zinc-700"
        }`}
      >
        <div
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </div>
    </button>
  );
}
