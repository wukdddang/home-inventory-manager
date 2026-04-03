"use client";

import { useSettings } from "../../_hooks/useSettings";
import { useDashboard } from "@/app/(mock)/mock/dashboard/_hooks/useDashboard";
import { AppLoadingState } from "@/app/_ui/app-loading-state";
import { MOBILE_HOUSEHOLD_SELECT_EVENT } from "@/app/(mock)/mock/_ui/AppShell.component";
import {
  getMockSettingsAccountUserSnapshot,
  subscribeMockSettingsAccountUser,
  getAuthUserSnapshot,
  subscribeAuthUser,
  setAuthUser,
} from "@/lib/local-store";
import { useAppRoutePrefix } from "@/lib/use-app-route-prefix";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useSyncExternalStore, useState, useCallback } from "react";
import { usePwaInstall, usePushToken } from "@/hooks/usePwa";
import {
  LogOut,
  Monitor,
  Home,
  ChevronRight,
  Bell,
  Download,
  Smartphone,
  Key,
  Copy,
  Check,
  Trash2,
} from "lucide-react";

export function SettingsMobilePanel() {
  const { settings, loading, error, 알림_플래그를_토글_한다 } = useSettings();
  const { households } = useDashboard();
  const prefix = useAppRoutePrefix();
  const router = useRouter();

  const pathname = usePathname();
  const isMock = pathname.startsWith("/mock");

  const mockUser = useSyncExternalStore(
    subscribeMockSettingsAccountUser,
    getMockSettingsAccountUserSnapshot,
    () => ({ email: "", displayName: "", emailVerified: false }),
  );
  const authUser = useSyncExternalStore(
    subscribeAuthUser,
    getAuthUserSnapshot,
    () => null,
  );
  const user = isMock
    ? mockUser
    : authUser ?? { email: "", displayName: "", emailVerified: false };

  // PWA 설치
  const { state: pwaState, 설치를_요청한다 } = usePwaInstall();

  // 푸시 토큰 관리
  const {
    token: pushToken,
    loading: pushRequesting,
    토큰을_발급한다,
    토큰을_삭제한다,
  } = usePushToken();

  const pushEnabled = !!pushToken;

  const [tokenCopied, setTokenCopied] = useState(false);

  const handlePushToggle = useCallback(async () => {
    if (pushEnabled) {
      토큰을_삭제한다();
      return;
    }
    const token = await 토큰을_발급한다();
    if (!token && "Notification" in window) {
      alert("브라우저 설정에서 알림을 허용해 주세요.");
    }
  }, [pushEnabled, 토큰을_발급한다, 토큰을_삭제한다]);

  const handleCopyToken = useCallback(() => {
    if (!pushToken) return;
    navigator.clipboard.writeText(pushToken).then(() => {
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    });
  }, [pushToken]);

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

      {/* 앱 설치 & 토큰 관리 */}
      <div className="flex flex-col gap-1">
        <h3 className="px-1 pb-1 text-xs font-medium tracking-wide text-zinc-500">
          앱 설치 / 푸시 토큰
        </h3>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900">
          {/* PWA 설치 상태 */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Smartphone className="size-4 text-zinc-400" />
            <span className="flex-1 text-sm text-zinc-200">앱 설치 상태</span>
            {pwaState === "installed" ? (
              <span className="rounded-full bg-teal-500/15 px-2.5 py-0.5 text-xs font-medium text-teal-400">
                설치됨
              </span>
            ) : pwaState === "installable" ? (
              <button
                type="button"
                onClick={설치를_요청한다}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-500 active:bg-teal-700"
              >
                <Download className="size-3" />
                설치
              </button>
            ) : (
              <span className="text-xs text-zinc-500">
                {pwaState === "dismissed" ? "나중에" : "대기 중"}
              </span>
            )}
          </div>

          <div className="mx-4 h-px bg-zinc-800" />

          {/* 푸시 토큰 상태 */}
          <div className="flex flex-col gap-2 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <Key className="size-4 text-zinc-400" />
              <span className="flex-1 text-sm text-zinc-200">푸시 토큰</span>
              {pushToken ? (
                <span className="rounded-full bg-teal-500/15 px-2.5 py-0.5 text-xs font-medium text-teal-400">
                  활성
                </span>
              ) : (
                <span className="rounded-full bg-zinc-700/50 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
                  미발급
                </span>
              )}
            </div>

            {pushToken && (
              <div className="flex items-center gap-2 rounded-lg bg-zinc-800/60 px-3 py-2">
                <code className="flex-1 truncate text-xs text-zinc-400">
                  {pushToken}
                </code>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-300"
                  aria-label="토큰 복사"
                >
                  {tokenCopied ? (
                    <Check className="size-3.5 text-teal-400" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={토큰을_삭제한다}
                  className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-rose-400"
                  aria-label="토큰 삭제"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            )}

            {!pushToken && (
              <button
                type="button"
                onClick={토큰을_발급한다}
                disabled={pushRequesting}
                className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-teal-600/40 bg-teal-600/10 px-3 py-2 text-xs font-semibold text-teal-400 transition-colors hover:bg-teal-600/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Key className="size-3.5" />
                {pushRequesting ? "발급 중…" : "토큰 발급하기"}
              </button>
            )}
          </div>
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

      {/* 안내 */}
      <div className="flex flex-col gap-2">
        {pwaState !== "installed" && (
          <div className="flex items-start gap-3 rounded-xl border border-teal-800/40 bg-teal-950/30 p-4">
            <Download className="mt-0.5 size-4 shrink-0 text-teal-500" />
            <p className="text-xs leading-relaxed text-teal-400/80">
              앱을 설치하면 푸시 알림을 받을 수 있고, 오프라인에서도 기본 기능을
              이용할 수 있어요.
            </p>
          </div>
        )}
        <div className="flex items-start gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
          <Monitor className="mt-0.5 size-4 shrink-0 text-zinc-500" />
          <p className="text-xs leading-relaxed text-zinc-500">
            카탈로그 관리, 멤버 초대/역할 변경, 비밀번호 변경 등 상세 설정은
            데스크탑에서 이용해 주세요.
          </p>
        </div>
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
